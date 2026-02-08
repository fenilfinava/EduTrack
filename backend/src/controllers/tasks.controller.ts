import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const createTaskSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    milestone_id: z.string().uuid().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    status: z.enum(['todo', 'in_progress', 'in_review', 'completed']).default('todo'),
    assignee_id: z.string().uuid().optional(),
    due_date: z.string().optional()
});

const updateTaskSchema = createTaskSchema.partial();

export const getTask = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { data: task, error } = await supabaseAdmin
        .from('tasks')
        .select(`
      *,
      assignee:profiles!assignee_id(id, name, email, avatar_url),
      milestone:milestones(id, title),
      project:projects(id, title)
    `)
        .eq('id', id)
        .single();

    if (error || !task) {
        throw new AppError(404, 'Task not found');
    }

    res.json({
        success: true,
        data: task
    });
});

export const listTasks = asyncHandler(async (req: Request, res: Response) => {
    const { id: projectId } = req.params;

    const { data: tasks, error } = await supabaseAdmin
        .from('tasks')
        .select(`
      *,
      assignee:profiles!assignee_id(id, name, email, avatar_url),
      milestone:milestones(id, title)
    `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

    if (error) {
        throw new AppError(500, 'Failed to fetch tasks');
    }

    res.json({
        success: true,
        data: tasks
    });
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
    const { id: projectId } = req.params;
    const taskData = createTaskSchema.parse(req.body);

    const { data: task, error } = await supabaseAdmin
        .from('tasks')
        .insert({
            ...taskData,
            project_id: projectId
        })
        .select(`
      *,
      assignee:profiles!assignee_id(id, name, email, avatar_url)
    `)
        .single();

    if (error) {
        throw new AppError(500, 'Failed to create task');
    }

    res.status(201).json({
        success: true,
        data: task
    });
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = updateTaskSchema.parse(req.body);

    const { data: task, error } = await supabaseAdmin
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select(`
      *,
      assignee:profiles!assignee_id(id, name, email, avatar_url)
    `)
        .single();

    if (error) {
        throw new AppError(500, 'Failed to update task');
    }

    res.json({
        success: true,
        data: task
    });
});

export const updateTaskStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = z.object({
        status: z.enum(['todo', 'in_progress', 'in_review', 'completed'])
    }).parse(req.body);

    const { data: task, error } = await supabaseAdmin
        .from('tasks')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new AppError(500, 'Failed to update task status');
    }

    res.json({
        success: true,
        data: task
    });
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { error } = await supabaseAdmin
        .from('tasks')
        .delete()
        .eq('id', id);

    if (error) {
        throw new AppError(500, 'Failed to delete task');
    }

    res.json({
        success: true,
        message: 'Task deleted successfully'
    });
});
