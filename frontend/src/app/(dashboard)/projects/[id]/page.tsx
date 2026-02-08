"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    GitBranch,
    MoreHorizontal,
    Plus,
    Loader2,
    X
} from "lucide-react"
import { apiClient } from "@/lib/api"

import { TaskDetailDialog } from "@/components/TaskDetailDialog"

interface Task {
    id: string
    title: string
    description: string
    status: string
    priority: string
    assigned_to?: string
    assignee_name?: string
    due_date?: string
}

interface Milestone {
    id: string
    title: string
    description?: string
    due_date: string
    status: string
}

interface Project {
    id: string
    title: string
    description: string
    status: string
    github_repo_url?: string
}

export default function ProjectDetailsPage() {
    const params = useParams()
    const projectId = params.id as string

    const [project, setProject] = useState<Project | null>(null)
    const [tasks, setTasks] = useState<Task[]>([])
    const [milestones, setMilestones] = useState<Milestone[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showAddTask, setShowAddTask] = useState(false)
    const [newTaskTitle, setNewTaskTitle] = useState("")
    const [newTaskPriority, setNewTaskPriority] = useState("medium")
    const [addingTask, setAddingTask] = useState(false)

    // Task Detail State
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)

    useEffect(() => {
        if (projectId) {
            fetchProject()
            fetchTasks()
            fetchMilestones()
        }
    }, [projectId])

    async function fetchProject() {
        try {
            const response = await apiClient.getProject(projectId)
            console.log('Fetch project response:', response)
            if (response.success && response.data) {
                console.log('Project data:', response.data)
                setProject(response.data as Project)
            } else {
                console.log('Failed to fetch project:', response.error)
                setError(response.error || 'Failed to fetch project')
            }
        } catch (err: unknown) {
            console.error('Fetch project error:', err)
            const message = err instanceof Error ? err.message : 'Failed to fetch project'
            setError(message)
        }
    }

    async function fetchTasks() {
        try {
            setLoading(true)
            const response = await apiClient.getTasks(projectId)
            if (response.success && response.data) {
                setTasks(response.data as Task[])
            }
        } catch (err: unknown) {
            console.error("Failed to fetch tasks:", err)
        } finally {
            setLoading(false)
        }
    }

    async function fetchMilestones() {
        try {
            const response = await apiClient.getMilestones(projectId)
            if (response.success && response.data) {
                setMilestones(response.data as Milestone[])
            }
        } catch (err: unknown) {
            console.error("Failed to fetch milestones:", err)
        }
    }

    async function handleAddTask(e: React.FormEvent) {
        e.preventDefault()
        if (!newTaskTitle.trim()) return

        setAddingTask(true)
        try {
            console.log('Creating task:', { title: newTaskTitle, priority: newTaskPriority })
            const response = await apiClient.createTask(projectId, {
                title: newTaskTitle,
                priority: newTaskPriority,
                status: "todo"
            })
            console.log('Create task response:', response)
            if (response.success) {
                setNewTaskTitle("")
                setShowAddTask(false)
                fetchTasks() // Refresh tasks
            } else {
                console.error('Failed to create task:', response.error)
            }
        } catch (err: unknown) {
            console.error("Failed to add task:", err)
        } finally {
            setAddingTask(false)
        }
    }

    async function handleStatusChange(taskId: string, newStatus: string) {
        try {
            await apiClient.updateTaskStatus(taskId, newStatus)
            fetchTasks() // Refresh
        } catch (err) {
            console.error("Failed to update task:", err)
        }
    }

    const handleTaskClick = (taskId: string) => {
        setSelectedTaskId(taskId)
        setIsTaskDialogOpen(true)
    }

    const todoTasks = tasks.filter(t => t.status === 'todo')
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress')
    const inReviewTasks = tasks.filter(t => t.status === 'in_review')
    const completedTasks = tasks.filter(t => t.status === 'completed')

    if (loading && !project) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4 text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                {error}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h2 className="text-3xl font-bold tracking-tight">
                            {project?.title || "Project"}
                        </h2>
                        <Badge variant="success">{project?.status || "Active"}</Badge>
                    </div>
                    <p className="text-muted-foreground max-w-2xl">
                        {project?.description || "No description"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {project?.github_repo_url && (
                        <Button variant="outline" asChild>
                            <a href={project.github_repo_url} target="_blank" rel="noopener noreferrer">
                                <GitBranch className="h-4 w-4 mr-2" /> View Repo
                            </a>
                        </Button>
                    )}
                    <Button variant="default" onClick={() => setShowAddTask(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Add Task
                    </Button>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Add Task Modal */}
            {showAddTask && (
                <Card className="border-primary">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Add New Task</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => setShowAddTask(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddTask} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Task Title</Label>
                                <Input
                                    id="title"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="Enter task title..."
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="priority">Priority</Label>
                                <select
                                    id="priority"
                                    value={newTaskPriority}
                                    onChange={(e) => setNewTaskPriority(e.target.value)}
                                    className="w-full p-2 rounded-md border bg-background"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={addingTask}>
                                    {addingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Add Task
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setShowAddTask(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Tabs */}
            <Tabs defaultValue="kanban" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
                    <TabsTrigger value="milestones">Milestones</TabsTrigger>
                    <TabsTrigger value="team">Team</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{tasks.length}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">To Do</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{todoTasks.length}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{inProgressTasks.length}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{completedTasks.length}</div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="kanban" className="h-[calc(100vh-300px)]">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full overflow-x-auto pb-4">
                            {/* To Do Column */}
                            <KanbanColumn
                                title="To Do"
                                color="bg-slate-500"
                                tasks={todoTasks}
                                onStatusChange={handleStatusChange}
                                targetStatus="todo"
                                onTaskClick={handleTaskClick}
                            />

                            {/* In Progress Column */}
                            <KanbanColumn
                                title="In Progress"
                                color="bg-blue-500"
                                tasks={inProgressTasks}
                                onStatusChange={handleStatusChange}
                                targetStatus="in_progress"
                                onTaskClick={handleTaskClick}
                            />

                            {/* In Review Column */}
                            <KanbanColumn
                                title="In Review"
                                color="bg-yellow-500"
                                tasks={inReviewTasks}
                                onStatusChange={handleStatusChange}
                                targetStatus="in_review"
                                onTaskClick={handleTaskClick}
                            />

                            {/* Completed Column */}
                            <KanbanColumn
                                title="Completed"
                                color="bg-green-500"
                                tasks={completedTasks}
                                onStatusChange={handleStatusChange}
                                targetStatus="completed"
                                onTaskClick={handleTaskClick}
                            />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="milestones" className="space-y-4">
                    {milestones.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">No milestones for this project yet.</p>
                            <Button variant="outline" asChild>
                                <a href="/milestones">Create Milestone</a>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {milestones.map((milestone) => {
                                const handleMilestoneClick = async () => {
                                    const statusOrder = ['pending', 'in_progress', 'completed']
                                    const currentIndex = statusOrder.indexOf(milestone.status)
                                    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]

                                    const res = await apiClient.updateMilestone(milestone.id, { status: nextStatus })
                                    if (res.success) {
                                        setMilestones(prev => prev.map(m =>
                                            m.id === milestone.id ? { ...m, status: nextStatus } : m
                                        ))
                                    }
                                }

                                return (
                                    <Card key={milestone.id} className="hover:border-primary/50 transition-colors">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <Badge
                                                    variant={
                                                        milestone.status === 'completed' ? 'success' :
                                                            milestone.status === 'in_progress' ? 'warning' : 'outline'
                                                    }
                                                    className="cursor-pointer hover:opacity-80"
                                                    onClick={handleMilestoneClick}
                                                >
                                                    {milestone.status.replace('_', ' ')} →
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    Due: {new Date(milestone.due_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <CardTitle className="mt-2">{milestone.title}</CardTitle>
                                            {milestone.description && (
                                                <p className="text-sm text-muted-foreground">{milestone.description}</p>
                                            )}
                                        </CardHeader>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="team">
                    <p className="text-muted-foreground">Team management coming soon...</p>
                </TabsContent>
            </Tabs>

            <TaskDetailDialog
                open={isTaskDialogOpen}
                onOpenChange={setIsTaskDialogOpen}
                taskId={selectedTaskId}
            />
        </div>
    )
}

interface KanbanColumnProps {
    title: string
    color: string
    tasks: Task[]
    onStatusChange: (taskId: string, status: string) => void
    targetStatus: string
    onTaskClick: (taskId: string) => void
}

function KanbanColumn({ title, color, tasks, onStatusChange, targetStatus, onTaskClick }: KanbanColumnProps) {
    const [isDragOver, setIsDragOver] = useState(false)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }

    const handleDragLeave = () => {
        setIsDragOver(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
        const taskId = e.dataTransfer.getData('taskId')
        const fromStatus = e.dataTransfer.getData('fromStatus')
        if (taskId && fromStatus !== targetStatus) {
            onStatusChange(taskId, targetStatus)
        }
    }

    return (
        <div className="flex flex-col gap-3 min-w-[280px]">
            <div className="flex items-center justify-between p-2 font-semibold text-sm text-foreground/70">
                <span className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${color}`} />
                    {title}
                </span>
                <span className="bg-muted px-2 py-0.5 rounded-full text-xs">{tasks.length}</span>
            </div>
            <div
                className={`flex flex-col gap-3 h-full rounded-xl p-2 border min-h-[200px] transition-colors ${isDragOver
                    ? 'bg-primary/10 border-primary'
                    : 'bg-muted/20 border-border/50'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {tasks.length === 0 && (
                    <p className={`text-xs text-center py-4 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`}>
                        {isDragOver ? 'Drop here' : 'No tasks'}
                    </p>
                )}
                {tasks.map((task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        currentStatus={targetStatus}
                        onClick={() => onTaskClick(task.id)}
                    />
                ))}
            </div>
        </div>
    )
}

interface TaskCardProps {
    task: Task
    currentStatus: string
    onClick: () => void
}

function TaskCard({ task, currentStatus, onClick }: TaskCardProps) {
    const [isDragging, setIsDragging] = useState(false)

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'critical': return 'destructive'
            case 'high': return 'warning'
            default: return 'outline'
        }
    }

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('taskId', task.id)
        e.dataTransfer.setData('fromStatus', currentStatus)
        e.dataTransfer.effectAllowed = 'move'
        setIsDragging(true)
    }

    const handleDragEnd = () => {
        setIsDragging(false)
    }

    return (
        <Card
            className={`cursor-grab active:cursor-grabbing hover:border-primary/50 transition-all shadow-sm bg-card hover:shadow-md ${isDragging ? 'opacity-50 rotate-2 scale-105' : ''
                }`}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={onClick}
        >
            <CardContent className="p-3 space-y-3">
                <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-medium leading-tight">{task.title}</p>
                </div>
                <div className="flex items-center justify-between">
                    <Badge
                        variant={getPriorityBadge(task.priority)}
                        className="text-[10px] px-1.5 py-0 h-5"
                    >
                        {task.priority}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}
