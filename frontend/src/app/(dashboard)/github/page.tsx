"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Github, GitCommit, GitPullRequest, GitMerge, ExternalLink, RefreshCw, Users } from "lucide-react"
import { apiClient } from "@/lib/api"

interface Project {
    id: string
    title: string
    github_repo_url?: string
}

interface Commit {
    id: string
    commit_sha: string
    message: string
    author: string
    timestamp: string
    additions: number
    deletions: number
}

interface PullRequest {
    id: string
    pr_number: number
    title: string
    author: string
    status: string
    created_at: string
}

interface Contributor {
    username: string
    commits: number
    additions: number
    deletions: number
}

export default function GitHubPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [selectedProject, setSelectedProject] = useState<string>("")
    const [commits, setCommits] = useState<Commit[]>([])
    const [pullRequests, setPullRequests] = useState<PullRequest[]>([])
    const [contributors, setContributors] = useState<Contributor[]>([])
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)

    useEffect(() => {
        fetchProjects()
    }, [])

    useEffect(() => {
        if (selectedProject) {
            fetchGitHubData()
        }
    }, [selectedProject])

    async function fetchProjects() {
        try {
            setLoading(true)
            const res = await apiClient.getProjects()
            if (res.success && res.data) {
                const projectList = res.data as Project[]
                setProjects(projectList)
                if (projectList.length > 0) {
                    setSelectedProject(projectList[0].id)
                }
            }
        } catch (err) {
            console.error("Failed to fetch projects:", err)
        } finally {
            setLoading(false)
        }
    }

    async function fetchGitHubData() {
        try {
            // Fetch commits
            const commitsRes = await apiClient.getGitHubCommits(selectedProject)
            if (commitsRes.success && commitsRes.data) {
                setCommits(commitsRes.data as Commit[])
            }

            // Fetch PRs
            const prsRes = await apiClient.getGitHubPullRequests(selectedProject)
            if (prsRes.success && prsRes.data) {
                setPullRequests(prsRes.data as PullRequest[])
            }

            // Fetch contributors
            const contribRes = await apiClient.getGitHubContributors(selectedProject)
            if (contribRes.success && contribRes.data) {
                // Map GitHub API response to Contributor interface
                const rawContributors = contribRes.data as any[]
                const mappedContributors = rawContributors.map(c => ({
                    username: c.login,
                    commits: c.contributions,
                    additions: 0, // Not available in /contributors endpoint
                    deletions: 0
                }))
                setContributors(mappedContributors)
            }
        } catch (err) {
            console.error("Failed to fetch GitHub data:", err)
        }
    }

    async function handleSync() {
        if (!selectedProject) return
        setSyncing(true)
        try {
            await apiClient.syncGitHub(selectedProject)
            await fetchGitHubData()
        } catch (err) {
            console.error("Sync failed:", err)
        } finally {
            setSyncing(false)
        }
    }

    const selectedProjectData = projects.find(p => p.id === selectedProject)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">GitHub Integration</h2>
                    <p className="text-muted-foreground">View repository activity and contributions.</p>
                </div>
                <div className="flex gap-2">
                    <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="p-2 rounded-md border bg-background"
                    >
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                    </select>
                    <Button variant="outline" onClick={handleSync} disabled={syncing}>
                        {syncing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Sync Data
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Commits</CardTitle>
                        <GitCommit className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{commits.length}</div>
                        <p className="text-xs text-muted-foreground">from this project</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Pull Requests</CardTitle>
                        <GitPullRequest className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pullRequests.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {pullRequests.filter(pr => pr.status === 'open').length} open
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Merged</CardTitle>
                        <GitMerge className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">
                            {pullRequests.filter(pr => pr.status === 'merged').length}
                        </div>
                        <p className="text-xs text-muted-foreground">PRs merged</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Contributors</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{contributors.length}</div>
                        <p className="text-xs text-muted-foreground">active contributors</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Commits */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GitCommit className="h-5 w-5" />
                            Recent Commits
                        </CardTitle>
                        <CardDescription>Latest commits from the repository</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {commits.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">
                                No commits synced yet. Click Sync to fetch data.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {commits.slice(0, 8).map((commit) => (
                                    <div key={commit.id} className="flex items-start gap-3 p-2 rounded hover:bg-accent/50">
                                        <GitCommit className="h-4 w-4 mt-1 text-muted-foreground" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{commit.message}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                <span className="text-primary">@{commit.author}</span>
                                                <span>•</span>
                                                <span>{new Date(commit.timestamp).toLocaleDateString()}</span>
                                                {(commit.additions > 0 || commit.deletions > 0) && (
                                                    <>
                                                        <span className="text-green-500">+{commit.additions}</span>
                                                        <span className="text-red-500">-{commit.deletions}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pull Requests */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GitPullRequest className="h-5 w-5" />
                            Pull Requests
                        </CardTitle>
                        <CardDescription>Recent pull requests</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pullRequests.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">
                                No pull requests synced yet.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {pullRequests.slice(0, 6).map((pr) => (
                                    <div key={pr.id} className="flex items-center justify-between p-2 rounded hover:bg-accent/50">
                                        <div className="flex items-center gap-3">
                                            <GitPullRequest className={`h-4 w-4 ${pr.status === 'open' ? 'text-green-500' :
                                                pr.status === 'merged' ? 'text-purple-500' : 'text-red-500'
                                                }`} />
                                            <div>
                                                <p className="text-sm font-medium">#{pr.pr_number} {pr.title}</p>
                                                <p className="text-xs text-muted-foreground">by @{pr.author}</p>
                                            </div>
                                        </div>
                                        <Badge variant={
                                            pr.status === 'open' ? 'success' :
                                                pr.status === 'merged' ? 'secondary' : 'destructive'
                                        }>
                                            {pr.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Contributors Leaderboard */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Contributor Leaderboard
                    </CardTitle>
                    <CardDescription>Top contributors based on activity</CardDescription>
                </CardHeader>
                <CardContent>
                    {contributors.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No contributor data yet. Sync GitHub data to see leaderboard.
                        </p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-3">
                            {contributors.slice(0, 6).map((contrib, index) => (
                                <div key={contrib.username} className="flex items-center gap-3 p-3 rounded-lg border">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                        index === 1 ? 'bg-slate-400/20 text-slate-400' :
                                            index === 2 ? 'bg-orange-500/20 text-orange-500' :
                                                'bg-primary/10 text-primary'
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium">@{contrib.username}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {contrib.commits} commits •
                                            <span className="text-green-500">+{contrib.additions}</span>/
                                            <span className="text-red-500">-{contrib.deletions}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Repository Info */}
            {selectedProjectData?.github_repo_url && (
                <Card>
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Github className="h-6 w-6" />
                                <div>
                                    <p className="font-medium">Connected Repository</p>
                                    <p className="text-sm text-muted-foreground">{selectedProjectData.github_repo_url}</p>
                                </div>
                            </div>
                            <a href={selectedProjectData.github_repo_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm">
                                    <ExternalLink className="h-4 w-4 mr-2" /> View on GitHub
                                </Button>
                            </a>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
