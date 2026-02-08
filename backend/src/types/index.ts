// User roles
export type UserRole = 'student' | 'mentor' | 'admin';

// Database types
export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    github_id?: string;
    avatar_url?: string;
    bio?: string;
    created_at: string;
    updated_at: string;
}

export interface Project {
    id: string;
    title: string;
    description: string;
    status: 'planning' | 'active' | 'completed' | 'archived';
    start_date: string;
    end_date?: string;
    github_repo_url?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface ProjectMember {
    project_id: string;
    user_id: string;
    role: 'owner' | 'member';
    joined_at: string;
}

export interface Milestone {
    id: string;
    project_id: string;
    title: string;
    description?: string;
    due_date: string;
    status: 'pending' | 'in_progress' | 'completed';
    created_at: string;
    updated_at: string;
}

export interface Task {
    id: string;
    project_id: string;
    milestone_id?: string;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'todo' | 'in_progress' | 'in_review' | 'completed';
    assignee_id?: string;
    due_date?: string;
    created_at: string;
    updated_at: string;
}

export interface Comment {
    id: string;
    task_id: string;
    user_id: string;
    content: string;
    created_at: string;
    updated_at: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
