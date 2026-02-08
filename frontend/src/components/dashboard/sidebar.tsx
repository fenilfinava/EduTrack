"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api"
import {
    LayoutDashboard,
    FolderOpen,
    CheckSquare,
    Trophy,
    Users,
    Settings,
    Github
} from "lucide-react"

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/student", // Dynamic later based on role
        icon: LayoutDashboard,
    },
    {
        title: "Projects",
        href: "/projects",
        icon: FolderOpen,
    },
    {
        title: "Tasks",
        href: "/tasks",
        icon: CheckSquare,
    },
    {
        title: "Milestones",
        href: "/milestones",
        icon: Trophy,
    },
    {
        title: "Team",
        href: "/team",
        icon: Users,
    },
    {
        title: "GitHub",
        href: "/github",
        icon: Github,
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings,
    },
]

export function Sidebar() {
    const pathname = usePathname()
    const [dashboardPath, setDashboardPath] = useState("/student")

    useEffect(() => {
        const fetchRole = async () => {
            // Quick check from localStorage first to prevent flash
            if (typeof window !== 'undefined') {
                // We don't store role in generic, but we can try to fetch
            }
            const { data } = await apiClient.getCurrentUser()
            if (data) {
                const user = data as { role: string }
                setDashboardPath(`/${user.role}`)
            }
        }
        fetchRole()
    }, [])

    const items = sidebarItems.map(item => ({
        ...item,
        href: item.title === "Dashboard" ? dashboardPath : item.href
    }))

    return (
        <aside className="hidden border-r-0 bg-card fixed h-full z-20 w-20 lg:flex flex-col items-center py-6 gap-6 shadow-2xl shadow-black/5">
            <div className="mb-4">
                <Link href="/" className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground font-heading font-bold text-xl tracking-tighter">
                    <Trophy className="h-6 w-6" />
                </Link>
            </div>

            <nav className="flex-1 w-full px-2 space-y-2 flex flex-col items-center">
                {items.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={item.title}
                            className={cn(
                                "flex items-center justify-center p-3 rounded-2xl transition-all duration-300 group relative",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-110"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-6 w-6" />
                            {/* Dot indicator for active state */}
                            {isActive && (
                                <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent-lime rounded-l-full hidden" />
                            )}
                        </Link>
                    )
                })}
            </nav>

            <div className="mt-auto flex flex-col items-center gap-4 mb-4">
                {/* Theme Toggle can go here or Header. Let's put a placeholder setting or profile here */}
                {/* Actually, user asked for ThemeToggle in Header. I will create a ThemeToggle in Header. */}
            </div>
        </aside>
    )
}
