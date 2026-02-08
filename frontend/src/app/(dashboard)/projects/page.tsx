"use client"

import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Plus, Calendar, Users, GitBranch, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useSearchParams } from "next/navigation"

interface Project {
    id: string
    title: string
    description: string
    status: string
    start_date: string
    end_date: string
    github_repo_url?: string
    created_at: string
}

function ProjectsList() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [userRole, setUserRole] = useState<string | null>(null)

    const searchParams = useSearchParams()
    const urlSearch = searchParams.get('search')

    useEffect(() => {
        if (urlSearch) {
            setSearchQuery(urlSearch)
        }
    }, [urlSearch])

    useEffect(() => {
        fetchProjects()
        fetchUserRole()
    }, [])

    async function fetchUserRole() {
        try {
            const res = await apiClient.getCurrentUser()
            if (res.success && res.data) {
                setUserRole((res.data as { role: string }).role)
            }
        } catch (error) {
            console.error("Failed to fetch user role", error)
        }
    }

    async function fetchProjects() {
        try {
            setLoading(true)
            const response = await apiClient.getProjects()
            console.log('Fetch projects response:', response)
            if (response.success && response.data) {
                setProjects(response.data as Project[])
            } else {
                // Check if it's an auth error
                if (response.error?.includes('token') || response.error?.includes('profile')) {
                    window.location.href = '/login'
                    return
                }
                setError(response.error || "Failed to load projects")
            }
        } catch (err: unknown) {
            console.error('Fetch projects error:', err)
            const message = err instanceof Error ? err.message : 'Failed to load projects'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    const filteredProjects = projects.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return 'success'
            case 'completed': return 'secondary'
            case 'planning': return 'outline'
            default: return 'secondary'
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
                    <p className="text-muted-foreground">Manage and track all your team projects.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search projects..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {userRole !== 'mentor' && (
                        <Link href="/projects/new">
                            <Button variant="default">
                                <Plus className="h-4 w-4 mr-2" /> New Project
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-4 text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                    {error}
                    <Button variant="link" onClick={fetchProjects} className="ml-2">
                        Retry
                    </Button>
                </div>
            )}

            {!error && filteredProjects.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No projects found</p>
                    <Link href="/projects/new">
                        <Button>Create Your First Project</Button>
                    </Link>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((project) => (
                    <Link href={`/projects/${project.id}`} key={project.id} className="group">
                        <Card className="h-full transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <Badge variant={getStatusBadge(project.status)}>
                                        {project.status}
                                    </Badge>
                                    {project.end_date && (
                                        <span className="text-xs text-muted-foreground flex items-center">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            {new Date(project.end_date).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                <CardTitle className="mt-2 group-hover:text-primary transition-colors">
                                    {project.title}
                                </CardTitle>
                                <CardDescription className="line-clamp-2">
                                    {project.description || "No description"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Created</span>
                                            <span>{new Date(project.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t bg-muted/20 p-4">
                                <div className="flex justify-between w-full text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Users className="h-4 w-4" /> Team
                                    </div>
                                    {project.github_repo_url && (
                                        <div className="flex items-center gap-1">
                                            <GitBranch className="h-4 w-4" /> Repo
                                        </div>
                                    )}
                                </div>
                            </CardFooter>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default function ProjectsPage() {
    return (
        <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
            <ProjectsList />
        </Suspense>
    )
}
