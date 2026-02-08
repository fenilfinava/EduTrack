import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { z } from 'zod';

// Validation schemas
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.enum(['student', 'mentor', 'admin']).optional()
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

export const register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name, role = 'student' } = registerSchema.parse(req.body);

    // Create auth user with Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (authError || !authData.user) {
        throw new AppError(400, authError?.message || 'Failed to create user');
    }

    // Create profile in database
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
            id: authData.user.id,
            email,
            name,
            role
        });

    if (profileError) {
        // Rollback: delete auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw new AppError(500, 'Failed to create user profile');
    }

    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            id: authData.user.id,
            email,
            name,
            role
        }
    });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    console.log('[Auth] Login attempt:', req.body.email);
    const { email, password } = loginSchema.parse(req.body);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error || !data.user) {
        throw new AppError(401, 'Invalid credentials');
    }

    // Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, name, role, avatar_url')
        .eq('id', data.user.id)
        .single();

    res.json({
        success: true,
        data: {
            user: profile,
            session: {
                access_token: data.session?.access_token,
                refresh_token: data.session?.refresh_token
            }
        }
    });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);

    if (token) {
        await supabase.auth.signOut();
    }

    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', req.user.id)
        .single();

    res.json({
        success: true,
        data: profile
    });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
        throw new AppError(400, 'Refresh token required');
    }

    const { data, error } = await supabase.auth.refreshSession({
        refresh_token
    });

    if (error) {
        throw new AppError(401, 'Invalid refresh token');
    }

    res.json({
        success: true,
        data: {
            access_token: data.session?.access_token,
            refresh_token: data.session?.refresh_token
        }
    });
});

// Sync or create profile for OAuth users
export const syncProfile = asyncHandler(async (req: Request, res: Response) => {
    const { user_id, email, name, role = 'student' } = req.body;

    if (!user_id || !email) {
        throw new AppError(400, 'user_id and email are required');
    }

    // Check if profile exists
    const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user_id)
        .single();

    if (existingProfile) {
        // Profile exists, return it
        res.json({
            success: true,
            data: existingProfile,
            isNew: false
        });
        return;
    }

    // Create new profile
    const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
            id: user_id,
            email,
            name: name || email.split('@')[0],
            role
        })
        .select()
        .single();

    if (insertError) {
        throw new AppError(500, `Failed to create profile: ${insertError.message}`);
    }

    res.status(201).json({
        success: true,
        data: newProfile,
        isNew: true
    });
});

