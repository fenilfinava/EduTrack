import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { githubService } from '../services/github.service';

export const syncGitHubData = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params as { projectId: string };

    // Get project with GitHub repo URL
    const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('github_repo_url')
        .eq('id', projectId)
        .single();

    if (projectError || !project) {
        throw new AppError(404, 'Project not found');
    }

    if (!project.github_repo_url) {
        throw new AppError(400, 'Project does not have a GitHub repository URL');
    }

    // Sync commits and PRs
    const [commitCount, prCount] = await Promise.all([
        githubService.syncCommits(projectId, project.github_repo_url as string),
        githubService.syncPullRequests(projectId, project.github_repo_url as string)
    ]);

    res.json({
        success: true,
        data: {
            commits_synced: commitCount,
            pull_requests_synced: prCount
        }
    });
});

export const getCommits = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;

    const { data: commits, error } = await supabaseAdmin
        .from('github_commits')
        .select('*')
        .eq('project_id', projectId)
        .order('timestamp', { ascending: false })
        .limit(100);

    if (error) {
        throw new AppError(500, 'Failed to fetch commits');
    }

    res.json({
        success: true,
        data: commits
    });
});

export const getPullRequests = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;

    const { data: pullRequests, error } = await supabaseAdmin
        .from('github_pull_requests')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        throw new AppError(500, 'Failed to fetch pull requests');
    }

    res.json({
        success: true,
        data: pullRequests
    });
});

export const getContributors = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;

    const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('github_repo_url')
        .eq('id', projectId)
        .single();

    if (projectError || !project || !project.github_repo_url) {
        throw new AppError(404, 'Project or repository URL not found');
    }

    const contributors = await githubService.getContributorStats(project.github_repo_url as string);

    res.json({
        success: true,
        data: contributors
    });
});
