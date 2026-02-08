"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api"
import Link from "next/link"

interface Task {
    id: string
    title: string
    description: string
    status: string
    priority: string
    project_id: string
    project_title?: string
    due_date?: string
}

import { TaskDetailDialog } from "@/components/TaskDetailDialog"

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>("all")

    // Task Detail State
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)

    useEffect(() => {
        fetchAllTasks()
    }, [])

    async function fetchAllTasks() {
        try {
            setLoading(true)
            // Get all projects first, then get tasks for each
            const projectsRes = await apiClient.getProjects()
            if (projectsRes.success && projectsRes.data) {
                const projects = projectsRes.data as { id: string; title: string }[]
                const allTasks: Task[] = []

                for (const project of projects) {
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
        } catch (err) {
            console.error("Failed to fetch tasks:", err)
        } finally {
            setLoading(false)
        }
    }

    const filteredTasks = filter === "all"
        ? tasks
        : tasks.filter(t => t.status === filter)

    const handleTaskClick = (taskId: string) => {
        setSelectedTaskId(taskId)
        setIsTaskDialogOpen(true)
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />
            case 'in_review': return <AlertCircle className="h-4 w-4 text-yellow-500" />
            default: return <Clock className="h-4 w-4 text-slate-500" />
        }
    }

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'critical': return 'destructive'
            case 'high': return 'warning'
            default: return 'outline'
        }
    }

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
                    <h2 className="text-3xl font-bold tracking-tight">All Tasks</h2>
                    <p className="text-muted-foreground">View and manage all your tasks across projects</p>
                </div>
                <Link href="/projects">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" /> Add Task
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {["all", "todo", "in_progress", "in_review", "completed"].map((status) => (
                    <Button
                        key={status}
                        variant={filter === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter(status)}
                    >
                        {status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1)}
                    </Button>
                ))}
            </div>

            {/* Task Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tasks.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">To Do</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'todo').length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'in_progress').length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'completed').length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Task List */}
            <div className="space-y-3">
                {filteredTasks.length === 0 && (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            No tasks found. Create a project first, then add tasks!
                        </CardContent>
                    </Card>
                )}
                {filteredTasks.map((task) => (
                    <Card
                        key={task.id}
                        className="hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => handleTaskClick(task.id)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(task.status)}
                                    <div>
                                        <p className="font-medium">{task.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {task.project_title || "Unknown Project"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={getPriorityBadge(task.priority)}>
                                        {task.priority}
                                    </Badge>
                                    <Badge variant="outline">
                                        {task.status.replace("_", " ")}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <TaskDetailDialog
                open={isTaskDialogOpen}
                onOpenChange={setIsTaskDialogOpen}
                taskId={selectedTaskId}
            />
        </div>
    )
}
