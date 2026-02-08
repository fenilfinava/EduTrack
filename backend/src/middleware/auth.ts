import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from './errorHandler';
import { UserRole } from '../types';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: UserRole;
            };
        }
    }
}

export const authenticate = async (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError(401, 'No token provided');
        }

        const token = authHeader.substring(7);

        // Verify JWT token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            throw new AppError(401, 'Invalid or expired token');
        }

        // Get user profile with role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            throw new AppError(401, 'User profile not found');
        }

        // Attach user info to request
        req.user = {
            id: user.id,
            email: user.email!,
            role: profile.role as UserRole
        };

        next();
    } catch (error) {
        next(error);
    }
};

// Role-based authorization middleware
export const authorize = (...allowedRoles: UserRole[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError(401, 'Not authorized'));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(new AppError(403, 'Forbidden: Insufficient permissions'));
        }

        next();
    };
};
