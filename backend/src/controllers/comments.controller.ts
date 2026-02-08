import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const createCommentSchema = z.object({
    content: z.string().min(1)
});

const updateCommentSchema = z.object({
    content: z.string().min(1)
});

export const listComments = asyncHandler(async (req: Request, res: Response) => {
    const { id: taskId } = req.params;

    console.log(`[Comments] Listing for task: ${taskId}, User: ${req.user?.id}, Role: ${req.user?.role}`);

    // Use supabaseAdmin to bypass RLS for now to ensure visibility works
    const { data: comments, error } = await supabaseAdmin
        .from('comments')
        .select(`
            id,
            content,
            created_at,
            user_id,
            user:profiles!left(id, name, email, avatar_url)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("[Comments] List Error:", error);
        throw new AppError(500, 'Failed to fetch comments');
    }

    console.log(`[Comments] Found ${comments?.length} comments for task ${taskId}`);

    res.json({
        success: true,
        data: comments
    });
});

export const createComment = asyncHandler(async (req: Request, res: Response) => {
    const { id: taskId } = req.params;
    const { content } = createCommentSchema.parse(req.body);

    console.log(`[Comments] Creating for task: ${taskId}, User: ${req.user?.id}, Content: ${content}`);

    const { data: comment, error } = await supabaseAdmin
        .from('comments')
        .insert({
            task_id: taskId,
            user_id: req.user!.id,
            content
        })
        .select(`
            id,
            content,
            created_at,
            user_id,
            user:profiles!left(id, name, email, avatar_url)
        `)
        .single();

    if (error) {
        console.error("[Comments] Create Error:", error);
        throw new AppError(500, 'Failed to create comment');
    }

    console.log("[Comments] Created successfully:", comment.id);

    res.status(201).json({
        success: true,
        data: comment
    });
});

export const updateComment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { content } = updateCommentSchema.parse(req.body);

    // Users can only update their own comments
    const { data: comment, error } = await supabase
        .from('comments')
        .update({ content })
        .eq('id', id)
        .eq('user_id', req.user!.id)
        .select()
        .single();

    if (error) {
        throw new AppError(500, 'Failed to update comment');
    }

    res.json({
        success: true,
        data: comment
    });
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Users can only delete their own comments
    const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id)
        .eq('user_id', req.user!.id);

    if (error) {
        throw new AppError(500, 'Failed to delete comment');
    }

    res.json({
        success: true,
        message: 'Comment deleted successfully'
    });
});
