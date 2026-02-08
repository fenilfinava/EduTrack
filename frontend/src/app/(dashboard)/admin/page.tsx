"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Users, FolderOpen, ClipboardList, Settings, Search, Plus, Edit, Shield } from "lucide-react"
import { apiClient } from "@/lib/api"
import Link from "next/link"
import { AddUserDialog } from "@/components/AddUserDialog"

interface User {
    id: string
    name: string
    email: string
    role: string
    is_active?: boolean
}

interface Project {
    id: string
    title: string
    status: string
}

interface Team {
    id: string
}

export default function AdminDashboard() {
    const [users, setUsers] = useState<User[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [teams, setTeams] = useState<Team[]>([])
    const [stats, setStats] = useState<any>(null)
    const [auditLogs, setAuditLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [userName, setUserName] = useState("Admin")

    useEffect(() => {
        fetchDashboardData()
    }, [])

    async function fetchDashboardData() {
        try {
            setLoading(true)

            // Fetch current user - validates auth
            const userRes = await apiClient.getCurrentUser()
            if (!userRes.success || !userRes.data) {
                window.location.href = '/login'
                return
            }
            const currentUser = userRes.data as User
            setUserName(currentUser.name || "Admin")

            // Fetch all users (Admin only)
            const usersRes = await apiClient.getUsers()
            if (usersRes.success && usersRes.data) {
                setUsers(usersRes.data as User[])
            } else {
                // Fallback if fetch fails (though it shouldn't for admin)
                setUsers([currentUser])
            }

            // Fetch all projects
            const projectsRes = await apiClient.getProjects()
            if (projectsRes.success && projectsRes.data) {
                setProjects(projectsRes.data as Project[])
            }

            // Fetch teams
            const teamsRes = await apiClient.getTeams()
            if (teamsRes.success && teamsRes.data) {
                setTeams(teamsRes.data as Team[])
            }

            // Fetch Audit Logs
            const auditRes = await apiClient.getAuditLogs()
            if (auditRes.success && auditRes.data) {
                setAuditLogs(auditRes.data as any[])
            }
        } catch (err) {
            console.error("Failed to fetch dashboard data:", err)
            window.location.href = '/login'
        } finally {
            setLoading(false)
        }
    }

    const activeProjects = projects.filter(p => p.status === 'active')
    const planingProjects = projects.filter(p => p.status === 'planning')
    const completedProjects = projects.filter(p => p.status === 'completed')

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return 'destructive'
            case 'mentor': return 'warning'
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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
                    <p className="text-muted-foreground">Welcome, {userName}! System overview and management.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/projects/new">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" /> New Project
                        </Button>
                    </Link>
                    <Link href="/settings">
                        <Button variant="outline">
                            <Settings className="h-4 w-4 mr-2" /> Settings
                        </Button>
                    </Link>
                </div>
            </div>

            {/* System Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{projects.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {activeProjects.length} active, {planingProjects.length} planning
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                        <ClipboardList className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">{activeProjects.length}</div>
                        <p className="text-xs text-muted-foreground">
                            currently in progress
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
                        <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-500">{teams.length}</div>
                        <p className="text-xs text-muted-foreground">
                            collaborative groups
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Registered Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.length}</div>
                        <p className="text-xs text-muted-foreground">
                            system users
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* User Management */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    User Management
                                </CardTitle>
                                <CardDescription>Manage system users and roles</CardDescription>
                            </div>
                            <AddUserDialog onUserAdded={fetchDashboardData} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="relative mb-4">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {users
                                .filter(u =>
                                    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    u.role?.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .slice(0, 50) // Limit display for performance
                                .map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                                            </div>
                                            <div>
                                                <div className="font-medium flex items-center gap-2">
                                                    {user.name || "Unknown"}
                                                    {!user.is_active && <Badge variant="destructive" className="text-[10px] h-4">Inactive</Badge>}
                                                </div>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={getRoleBadge(user.role)}>{user.role}</Badge>
                                        </div>
                                    </div>
                                ))}
                        </div>
                        <Link href="/admin/users">
                            <Button variant="ghost" className="w-full mt-4">
                                Manage All Users
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Project Overview */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <FolderOpen className="h-5 w-5" />
                                    Project Health
                                </CardTitle>
                                <CardDescription>Overview of all system projects</CardDescription>
                            </div>
                            <Link href="/projects/new">
                                <Button size="sm">
                                    <Plus className="h-4 w-4 mr-1" /> New
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {projects.slice(0, 5).map((project) => (
                                <Link key={project.id} href={`/projects/${project.id}`}>
                                    <div className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <FolderOpen className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{project.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={
                                                project.status === 'active' ? 'success' :
                                                    project.status === 'completed' ? 'secondary' : 'outline'
                                            }>
                                                {project.status}
                                            </Badge>
                                            <Button size="icon" variant="ghost">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            {projects.length === 0 && (
                                <p className="text-muted-foreground text-center py-8">
                                    No projects yet. Create your first project!
                                </p>
                            )}
                        </div>
                        <Link href="/projects">
                            <Button variant="ghost" className="w-full mt-4">
                                View All Projects
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Audit Logs Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" /> System Audit Logs
                    </CardTitle>
                    <CardDescription>Recent system activities and security events</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {auditLogs.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">No audit logs found.</p>
                        ) : (
                            auditLogs.slice(0, 10).map((log: any) => (
                                <div key={log.id} className="flex justify-between items-center p-2 text-sm border-b last:border-0">
                                    <div className="flex gap-3">
                                        <Badge variant="outline" className="font-mono text-xs">{log.action}</Badge>
                                        <span>{log.details ? JSON.stringify(log.details) : 'No details'}</span>
                                    </div>
                                    <span className="text-muted-foreground text-xs">
                                        {new Date(log.created_at).toLocaleString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Admin Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                    <Link href="/projects/new">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" /> Create Project
                        </Button>
                    </Link>
                    <Link href="/admin/users">
                        <Button variant="outline">
                            <Users className="h-4 w-4 mr-2" /> Manage Users
                        </Button>
                    </Link>
                    <Link href="/milestones">
                        <Button variant="outline">
                            <ClipboardList className="h-4 w-4 mr-2" /> Milestones
                        </Button>
                    </Link>
                    <Link href="/settings">
                        <Button variant="outline">
                            <Settings className="h-4 w-4 mr-2" /> System Settings
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
}
