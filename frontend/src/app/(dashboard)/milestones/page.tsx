"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Flag, Calendar, CheckCircle, Clock, X } from "lucide-react"
import { apiClient } from "@/lib/api"

interface Project {
    id: string
    title: string
}

interface Milestone {
    id: string
    title: string
    description: string
    due_date: string
    status: string
    project_id: string
    project_title?: string
    completion_percentage?: number
}

export default function MilestonesPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [milestones, setMilestones] = useState<Milestone[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [selectedProject, setSelectedProject] = useState<string>("")
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            setLoading(true)

            // Fetch projects
            const projectsRes = await apiClient.getProjects()
            if (projectsRes.success && projectsRes.data) {
                setProjects(projectsRes.data as Project[])

                // Fetch milestones for each project
                const allMilestones: Milestone[] = []
                for (const project of projectsRes.data as Project[]) {
                    try {
                        const res = await apiClient.getMilestones(project.id)
                        if (res.success && res.data) {
                            const projectMilestones = (res.data as Milestone[]).map(m => ({
                                ...m,
                                project_title: project.title
                            }))
                            allMilestones.push(...projectMilestones)
                        }
                    } catch {
                        console.error(`Failed to fetch milestones for project ${project.id}`)
                    }
                }
                setMilestones(allMilestones)
            }
        } catch (err) {
            console.error("Failed to fetch data:", err)
        } finally {
            setLoading(false)
        }
    }

    async function handleCreateMilestone(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!selectedProject) return

        setCreating(true)
        const formData = new FormData(e.currentTarget)

        try {
            const res = await apiClient.createMilestone(selectedProject, {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                due_date: formData.get('due_date') as string,
                status: 'pending'
            })

            if (res.success) {
                setShowForm(false)
                fetchData() // Refresh
            }
        } catch (err) {
            console.error("Failed to create milestone:", err)
        } finally {
            setCreating(false)
        }
    }

    async function handleStatusUpdate(milestone: Milestone) {
        // Cycle through statuses: pending -> in_progress -> completed -> pending
        const statusOrder = ['pending', 'in_progress', 'completed']
        const currentIndex = statusOrder.indexOf(milestone.status)
        const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]

        try {
            const res = await apiClient.updateMilestone(milestone.id, { status: nextStatus })
            if (res.success) {
                // Update local state
                setMilestones(prev => prev.map(m =>
                    m.id === milestone.id ? { ...m, status: nextStatus } : m
                ))
            }
        } catch (err) {
            console.error("Failed to update milestone:", err)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />
            case 'in_progress': return <Clock className="h-5 w-5 text-blue-500" />
            default: return <Flag className="h-5 w-5 text-slate-500" />
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return 'success'
            case 'in_progress': return 'warning'
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
                    <h2 className="text-3xl font-bold tracking-tight">Milestones</h2>
                    <p className="text-muted-foreground">Track major project milestones and deadlines</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Milestone
                </Button>
            </div>

            {/* Create Form */}
            {showForm && (
                <Card className="border-primary">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Create New Milestone</CardTitle>
                            <CardDescription>Define a key milestone for your project</CardDescription>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => setShowForm(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateMilestone} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="project">Project</Label>
                                <select
                                    id="project"
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                    className="w-full p-2 rounded-md border bg-background"
                                    required
                                >
                                    <option value="">Select a project</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="title">Milestone Title</Label>
                                <Input id="title" name="title" placeholder="e.g., MVP Launch" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="due_date">Due Date</Label>
                                <Input id="due_date" name="due_date" type="date" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input id="description" name="description" placeholder="Describe this milestone..." />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={creating || !selectedProject}>
                                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Milestone
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Milestones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{milestones.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-500">
                            {milestones.filter(m => m.status === 'in_progress').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">
                            {milestones.filter(m => m.status === 'completed').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Milestone Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {milestones.length === 0 && !showForm && (
                    <Card className="col-span-full">
                        <CardContent className="py-12 text-center">
                            <Flag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No Milestones Yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Create milestones to track major project goals and deadlines
                            </p>
                            <Button onClick={() => setShowForm(true)}>
                                <Plus className="h-4 w-4 mr-2" /> Create First Milestone
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {milestones.map((milestone) => (
                    <Card key={milestone.id} className="hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(milestone.status)}
                                    <Badge
                                        variant={getStatusBadge(milestone.status)}
                                        className="cursor-pointer hover:opacity-80"
                                        onClick={() => handleStatusUpdate(milestone)}
                                    >
                                        {milestone.status.replace('_', ' ')} →
                                    </Badge>
                                </div>
                                <span className="text-xs text-muted-foreground flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {new Date(milestone.due_date).toLocaleDateString()}
                                </span>
                            </div>
                            <CardTitle className="mt-2">{milestone.title}</CardTitle>
                            <CardDescription>
                                {milestone.project_title && (
                                    <span className="text-primary">{milestone.project_title}</span>
                                )}
                                {milestone.description && (
                                    <span className="block mt-1">{milestone.description}</span>
                                )}
                            </CardDescription>
                        </CardHeader>
                        {milestone.completion_percentage !== undefined && (
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 flex-1 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary"
                                            style={{ width: `${milestone.completion_percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {milestone.completion_percentage}%
                                    </span>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    )
}
