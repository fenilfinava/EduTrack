import { supabaseAdmin } from '../config/supabase';

interface GitHubCommit {
    sha: string;
    commit: {
        message: string;
        author: {
            name: string;
            date: string;
        };
    };
}

interface GitHubPullRequest {
    number: number;
    title: string;
    state: string;
    user: {
        login: string;
    };
    created_at: string;
    updated_at: string;
    merged_at: string | null;
}

export class GitHubService {
    private baseUrl = 'https://api.github.com';

    private async fetchFromGitHub(url: string): Promise<any> {
        const token = process.env.GITHUB_TOKEN;
        const headers: Record<string, string> = {
            'Accept': 'application/vnd.github.v3+json'
        };

        if (token) {
            headers['Authorization'] = `token ${token}`;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.statusText}`);
        }

        return response.json();
    }

    async syncCommits(projectId: string, repoUrl: string): Promise<number> {
        // Extract owner and repo from GitHub URL
        const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) {
            throw new Error('Invalid GitHub repository URL');
        }

        const [, owner, repo] = match;
        const repoName = repo.replace('.git', '');

        const commits: GitHubCommit[] = await this.fetchFromGitHub(
            `${this.baseUrl}/repos/${owner}/${repoName}/commits?per_page=100`
        );

        let syncedCount = 0;

        for (const commit of commits) {
            const { error } = await supabaseAdmin
                .from('github_commits')
                .upsert({
                    project_id: projectId,
                    sha: commit.sha,
                    message: commit.commit.message,
                    author: commit.commit.author.name,
                    timestamp: commit.commit.author.date
                }, {
                    onConflict: 'project_id,sha'
                });

            if (!error) {
                syncedCount++;
            }
        }

        return syncedCount;
    }

    async syncPullRequests(projectId: string, repoUrl: string): Promise<number> {
        const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) {
            throw new Error('Invalid GitHub repository URL');
        }

        const [, owner, repo] = match;
        const repoName = repo.replace('.git', '');

        const prs: GitHubPullRequest[] = await this.fetchFromGitHub(
            `${this.baseUrl}/repos/${owner}/${repoName}/pulls?state=all&per_page=100`
        );

        console.log(`[GitHub Service] Fetched ${prs.length} PRs from GitHub for ${repoName}`);

        let syncedCount = 0;

        for (const pr of prs) {
            // Determine status: 'merged' if merged_at is present, otherwise use state ('open' or 'closed')
            let status = pr.state;
            if (pr.merged_at) {
                status = 'merged';
            }

            const { error } = await supabaseAdmin
                .from('github_pull_requests')
                .upsert({
                    project_id: projectId,
                    pr_number: pr.number,
                    title: pr.title,
                    status: status,
                    author: pr.user.login,
                    created_at: pr.created_at,
                    updated_at: pr.updated_at
                }, {
                    onConflict: 'project_id,pr_number'
                });

            if (!error) {
                syncedCount++;
            }
        }

        return syncedCount;
    }

    async getContributorStats(repoUrl: string): Promise<any> {
        const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) {
            throw new Error('Invalid GitHub repository URL');
        }

        const [, owner, repo] = match;
        const repoName = repo.replace('.git', '');

        // Use stats/contributors to get detailed stats including additions/deletions
        const stats = await this.fetchFromGitHub(
            `${this.baseUrl}/repos/${owner}/${repoName}/stats/contributors`
        );

        if (!Array.isArray(stats)) {
            // If GitHub returns 202 (stats computing), it might return {} or empty
            // Fallback to simple contributors list if stats are not ensuring
            const simpleContributors = await this.fetchFromGitHub(
                `${this.baseUrl}/repos/${owner}/${repoName}/contributors`
            );
            return simpleContributors.map((c: any) => ({
                login: c.login,
                contributions: c.contributions,
                additions: 0,
                deletions: 0
            }));
        }

        // Transform complex stats object to simple contributor list
        return stats.map((stat: any) => {
            const additions = stat.weeks.reduce((acc: number, week: any) => acc + week.a, 0);
            const deletions = stat.weeks.reduce((acc: number, week: any) => acc + week.d, 0);

            return {
                login: stat.author.login,
                contributions: stat.total,
                additions,
                deletions
            };
        }).sort((a, b) => b.contributions - a.contributions);
    }
}

export const githubService = new GitHubService();
