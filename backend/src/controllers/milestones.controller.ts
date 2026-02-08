import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const createMilestoneSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    due_date: z.string(),
    status: z.enum(['pending', 'in_progress', 'completed']).default('pending')
});

const updateMilestoneSchema = createMilestoneSchema.partial();

export const listMilestones = asyncHandler(async (req: Request, res: Response) => {
    const { id: projectId } = req.params;

    const { data: milestones, error } = await supabaseAdmin
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('due_date', { ascending: true });

    if (error) {
        throw new AppError(500, 'Failed to fetch milestones');
    }

    res.json({
        success: true,
        data: milestones
    });
});

export const createMilestone = asyncHandler(async (req: Request, res: Response) => {
    const { id: projectId } = req.params;

    try {
        const milestoneData = createMilestoneSchema.parse(req.body);

        // Security Check: User must be a member of the project to create a milestone
        const { data: membership } = await supabaseAdmin
            .from('project_members')
            .select('role')
            .eq('project_id', projectId)
            .eq('user_id', req.user!.id)
            .single();

        // Also allow if they are the mentor of the team assigned to the project
        // (This part is complex, for now let's stick to explicit membership or if they created the project)
        // Actually, if the user is a student, they MUST be a member.

        // Simpler check: If not found, deny (unless admin, but admins might not be members explicitly yet? 
        // Admins usually bypass, but here we want to be safe. Admins should be able to do anything.
        // But for Students, this check is vital.)

        if (req.user?.role === 'student' && !membership) {
            throw new AppError(403, 'You must be a member of the project to create milestones');
        }

        const { data: milestone, error } = await supabaseAdmin
            .from('milestones')
            .insert({
                ...milestoneData,
                project_id: projectId
            })
            .select()
            .single();

        if (error) {
            console.error("[CreateMilestone] DB Error:", error);
            throw new AppError(500, 'Failed to create milestone: ' + error.message);
        }

        res.status(201).json({
            success: true,
            data: milestone
        });
    } catch (err: any) {
        console.error("[CreateMilestone] Exception:", err);
        if (err instanceof z.ZodError) {
            throw new AppError(400, 'Invalid data: ' + JSON.stringify(err.errors));
        }
        if (err instanceof AppError) throw err;
        throw new AppError(500, 'Internal Server Error');
    }
});

export const updateMilestone = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = updateMilestoneSchema.parse(req.body);

    const { data: milestone, error } = await supabaseAdmin
        .from('milestones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new AppError(500, 'Failed to update milestone');
    }

    res.json({
        success: true,
        data: milestone
    });
});

export const deleteMilestone = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { error } = await supabaseAdmin
        .from('milestones')
        .delete()
        .eq('id', id);

    if (error) {
        throw new AppError(500, 'Failed to delete milestone');
    }

    res.json({
        success: true,
        message: 'Milestone deleted successfully'
    });
});
