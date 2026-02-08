"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Clock, TrendingUp, Calendar, ArrowRight, FolderOpen, CheckCircle, ClipboardList } from "lucide-react"
import { apiClient } from "@/lib/api"
import Link from "next/link"

interface Project {
    id: string
    title: string
    status: string
    end_date?: string
}

interface Task {
    id: string
    title: string
    status: string
    priority: string
    due_date?: string
    project_id: string
    project_title?: string
}

interface User {
    id: string
    name: string
}

interface TeamMember {
    user: User
}

interface Team {
    id: string
    name: string
    created_at: string
    mentor?: User
    team_members?: TeamMember[]
}

export default function StudentDashboard() {
    const [projects, setProjects] = useState<Project[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [teams, setTeams] = useState<Team[]>([])
    const [evaluations, setEvaluations] = useState<any[]>([])
    const [commits, setCommits] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState("Student")

    useEffect(() => {
        fetchDashboardData()
    }, [])

    async function fetchDashboardData() {
        try {
            setLoading(true)

            // Fetch user info first - this validates auth
            const userRes = await apiClient.getCurrentUser()
            if (!userRes.success || !userRes.data) {
                // Not authenticated - redirect to login
                window.location.href = '/login'
                return
            }
            setUserName((userRes.data as { name?: string }).name || "Student")

            // Fetch projects
            const projectsRes = await apiClient.getProjects()
            if (projectsRes.success && projectsRes.data) {
                setProjects(projectsRes.data as Project[])

                // Fetch tasks for each project
                const allTasks: Task[] = []
                for (const project of projectsRes.data as Project[]) {
                    try {
                        const tasksRes = await apiClient.getTasks(project.id)
                        if (tasksRes.success && tasksRes.data) {
                            const projectTasks = (tasksRes.data as Task[]).map(t => ({
                                ...t,
                                project_title: project.title
                            }))
                            allTasks.push(...projectTasks)
                        }
                    } catch {
                        console.error(`Failed to fetch tasks for project ${project.id}`)
                    }
                }
                setTasks(allTasks)
            }

            // Fetch Teams
            const teamsRes = await apiClient.getTeams()
            if (teamsRes.success && teamsRes.data) {
                setTeams(teamsRes.data as Team[])
            }

            // Fetch Evaluations (for student)
            if (userRes.data && (userRes.data as any).id) {
                const evalsRes = await apiClient.getStudentEvaluations((userRes.data as any).id)
                if (evalsRes.success && evalsRes.data) {
                    setEvaluations(evalsRes.data as any[])
                }
            }

            // Fetch GitHub Commits for Activity Graph
            if (projectsRes.success && projectsRes.data) {
                const allCommits: any[] = []
                const activeProjects = (projectsRes.data as Project[]).filter(p => p.status === 'active')

                // Limit to first 3 active projects to avoid hitting rate limits or slow load
                for (const project of activeProjects.slice(0, 3)) {
                    try {
                        const commitsRes = await apiClient.getGitHubCommits(project.id)
                        if (commitsRes.success && Array.isArray(commitsRes.data)) {
                            allCommits.push(...commitsRes.data)
                        }
                    } catch (e) {
                        console.error(`Failed to load commits for ${project.id}`)
                    }
                }
                setCommits(allCommits)
            }
        } catch (err) {
            console.error("Failed to fetch dashboard data:", err)
            // If auth fails, redirect to login
            window.location.href = '/login'
        } finally {
            setLoading(false)
        }
    }

    // Process commits for graph (Last 7 days)
    const getLast7DaysData = () => {
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - (6 - i))
            d.setHours(0, 0, 0, 0)
            return d
        })

        return days.map(day => {
            const dayStr = day.toLocaleDateString('en-US', { weekday: 'short' })
            const count = commits.filter(c => {
                const cDate = new Date(c.date || c.timestamp || c.created_at) // Adjust based on actual API response
                cDate.setHours(0, 0, 0, 0)
                return cDate.getTime() === day.getTime()
            }).length

            // Normalize height for visual (max 10 commits = 100% height roughly)
            const height = Math.min(count * 10 + 10, 100) + '%'

            return { dayStr, count, height }
        })
    }

    const activityData = getLast7DaysData()

    const pendingTasks = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress')
    const completedTasks = tasks.filter(t => t.status === 'completed')
    const activeProjects = projects.filter(p => p.status === 'active')

    // Calculate completion rate
    const completionRate = tasks.length > 0
        ? Math.round((completedTasks.length / tasks.length) * 100)
        : 0

    // Get upcoming tasks (sorted by due date)
    const upcomingTasks = pendingTasks
        .sort((a, b) => {
            if (!a.due_date) return 1
            if (!b.due_date) return -1
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        })
        .slice(0, 5)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">Welcome back, {userName}! Here&apos;s your project overview.</p>
                </div>
                <Link href="/projects/new">
                    <Button variant="premium">
                        Create New Project
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Projects
                        </CardTitle>
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeProjects.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {projects.length} total projects
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Pending Tasks
                        </CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingTasks.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {tasks.filter(t => t.status === 'in_progress').length} in progress
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Completed
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedTasks.length}</div>
                        <p className="text-xs text-muted-foreground">
                            tasks completed
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Completion Rate
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completionRate}%</div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mt-2">
                            <div
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${completionRate}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-card/60">
                    <CardHeader>
                        <CardTitle>Upcoming Tasks</CardTitle>
                        <CardDescription>
                            Your tasks sorted by due date
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {upcomingTasks.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">No pending tasks</p>
                        ) : (
                            <div className="space-y-4">
                                {upcomingTasks.map((task) => (
                                    <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-2 w-2 rounded-full ${task.priority === 'critical' ? 'bg-red-500' :
                                                task.priority === 'high' ? 'bg-orange-500' :
                                                    task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                                }`} />
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">{task.title}</p>
                                                <p className="text-xs text-muted-foreground">{task.project_title}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {task.due_date && (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(task.due_date).toLocaleDateString()}
                                                </span>
                                            )}
                                            <Badge variant={task.priority === 'critical' || task.priority === 'high' ? 'destructive' : 'secondary'}>
                                                {task.priority}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-3 bg-card/60">
                    <CardHeader>
                        <CardTitle>My Projects</CardTitle>
                        <CardDescription>
                            Projects you&apos;re working on
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {projects.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">No projects assigned</p>
                        ) : (
                            <div className="space-y-4">
                                {projects.slice(0, 4).map((project) => (
                                    <Link key={project.id} href={`/projects/${project.id}`}>
                                        <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <FolderOpen className="h-4 w-4 text-primary" />
                                                <span className="text-sm font-medium">{project.title}</span>
                                            </div>
                                            <Badge variant={project.status === 'active' ? 'success' : 'secondary'}>
                                                {project.status}
                                            </Badge>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                        <Link href="/projects">
                            <Button variant="ghost" className="w-full mt-4 text-xs">
                                View All Projects <ArrowRight className="ml-2 h-3 w-3" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* GitHub Activity & Feedback */}
                <Card className="col-span-4 bg-card/60">
                    <CardHeader>
                        <CardTitle>Activity & Feedback</CardTitle>
                        <CardDescription>
                            Your recent contributions and mentor feedback
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        {/* GitHub Activity Graph (Simplified) */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" /> GitHub Activity (Last 7 Days)
                            </h4>
                            <div className="h-[150px] flex items-end justify-between gap-1 p-2 border rounded-md bg-muted/20">
                                {activityData.map((data, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1 w-full">
                                        <div
                                            className="w-full bg-primary/80 rounded-t-sm transition-all hover:bg-primary"
                                            style={{ height: data.height }}
                                            title={`${data.count} commits on ${data.dayStr}`}
                                        ></div>
                                        <span className="text-[10px] text-muted-foreground">{data.dayStr}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Feedback */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <ClipboardList className="h-4 w-4" /> Recent Feedback
                            </h4>
                            <div className="space-y-3">
                                {evaluations.length === 0 ? (
                                    <div className="p-4 border rounded-md bg-muted/20 text-center text-sm text-muted-foreground">
                                        No evaluations yet.
                                    </div>
                                ) : (
                                    evaluations.slice(0, 2).map((evaluation: any) => (
                                        <div key={evaluation.id} className="p-3 border rounded-md bg-background hover:border-primary/50 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-medium text-sm">{evaluation.project?.title || "Project Evaluation"}</span>
                                                <Badge variant={evaluation.score >= 80 ? 'success' : 'secondary'}>
                                                    {evaluation.score}/100
                                                </Badge>
                                            </div>
                                            {evaluation.comments && (
                                                <p className="text-xs text-muted-foreground line-clamp-2 italic">
                                                    "{evaluation.comments}"
                                                </p>
                                            )}
                                            <div className="mt-2 flex gap-2 text-[10px] text-muted-foreground">
                                                <span>Quality: {evaluation.criteria?.quality || '-'}</span>
                                                <span>Timeliness: {evaluation.criteria?.timeliness || '-'}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
