"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"

interface Team {
    id: string
    name: string
}

export default function NewProjectPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [teams, setTeams] = useState<Team[]>([])
    const [loadingTeams, setLoadingTeams] = useState(false)
    const [selectedTeam, setSelectedTeam] = useState<string>("")

    useEffect(() => {
        const fetchTeams = async () => {
            setLoadingTeams(true)
            try {
                const res = await apiClient.getTeams()
                if (res.success && res.data) {
                    setTeams(res.data as Team[])
                }
            } catch (error) {
                console.error("Failed to fetch teams", error)
            } finally {
                setLoadingTeams(false)
            }
        }
        fetchTeams()
    }, [])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const githubUrl = formData.get('github_repo_url') as string
        const projectData = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            github_repo_url: githubUrl && githubUrl.trim() ? githubUrl : undefined,
            start_date: (formData.get('start_date') as string) || new Date().toISOString().split('T')[0],
            end_date: formData.get('end_date') as string || undefined,
            status: 'planning',
            team_id: selectedTeam || undefined
        }

        try {
            const response = await apiClient.createProject(projectData)
            console.log('Create project response:', response)
            if (response.success && response.data) {
                toast.success("Project created successfully")
                router.push(`/projects/${(response.data as { id: string }).id}`)
            } else {
                toast.error(response.error || 'Failed to create project')
            }
        } catch (err: unknown) {
            console.error('Create project error:', err)
            const message = err instanceof Error ? err.message : 'Failed to create project'
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/projects">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Create New Project</h2>
                    <p className="text-muted-foreground">Fill in the details to create a new project</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                    <CardDescription>
                        Provide the basic information for your new project
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Project Title *</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="My Awesome Project"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Describe your project..."
                                rows={4}
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="team">Assign to Team (Optional)</Label>
                            <select
                                id="team"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedTeam}
                                onChange={(e) => setSelectedTeam(e.target.value)}
                                disabled={loading || loadingTeams}
                            >
                                <option value="">Select a team...</option>
                                {teams.map((team) => (
                                    <option key={team.id} value={team.id}>
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[0.8rem] text-muted-foreground">
                                Assign this project to a team you are a member of.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="github_repo_url">GitHub Repository URL</Label>
                            <Input
                                id="github_repo_url"
                                name="github_repo_url"
                                type="url"
                                placeholder="https://github.com/username/repo"
                                disabled={loading}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start_date">Start Date</Label>
                                <Input
                                    id="start_date"
                                    name="start_date"
                                    type="date"
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">End Date</Label>
                                <Input
                                    id="end_date"
                                    name="end_date"
                                    type="date"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button type="submit" disabled={loading} className="flex-1">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Project
                            </Button>
                            <Link href="/projects">
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
