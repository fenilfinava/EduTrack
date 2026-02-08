
import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { asyncHandler, AppError } from '../middleware/errorHandler';

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
    // Optional: pagination or filtering
    const { limit = 50 } = req.query;

    const { data: logs, error } = await supabaseAdmin
        .from('audit_logs')
        .select(`
            *,
            user:user_id (name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(Number(limit));

    if (error) {
        throw new AppError(500, 'Failed to fetch audit logs');
    }

    res.json({
        success: true,
        data: logs
    });
});

export const getSystemStats = asyncHandler(async (_req: Request, res: Response) => {
    const [
        { count: userCount },
        { count: projectCount },
        { count: taskCount }
    ] = await Promise.all([
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('projects').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true })
    ]);

    // Mock specific health metrics (CPU, Memory) as we are serverless/containerized
    // But we can return "System Status: Healthy"

    res.json({
        success: true,
        data: {
            users: userCount || 0,
            projects: projectCount || 0,
            tasks: taskCount || 0,
            status: 'Operational',
            uptime: process.uptime()
        }
    });
});
