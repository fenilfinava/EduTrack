import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const createProjectSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    github_repo_url: z.string().url().optional().or(z.literal('')),
    status: z.enum(['planning', 'active', 'completed', 'archived']).optional(),
    team_id: z.string().uuid().optional() // New field
});

const updateProjectSchema = createProjectSchema.partial();

const addMemberSchema = z.object({
    user_id: z.string().uuid(),
    role: z.enum(['owner', 'member']).optional()
});

export const listProjects = asyncHandler(async (req: Request, res: Response) => {
    let query = supabaseAdmin
        .from('projects')
        .select(`
      *,
      created_by_profile:profiles!created_by(id, name, email),
      project_members(
        user_id,
        role,
        user:profiles(id, name, email, avatar_url)
      ),
      teams(id, name, mentor_id)
    `)
        .order('created_at', { ascending: false });

    if (req.user?.role === 'mentor') {
        // Mentors see projects where:
        // 1. They created it
        // 2. They are a member
        // 3. It belongs to one of their teams
        const { data: myTeams } = await supabaseAdmin
            .from('teams')
            .select('id')
            .eq('mentor_id', req.user.id);

        const teamIds = myTeams?.map(t => t.id) || [];

        // This OR logic is complex with strict RLS, but here we construct a query
        // We want: created_by = me OR project_members.user_id = me OR team_id IN myTeams

        // Simplified approach: Fetch all relevant projects and merge in memory if needed, 
        // or use Supabase's 'or' filter if possible.
        // Let's use 'or' filter string
        let orCondition = `created_by.eq.${req.user.id}`;
        if (teamIds.length > 0) {
            orCondition += `,team_id.in.(${teamIds.join(',')})`;
        }
        // Member check is harder to combine with OR in single query on 'projects' table directly 
        // without join filtering.
        // Let's stick to: If you are a mentor, you see projects for your teams. 
        // Plus projects you are explicitly added to.

        // Fetch projects where I am a member
        const { data: memberProjects } = await supabaseAdmin
            .from('project_members')
            .select('project_id')
            .eq('user_id', req.user.id);
        const memberProjectIds = memberProjects?.map(p => p.project_id) || [];

        if (teamIds.length > 0 || memberProjectIds.length > 0) {
            let conditions = [`created_by.eq.${req.user.id}`];
            if (teamIds.length > 0) conditions.push(`team_id.in.(${teamIds.join(',')})`);
            if (memberProjectIds.length > 0) conditions.push(`id.in.(${memberProjectIds.join(',')})`);

            query = query.or(conditions.join(','));
        } else {
            query = query.eq('created_by', req.user.id);
        }

    } else if (req.user?.role === 'student') {
        // Students see projects they are members of OR projects belonging to their team (optional)
        // Usually students are explicit members.
        const { data: memberProjects } = await supabaseAdmin
            .from('project_members')
            .select('project_id')
            .eq('user_id', req.user.id);

        const projectIds = memberProjects?.map(pm => pm.project_id) || [];

        // Also check if they are in a team that owns a project?
        // Maybe projects are assigned to the whole team.
        const { data: myTeams } = await supabaseAdmin
            .from('team_members')
            .select('team_id')
            .eq('user_id', req.user.id);
        const myTeamIds = myTeams?.map(t => t.team_id) || [];

        let conditions = [];
        if (projectIds.length > 0) conditions.push(`id.in.(${projectIds.join(',')})`);
        if (myTeamIds.length > 0) conditions.push(`team_id.in.(${myTeamIds.join(',')})`);

        if (conditions.length > 0) {
            query = query.or(conditions.join(','));
        } else {
            res.json({ success: true, data: [] });
            return;
        }
    }

    const { data: projects, error } = await query;

    if (error) {
        throw new AppError(500, 'Failed to fetch projects');
    }

    res.json({
        success: true,
        data: projects
    });
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
    try {
        const projectData = createProjectSchema.parse(req.body);

        // Strict Project Creation Rules:
        // 1. Mentors cannot create projects (strict requirement)
        // 2. Students and Admins can create projects

        if (req.user?.role === 'mentor') {
            throw new AppError(403, 'Mentors are not allowed to create projects. This is a student-led activity.');
        }

        // Student Team Validation
        if (projectData.team_id && req.user?.role === 'student') {
            const { data: membership, error: memError } = await supabaseAdmin
                .from('team_members')
                .select('id')
                .eq('team_id', projectData.team_id)
                .eq('user_id', req.user.id)
                .single();

            if (memError || !membership) {
                console.error("[CreateProject] Student not in team:", memError);
                throw new AppError(403, 'You can only assign projects to teams you are a member of');
            }
        }

        const { data: project, error } = await supabaseAdmin
            .from('projects')
            .insert({
                ...projectData,
                created_by: req.user!.id
            })
            .select()
            .single();

        if (error) {
            console.error("[CreateProject] DB Insert Error:", error);
            throw new AppError(500, 'Failed to create project: ' + error.message);
        }

        // Add creator as project owner
        const { error: memberError } = await supabaseAdmin
            .from('project_members')
            .insert({
                project_id: project.id,
                user_id: req.user!.id,
                role: 'owner'
            });

        if (memberError) {
            console.error("[CreateProject] Member Add Error:", memberError);
            // Verify if we should rollback or just warn
        }

        res.status(201).json({
            success: true,
            data: project
        });
    } catch (err: any) {
        console.error("[CreateProject] Exception:", err);
        if (err instanceof z.ZodError) {
            throw new AppError(400, 'Invalid data: ' + JSON.stringify(err.errors));
        }
        if (err instanceof AppError) throw err;
        throw new AppError(500, 'Internal Server Error: ' + err.message);
    }
});


