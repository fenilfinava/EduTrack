"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, User, Bell, Shield, Palette, Save } from "lucide-react"
import { apiClient } from "@/lib/api"

interface UserProfile {
    id: string
    name: string
    email: string
    role: string
    bio?: string
    avatar_url?: string
}

export default function SettingsPage() {
    const [user, setUser] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    useEffect(() => {
        fetchUser()
    }, [])

    async function fetchUser() {
        try {
            setLoading(true)
            const response = await apiClient.getCurrentUser()
            if (response.success && response.data) {
                setUser(response.data as UserProfile)
            }
        } catch (err) {
            console.error("Failed to fetch user:", err)
        } finally {
            setLoading(false)
        }
    }

    async function handleSave(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        setMessage(null)

        // Simulate save - in real app, call API
        setTimeout(() => {
            setSaving(false)
            setMessage("Settings saved successfully!")
        }, 1000)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your account and preferences</p>
            </div>

            {message && (
                <div className="p-3 text-sm text-green-500 bg-green-500/10 border border-green-500/20 rounded-md">
                    {message}
                </div>
            )}

            {/* Profile Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" /> Profile
                    </CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                                {user?.name?.charAt(0) || "U"}
                            </div>
                            <Button type="button" variant="outline">Change Avatar</Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    defaultValue={user?.name || ""}
                                    disabled={saving}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    defaultValue={user?.email || ""}
                                    disabled
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Input
                                id="bio"
                                defaultValue={user?.bio || ""}
                                placeholder="Tell us about yourself..."
                                disabled={saving}
                            />
                        </div>

                        <Button type="submit" disabled={saving}>
                            {saving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Save Changes
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" /> Notifications
                    </CardTitle>
                    <CardDescription>Configure how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-muted-foreground">Receive updates via email</p>
                        </div>
                        <input type="checkbox" defaultChecked className="h-5 w-5" />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Task Reminders</p>
                            <p className="text-sm text-muted-foreground">Get reminded about upcoming tasks</p>
                        </div>
                        <input type="checkbox" defaultChecked className="h-5 w-5" />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Mentor Feedback</p>
                            <p className="text-sm text-muted-foreground">Notify when mentor leaves feedback</p>
                        </div>
                        <input type="checkbox" defaultChecked className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" /> Security
                    </CardTitle>
                    <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button variant="outline">Change Password</Button>
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Role: <span className="font-medium text-foreground">{user?.role || "student"}</span>
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Appearance Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" /> Appearance
                    </CardTitle>
                    <CardDescription>Customize the look and feel</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Dark Mode</p>
                            <p className="text-sm text-muted-foreground">Use dark theme</p>
                        </div>
                        <input type="checkbox" defaultChecked className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
