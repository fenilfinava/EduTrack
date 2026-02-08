
import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { z } from 'zod';

// Schema for creating/updating an evaluation
const evaluationSchema = z.object({
    student_id: z.string().uuid(),
    project_id: z.string().uuid().optional(),
    score: z.number().min(0).max(100),
    criteria: z.record(z.any()).optional(), // Flexible JSON for criteria
    comments: z.string().optional()
});

export const createEvaluation = asyncHandler(async (req: Request, res: Response) => {
    console.log("createEvaluation called with body:", req.body);
    // Only mentors can create evaluations
    if (req.user?.role !== 'mentor') {
        throw new AppError(403, 'Only mentors can create evaluations');
    }

    const { student_id, project_id, score, criteria, comments } = evaluationSchema.parse(req.body);

    // Verify student exists
    const { data: student, error: studentError } = await supabaseAdmin
        .from('profiles')
        .select('id, role')
        .eq('id', student_id)
        .single();

    if (studentError || !student) {
        throw new AppError(404, 'Student not found');
    }

    // Upsert evaluation (unique by student_id, project_id, mentor_id)
    const { data: evaluation, error } = await supabaseAdmin
        .from('evaluations')
        .upsert({
            student_id,
            mentor_id: req.user.id,
            project_id,
            score,
            criteria,
            comments
        })
        .select()
        .single();

    if (error) {
        console.error("Evaluation error:", error);
        throw new AppError(500, `Failed to save evaluation: ${error.message}`);
    }

    res.status(201).json({
        success: true,
        data: evaluation
    });
});

export const getEvaluations = asyncHandler(async (req: Request, res: Response) => {
    let query = supabaseAdmin
        .from('evaluations')
        .select(`
            *,
            student:profiles!student_id(id, name, email, avatar_url),
            mentor:profiles!mentor_id(id, name, email, avatar_url),
            project:projects(id, title)
        `)
        .order('created_at', { ascending: false });

    // Filter based on role
    if (req.user?.role === 'student') {
        // Students can only see their own evaluations
        query = query.eq('student_id', req.user.id);
    } else if (req.user?.role === 'mentor') {
        // Mentors see evaluations they created OR evaluations for their students (if implemented)
        // For strictness: Mentors see what they created
        query = query.eq('mentor_id', req.user.id);
    }
    // Admins see all (no filter needed)

    const { data: evaluations, error } = await query;

    if (error) {
        throw new AppError(500, 'Failed to fetch evaluations');
    }

    res.json({
        success: true,
        data: evaluations
    });
});

export const getStudentEvaluation = asyncHandler(async (req: Request, res: Response) => {
    const { studentId } = req.params;

    // Check permissions
    if (req.user?.role === 'student' && req.user.id !== studentId) {
        throw new AppError(403, 'You can only view your own evaluations');
    }

    const { data: evaluations, error } = await supabaseAdmin
        .from('evaluations')
        .select(`
            *,
            mentor:profiles!mentor_id(id, name, email, avatar_url),
            project:projects(id, title)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

    if (error) {
        throw new AppError(500, 'Failed to fetch student evaluations');
    }

    res.json({
        success: true,
        data: evaluations
    });
});