export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { data: project, error } = await supabaseAdmin
        .from('projects')
        .select(`
      *,
      created_by_profile:profiles!created_by(id, name, email),
      project_members(
        user_id,
        role,
        user:profiles(id, name, email, avatar_url)
      ),
      teams(id, name, mentor_id),
      milestones(id, title, status, due_date),
      tasks(id, title, status, priority)
    `)
        .eq('id', id)
        .single();

    if (error || !project) {
        throw new AppError(404, 'Project not found');
    }

    // Access Control Logic
    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (userRole === 'admin') {
        // Admin can access everything
    } else if (userRole === 'mentor') {
        // Mentor can access if:
        // 1. Creator
        // 2. Project Member
        // 3. Mentor of the linked Team
        const isCreator = project.created_by === userId;
        const isMember = project.project_members.some((pm: any) => pm.user_id === userId);
        const isTeamMentor = project.teams?.mentor_id === userId;

        if (!isCreator && !isMember && !isTeamMentor) {
            throw new AppError(403, 'Forbidden: You do not have access to this project');
        }
    } else if (userRole === 'student') {
        // Student can access if:
        // 1. Project Member
        const isMember = project.project_members.some((pm: any) => pm.user_id === userId);
        if (!isMember) {
            // Also check if team member? Usually explicit project membership is required.
            // If strict requirement says "Student assigns project to team", they should be a member.
            throw new AppError(403, 'Forbidden: You are not a member of this project');
        }
    }

    res.json({
        success: true,
        data: project
    });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = updateProjectSchema.parse(req.body);

    const { data: project, error } = await supabaseAdmin
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new AppError(500, 'Failed to update project');
    }

    res.json({
        success: true,
        data: project
    });
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { error } = await supabaseAdmin
        .from('projects')
        .delete()
        .eq('id', id);

    if (error) {
        throw new AppError(500, 'Failed to delete project');
    }

    res.json({
        success: true,
        message: 'Project deleted successfully'
    });
});

export const addProjectMember = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { user_id, role = 'member' } = addMemberSchema.parse(req.body);

    const { data: member, error } = await supabaseAdmin
        .from('project_members')
        .insert({
            project_id: id,
            user_id,
            role
        })
        .select(`
      *,
      user:profiles(id, name, email, avatar_url)
    `)
        .single();

    if (error) {
        if (error.code === '23505') {
            throw new AppError(400, 'User is already a member of this project');
        }
        throw new AppError(500, 'Failed to add member');
    }

    res.status(201).json({
        success: true,
        data: member
    });
});

export const removeProjectMember = asyncHandler(async (req: Request, res: Response) => {
    const { id, userId } = req.params;

    const { error } = await supabaseAdmin
        .from('project_members')
        .delete()
        .eq('project_id', id)
        .eq('user_id', userId);

    if (error) {
        throw new AppError(500, 'Failed to remove member');
    }

    res.json({
        success: true,
        message: 'Member removed successfully'
    });
});
