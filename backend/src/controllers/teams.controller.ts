
import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const createTeamSchema = z.object({
    name: z.string().min(2),
    student_ids: z.array(z.string().uuid()).min(1),
    mentor_id: z.string().uuid().optional() // Optional for Admin, inferred for Mentor
});

export const createTeam = asyncHandler(async (req: Request, res: Response) => {
    const { name, student_ids, mentor_id: providedMentorId } = createTeamSchema.parse(req.body);

    let mentorId = req.user?.id;

    // Admin can specify mentor, otherwise it must be the current user (if mentor)
    if (req.user?.role === 'admin') {
        if (!providedMentorId) {
            throw new AppError(400, 'Admin must specify a mentor_id');
        }
        mentorId = providedMentorId;
    } else if (req.user?.role !== 'mentor') {
        throw new AppError(403, 'Only admins and mentors can create teams');
    }

    // 1. Create Team
    const { data: team, error: teamError } = await supabaseAdmin
        .from('teams')
        .insert({
            name,
            mentor_id: mentorId
        })
        .select()
        .single();

    if (teamError) {
        throw new AppError(500, 'Failed to create team');
    }

    // 2. Add Members (Students)
    const membersData = student_ids.map(studentId => ({
        team_id: team.id,
        user_id: studentId
    }));

    const { error: membersError } = await supabaseAdmin
        .from('team_members')
        .insert(membersData);

    if (membersError) {
        // Rollback team creation? Or just fail partially. For now, throw error.
        throw new AppError(500, 'Failed to add team members');
    }

    res.status(201).json({
        success: true,
        data: team
    });
    res.status(201).json({
        success: true,
        data: team
    });
});

const updateTeamSchema = z.object({
    name: z.string().min(2).optional(),
    mentor_id: z.string().uuid().optional()
});

export const updateTeam = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = updateTeamSchema.parse(req.body);

    // Only Admin can update team details (like mentor)
    if (req.user?.role !== 'admin') {
        throw new AppError(403, 'Only admins can update teams');
    }

    const { data: team, error } = await supabaseAdmin
        .from('teams')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new AppError(500, 'Failed to update team');
    }

    res.json({
        success: true,
        data: team
    });
});

export const listTeams = asyncHandler(async (req: Request, res: Response) => {
    let query = supabaseAdmin
        .from('teams')
        .select(`
            *,
            mentor:profiles!mentor_id(id, name, email, avatar_url),
            team_members(
                user:profiles(id, name, email, avatar_url)
            ),
            projects(count)
        `)
        .order('created_at', { ascending: false });

    // Filter based on role
    if (req.user?.role === 'mentor') {
        query = query.eq('mentor_id', req.user.id);
    } else if (req.user?.role === 'student') {
        // Students see teams they are members of
        // This requires a join or two-step query. supabase-js syntax for value in foreign table array is tricky.
        // Simplest: fetch team_ids for student first.
        const { data: memberships } = await supabaseAdmin
            .from('team_members')
            .select('team_id')
            .eq('user_id', req.user.id);

        const teamIds = memberships?.map(m => m.team_id) || [];
        if (teamIds.length === 0) {
            res.json({ success: true, data: [] });
            return;
        }
        query = query.in('id', teamIds);
    }

    const { data: teams, error } = await query;

    if (error) {
        throw new AppError(500, 'Failed to fetch teams');
    }

    res.json({
        success: true,
        data: teams
    });
});

export const getTeam = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { data: team, error } = await supabaseAdmin
        .from('teams')
        .select(`
            *,
            mentor:profiles!mentor_id(id, name, email, avatar_url),
            team_members(
                user:profiles(id, name, email, avatar_url)
            ),
            projects(*)
        `)
        .eq('id', id)
        .single();

    if (error || !team) {
        throw new AppError(404, 'Team not found');
    }

    // Access control:
    // Admin: access all
    // Mentor: access owned
    // Student: access if member
    if (req.user?.role === 'mentor' && team.mentor_id !== req.user.id) {
        throw new AppError(403, 'Forbidden');
    }
    if (req.user?.role === 'student') {
        const isMember = team.team_members.some((m: any) => m.user.id === req.user?.id);
        if (!isMember) {
            throw new AppError(403, 'Forbidden');
        }
    }

    res.json({
        success: true,
        data: team
    });
});

const addMemberSchema = z.object({
    user_id: z.string().uuid()
});

export const addMember = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { user_id } = addMemberSchema.parse(req.body);

    // Verify team exists and user has permission (Admin or Mentor of the team)
    const { data: team, error: teamError } = await supabaseAdmin
        .from('teams')
        .select('mentor_id')
        .eq('id', id)
        .single();

    if (teamError || !team) {
        throw new AppError(404, 'Team not found');
    }

    if (req.user?.role !== 'admin' && (req.user?.role !== 'mentor' || team.mentor_id !== req.user.id)) {
        throw new AppError(403, 'Forbidden: You can only add members to your own teams');
    }

    // Add member
    const { data: member, error } = await supabaseAdmin
        .from('team_members')
        .insert({
            team_id: id,
            user_id
        })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            throw new AppError(400, 'User is already a member of this team');
        }
        throw new AppError(500, 'Failed to add member to team');
    }

    res.status(201).json({
        success: true,
        data: member
    });
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
    const { id, userId } = req.params;

    // Verify team exists and user has permission (Admin or Mentor of the team)
    const { data: team, error: teamError } = await supabaseAdmin
        .from('teams')
        .select('mentor_id')
        .eq('id', id)
        .single();

    if (teamError || !team) {
        throw new AppError(404, 'Team not found');
    }

    if (req.user?.role !== 'admin' && (req.user?.role !== 'mentor' || team.mentor_id !== req.user.id)) {
        throw new AppError(403, 'Forbidden: You can only remove members from your own teams');
    }

    const { error } = await supabaseAdmin
        .from('team_members')
        .delete()
        .eq('team_id', id)
        .eq('user_id', userId);

    if (error) {
        throw new AppError(500, 'Failed to remove member from team');
    }

    res.json({
        success: true,
        message: 'Member removed successfully'
    });
});
