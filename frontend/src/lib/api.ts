const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

class ApiClient {
    private baseURL: string;
    private token: string | null = null;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    private getToken(): string | null {
        // Always check localStorage for latest token
        if (typeof window !== 'undefined') {
            return localStorage.getItem('access_token') || this.token;
        }
        return this.token;
    }

    setToken(token: string | null) {
        this.token = token;
        if (typeof window !== 'undefined') {
            if (token) {
                localStorage.setItem('access_token', token);
            } else {
                localStorage.removeItem('access_token');
            }
        }
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        const currentToken = this.getToken();
        if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers,
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || 'Request failed'
                };
            }

            return data;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Network error'
            };
        }
    }

    // Auth endpoints
    async register(email: string, password: string, name: string, role = 'student') {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name, role }),
        });
    }

    async login(email: string, password: string) {
        const response = await this.request<{ user: { id: string; email: string; role?: string }; session: { access_token: string } }>(
            '/auth/login',
            {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            }
        );

        if (response.data?.session?.access_token) {
            this.setToken(response.data.session.access_token);
        }

        return response;
    }

    async logout() {
        const response = await this.request('/auth/logout', { method: 'POST' });
        this.setToken(null);
        return response;
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    async syncProfile(userId: string, email: string, name: string, role: string) {
        return this.request('/auth/sync-profile', {
            method: 'POST',
            body: JSON.stringify({ user_id: userId, email, name, role }),
        });
    }

    async getUsers() {
        return this.request('/users');
    }

    async createUser(data: any) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateUserStatus(userId: string, isActive: boolean) {
        return this.request(`/users/${userId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ is_active: isActive })
        });
    }

    async getSystemStats() {
        return this.request('/audit/metrics');
    }

    async getAuditLogs() {
        return this.request('/audit');
    }

    async listMentors() {
        // Simple filter on client side or backend if parameter supported
        // For now, let's fetch all users and filter in component, or if backend supports it
        // We implemented listUsers in users.controller.ts which returns all.
        return this.request('/users');
    }

    // Projects endpoints
    async getProjects() {
        return this.request('/projects');
    }

    async getProject(id: string) {
        return this.request(`/projects/${id}`);
    }

    async createProject(data: Record<string, unknown>) {
        return this.request('/projects', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateProject(id: string, data: Record<string, unknown>) {
        return this.request(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // Tasks endpoints
    async getTasks(projectId: string) {
        return this.request(`/projects/${projectId}/tasks`);
    }

    async createTask(projectId: string, data: Record<string, unknown>) {
        return this.request(`/projects/${projectId}/tasks`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getTask(id: string) {
        return this.request(`/tasks/${id}`);
    }

    async updateTask(id: string, data: Record<string, unknown>) {
        return this.request(`/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async updateTaskStatus(id: string, status: string) {
        return this.request(`/tasks/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }

    // GitHub endpoints
    async syncGitHub(projectId: string) {
        return this.request(`/github/sync/${projectId}`, { method: 'POST' });
    }

    async getGitHubCommits(projectId: string) {
        return this.request(`/github/commits/${projectId}`);
    }

    async getGitHubContributors(projectId: string) {
        return this.request(`/github/contributors/${projectId}`);
    }

    async getGitHubPullRequests(projectId: string) {
        return this.request(`/github/pull-requests/${projectId}`);
    }

    // Evaluations endpoints
    async createEvaluation(data: Record<string, unknown>) {
        return this.request('/evaluations', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getStudentEvaluations(studentId: string) {
        return this.request(`/evaluations/student/${studentId}`);
    }

    async getEvaluations() {
        return this.request('/evaluations');
    }

    // Milestone endpoints
    async getMilestones(projectId: string) {
        return this.request(`/projects/${projectId}/milestones`);
    }

    async createMilestone(projectId: string, data: Record<string, unknown>) {
        return this.request(`/projects/${projectId}/milestones`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateMilestone(id: string, data: Record<string, unknown>) {
        return this.request(`/milestones/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // Comments endpoints
    async getComments(taskId: string) {
        return this.request(`/tasks/${taskId}/comments`);
    }

    async createComment(taskId: string, content: string) {
        return this.request(`/tasks/${taskId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    }

    // Teams endpoints
    async createTeam(data: Record<string, unknown>) {
        return this.request('/teams', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateTeam(id: string, data: Record<string, unknown>) {
        return this.request(`/teams/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async getTeams() {
        return this.request('/teams');
    }

    async getTeam(id: string) {
        return this.request(`/teams/${id}`);
    }

    async addTeamMember(teamId: string, userId: string) {
        return this.request(`/teams/${teamId}/members`, {
            method: 'POST',
            body: JSON.stringify({ user_id: userId }),
        });
    }

    async removeTeamMember(teamId: string, userId: string) {
        return this.request(`/teams/${teamId}/members/${userId}`, {
            method: 'DELETE',
        });
    }
}

export const apiClient = new ApiClient(API_URL);
