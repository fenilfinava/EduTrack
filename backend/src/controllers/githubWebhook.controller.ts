import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { supabaseAdmin } from '../config/supabase';

interface WebhookPayload {
    repository?: {
        url: string;
    };
    commits?: Array<{
        id: string;
        message: string;
        author: {
            name: string;
            email: string;
        };
        timestamp: string;
    }>;
    pull_request?: {
        number: number;
        title: string;
        state: string;
        user: {
            login: string;
        };
        created_at: string;
        updated_at: string;
    };
    action?: string;
}

export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
    const event = req.headers['x-github-event'] as string;
    const payload: WebhookPayload = req.body;

    // Find project by repository URL
    if (!payload.repository) {
        res.status(200).json({ message: 'No repository in payload' });
        return;
    }

    const { data: project } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('github_repo_url', payload.repository.url)
        .single();

    if (!project) {
        res.status(200).json({ message: 'Project not found for this repository' });
        return;
    }

    const projectId = project.id;

    switch (event) {
        case 'push':
            // Sync commits on push
            if (payload.commits && payload.commits.length > 0) {
                for (const commit of payload.commits) {
                    await supabaseAdmin
                        .from('github_commits')
                        .upsert({
                            project_id: projectId,
                            sha: commit.id,
                            message: commit.message,
                            author: commit.author.name,
                            timestamp: commit.timestamp
                        }, {
                            onConflict: 'project_id,sha'
                        });
                }
            }
            break;

        case 'pull_request':
            // Sync PR data
            if (payload.pull_request) {
                await supabaseAdmin
                    .from('github_pull_requests')
                    .upsert({
                        project_id: projectId,
                        pr_number: payload.pull_request.number,
                        title: payload.pull_request.title,
                        status: payload.pull_request.state,
                        author: payload.pull_request.user.login,
                        created_at: payload.pull_request.created_at,
                        updated_at: payload.pull_request.updated_at
                    }, {
                        onConflict: 'project_id,pr_number'
                    });
            }
            break;

        default:
            // Ignore other events
            break;
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
});
