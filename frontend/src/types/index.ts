export type UserRole = 'student' | 'mentor' | 'admin';

export interface User {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
    role: UserRole;
    bio?: string;
    github_handle?: string;
}

export interface Project {
    id: string;
    title: string;
    description: string;
    status: 'planning' | 'active' | 'completed' | 'on_hold';
    start_date: string;
    end_date?: string;
    github_repo_url?: string;
    created_at: string;
    updated_at: string;
}

export interface Task {
    id: string;
    project_id: string;
    milestone_id?: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'in_review' | 'completed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    assignee_id?: string;
    due_date?: string;
    created_at: string;
    updated_at: string;
}

export interface Milestone {
    id: string;
    project_id: string;
    title: string;
    description?: string;
    due_date: string;
    status: 'pending' | 'completed';
}
