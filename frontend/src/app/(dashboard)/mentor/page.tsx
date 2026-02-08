"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Users, FolderOpen, ClipboardList, Clock, CheckCircle, ArrowRight, MessageSquare, TrendingUp } from "lucide-react"
import { apiClient } from "@/lib/api"
import Link from "next/link"
import { EvaluationDialog } from "@/components/EvaluationDialog"

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
    project_id: string
    project_title?: string
    assigned_to?: string
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
    team_members: TeamMember[]
}

export default function MentorDashboard() {
    const [projects, setProjects] = useState<Project[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [teams, setTeams] = useState<Team[]>([])
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState("Mentor")
    const [evalOpen, setEvalOpen] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    async function fetchDashboardData() {
        try {
            setLoading(true)

            // Fetch user info - validates auth
            const userRes = await apiClient.getCurrentUser()
            if (!userRes.success || !userRes.data) {
                // Not authenticated - redirect to login
                window.location.href = '/login'
                return
            }
            setUserName((userRes.data as { name?: string }).name || "Mentor")

            // Fetch projects (mentored projects)
            const projectsRes = await apiClient.getProjects()
            if (projectsRes.success && projectsRes.data) {
                setProjects(projectsRes.data as Project[])

                // Fetch all tasks
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
        } catch (err) {
            console.error("Failed to fetch dashboard data:", err)
            window.location.href = '/login'
        } finally {
            setLoading(false)
        }
    }

    // Tasks pending review
    const pendingReviewTasks = tasks.filter(t => t.status === 'in_review')
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length

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
                    <h2 className="text-3xl font-bold tracking-tight">Mentor Dashboard</h2>
                    <p className="text-muted-foreground">Welcome back, {userName}! Here&apos;s your team overview.</p>
                </div>
                <Link href="/projects">
                    <Button variant="outline">
                        <FolderOpen className="h-4 w-4 mr-2" /> All Projects
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Projects Supervised</CardTitle>
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{projects.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {projects.filter(p => p.status === 'active').length} active
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalTasks}</div>
                        <p className="text-xs text-muted-foreground">
                            {inProgressTasks} in progress
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:border-yellow-500/50 transition-colors border-yellow-500/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">{pendingReviewTasks.length}</div>
                        <p className="text-xs text-muted-foreground">
                            tasks awaiting your review
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:border-green-500/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">{completedTasks}</div>
                        <p className="text-xs text-muted-foreground">
                            tasks completed
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Pending Reviews */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-yellow-500" />
                            Pending Reviews
                        </CardTitle>
                        <CardDescription>Tasks waiting for your approval</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pendingReviewTasks.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">
                                🎉 No tasks pending review!
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {pendingReviewTasks.slice(0, 5).map((task) => (
                                    <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">{task.title}</p>
                                            <p className="text-xs text-muted-foreground">{task.project_title}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="warning">{task.priority}</Badge>
                                            <Button size="sm" variant="outline">Review</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Supervised Projects */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FolderOpen className="h-5 w-5" />
                            Supervised Projects
                        </CardTitle>
                        <CardDescription>Projects you are mentoring</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {projects.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">
                                No projects assigned yet
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {projects.slice(0, 5).map((project) => {
                                    const projectTasks = tasks.filter(t => t.project_id === project.id)
                                    const completed = projectTasks.filter(t => t.status === 'completed').length
                                    const progress = projectTasks.length > 0
                                        ? Math.round((completed / projectTasks.length) * 100)
                                        : 0

                                    return (
                                        <Link key={project.id} href={`/projects/${project.id}`}>
                                            <div className="p-3 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium">{project.title}</span>
                                                    <Badge variant={project.status === 'active' ? 'success' : 'secondary'}>
                                                        {project.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{progress}%</span>
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                        <Link href="/projects">
                            <Button variant="ghost" className="w-full mt-4">
                                View All <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* My Teams */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            My Teams
                        </CardTitle>
                        <CardDescription>Teams you are mentoring</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {teams.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground mb-4">You haven't created any teams yet.</p>
                                <Link href="/team">
                                    <Button>Create Team</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {teams.map(team => (
                                    <div key={team.id} className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold">{team.name}</h4>
                                            <Badge variant="outline">{team.team_members?.length || 0} Members</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-3">
                                            Created {new Date(team.created_at).toLocaleDateString()}
                                        </p>
                                        <div className="flex -space-x-2 overflow-hidden mb-3">
                                            {team.team_members?.slice(0, 4).map((member) => (
                                                <div key={member.user.id} className="inline-block h-6 w-6 rounded-full ring-2 ring-background bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                                                    {member.user.name?.charAt(0)}
                                                </div>
                                            ))}
                                            {(team.team_members?.length || 0) > 4 && (
                                                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-background bg-secondary flex items-center justify-center text-[10px]">
                                                    +{team.team_members.length - 4}
                                                </div>
                                            )}
                                        </div>
                                        <Link href="/team">
                                            <Button size="sm" variant="secondary" className="w-full h-8">
                                                Manage Team
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Student Progress Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Student Progress & Evaluations
                    </CardTitle>
                    <CardDescription>Track performance of students in your teams</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <div className="grid grid-cols-5 gap-4 p-4 font-medium text-sm border-b bg-muted/50">
                            <div className="col-span-1">Student</div>
                            <div className="col-span-1">Team</div>
                            <div className="col-span-1">Tasks</div>
                            <div className="col-span-1">Efficiency</div>
                            <div className="col-span-1 text-right">Actions</div>
                        </div>
                        <div className="divide-y">
                            {teams.flatMap(team => team.team_members || []).map((member, i) => {
                                // Calculate simple stats for this student
                                // Note: In a real app we'd filter tasks by assignee_id efficiently
                                const studentTasks = tasks.filter(t => t.assigned_to === member.user.id);
                                const completed = studentTasks.filter(t => t.status === 'completed').length;
                                const total = studentTasks.length;
                                const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

                                // Get team for context (naive find)
                                const teamName = teams.find(t => t.team_members?.some(tm => tm.user.id === member.user.id))?.name || "Unassigned";

                                return (
                                    <div key={`${member.user.id}-${i}`} className="grid grid-cols-5 gap-4 p-4 items-center text-sm hover:bg-muted/30 transition-colors">
                                        <div className="col-span-1 flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold border">
                                                {member.user.name?.charAt(0)}
                                            </div>
                                            <span className="font-medium">{member.user.name}</span>
                                        </div>
                                        <div className="col-span-1 text-muted-foreground">
                                            {teamName}
                                        </div>
                                        <div className="col-span-1">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs">{completed} / {total} Completed</span>
                                                <div className="h-1.5 w-full max-w-[100px] bg-secondary rounded-full overflow-hidden">
                                                    <div className="h-full bg-green-500" style={{ width: `${rate}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-span-1">
                                            <Badge variant={rate > 75 ? "success" : rate > 40 ? "secondary" : "outline"}>
                                                {rate}% Rate
                                            </Badge>
                                        </div>
                                        <div className="col-span-1 text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    console.log("Opening evaluation dialog for:", member.user)
                                                    setSelectedStudent(member.user)
                                                    setEvalOpen(true)
                                                }}
                                            >
                                                Evaluate
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                            {teams.flatMap(t => t.team_members || []).length === 0 && (
                                <div className="p-8 text-center text-muted-foreground">
                                    No students found in your teams.
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                    <Link href="/tasks">
                        <Button variant="outline">
                            <ClipboardList className="h-4 w-4 mr-2" /> View All Tasks
                        </Button>
                    </Link>
                    <Link href="/team">
                        <Button variant="outline">
                            <Users className="h-4 w-4 mr-2" /> Team Members
                        </Button>
                    </Link>
                    <Link href="/milestones">
                        <Button variant="outline">
                            <MessageSquare className="h-4 w-4 mr-2" /> Milestones
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            <EvaluationDialog
                open={evalOpen}
                onOpenChange={setEvalOpen}
                student={selectedStudent}
                projects={projects}
            />
        </div>
    )
}
