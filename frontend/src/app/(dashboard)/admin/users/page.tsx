"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader2, Users, Search, ArrowLeft } from "lucide-react"
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

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        fetchUsers()
    }, [])

    async function fetchUsers() {
        try {
            setLoading(true)
            const res = await apiClient.getUsers()
            if (res.success && res.data) {
                setUsers(res.data as User[])
            }
        } catch (err) {
            console.error("Failed to fetch users:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        try {
            const res = await apiClient.updateUserStatus(userId, !currentStatus)
            if (res.success) {
                setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u))
            }
        } catch (error) {
            console.error("Failed to update user status", error)
        }
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return 'destructive'
            case 'mentor': return 'warning'
            default: return 'secondary'
        }
    }

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                    <p className="text-muted-foreground">Manage all registered users, roles, and access.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, or role..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <AddUserDialog onUserAdded={fetchUsers} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredUsers.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No users found matching your search.</p>
                        ) : (
                            filteredUsers.map((user) => (
                                <div key={user.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                                        </div>
                                        <div>
                                            <div className="font-medium flex items-center gap-2">
                                                {user.name || "Unknown"}
                                                <Badge variant={getRoleBadge(user.role)} className="text-xs">{user.role}</Badge>
                                                {!user.is_active && <Badge variant="destructive" className="text-[10px] h-4">Inactive</Badge>}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {user.role !== 'admin' && (
                                            <Button
                                                size="sm"
                                                variant={user.is_active ? "destructive" : "outline"}
                                                onClick={() => handleToggleStatus(user.id, user.is_active ?? true)}
                                            >
                                                {user.is_active ? "Ban User" : "Activate User"}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
