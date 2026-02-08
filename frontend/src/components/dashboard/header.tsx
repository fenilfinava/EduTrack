"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Bell, Search, Menu, LogOut, User as UserIcon, Settings } from "lucide-react"
import { apiClient } from "@/lib/api"
import { User } from "@/types"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function Header() {
    const [user, setUser] = useState<User | null>(null)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const router = useRouter()

    // Refs for click outside to close
    const profileRef = useRef<HTMLDivElement>(null)
    const notificationRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await apiClient.getCurrentUser()
                if (res.success && res.data) {
                    setUser(res.data as User)
                }
            } catch (err) {
                console.error("Failed to fetch user:", err)
            }
        }
        fetchUser()

        // Click outside listener
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false)
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            router.push(`/projects?search=${encodeURIComponent(searchQuery)}`)
        }
    }

    const handleLogout = async () => {
        try {
            await apiClient.logout()
            window.location.href = '/login'
        } catch (error) {
            console.error("Logout failed", error)
            window.location.href = '/login' // Force redirect anyway
        }
    }

    const getRoleLabel = (role?: string) => {
        if (!role) return "Dashboard"
        return `${role.charAt(0).toUpperCase() + role.slice(1)}'s Dashboard`
    }

    const getRoleBadgeVariant = (role?: string) => {
        switch (role) {
            case 'admin': return 'destructive'
            case 'mentor': return 'secondary'
            case 'student': return 'default'
            default: return 'outline'
        }
    }

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-4 border-b bg-background/50 backdrop-blur-xl px-6">
            <div className="lg:hidden">
                <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                </Button>
            </div>

            {/* Role Indicator */}
            <div className="hidden md:flex items-center gap-3">
                <Badge variant={getRoleBadgeVariant(user?.role)} className="px-3 py-1 text-sm shadow-sm">
                    {getRoleLabel(user?.role)}
                </Badge>
            </div>

            <div className="flex flex-1 items-center gap-4 justify-end md:justify-start md:ml-4">
                <div className="relative w-full max-w-sm hidden md:block">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search projects..."
                        className="w-full bg-background/50 pl-9 md:w-[300px] lg:w-[300px]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <ThemeToggle />

                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative text-muted-foreground hover:text-foreground"
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    >
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
                    </Button>

                    {isNotificationsOpen && (
                        <div className="absolute right-0 mt-2 w-80 rounded-md border bg-card p-4 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-200">
                            <h3 className="font-semibold mb-2">Notifications</h3>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer">
                                    <div className="h-2 w-2 mt-2 rounded-full bg-blue-500" />
                                    <div>
                                        <p className="text-sm font-medium">Welcome to EduTrack!</p>
                                        <p className="text-xs text-muted-foreground">Get started by creating your first project.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer">
                                    <div className="h-2 w-2 mt-2 rounded-full bg-green-500" />
                                    <div>
                                        <p className="text-sm font-medium">System Update</p>
                                        <p className="text-xs text-muted-foreground">Teams feature is now live! Check it out.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2 outline-none"
                    >
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 p-[1px] cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                            <div className="h-full w-full rounded-full bg-background p-0.5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={user?.avatar_url || "https://github.com/shadcn.png"}
                                    alt={user?.name || "User"}
                                    className="h-full w-full rounded-full object-cover"
                                />
                            </div>
                        </div>
                    </button>

                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-56 rounded-md border bg-card shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-3 border-b">
                                <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                            </div>
                            <div className="p-1">
                                <Link
                                    href="/settings"
                                    className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <UserIcon className="h-4 w-4" />
                                    Profile & Settings
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Log Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
