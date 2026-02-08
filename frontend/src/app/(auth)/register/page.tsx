"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Github, Loader2, GraduationCap, Users, Shield } from "lucide-react"
import { apiClient } from "@/lib/api"
import { supabase, SUPABASE_URL } from "@/lib/supabase"

type Role = 'student' | 'mentor' | 'admin'

const roleOptions = [
    {
        value: 'student' as Role,
        label: 'Student',
        description: 'Track your projects and tasks',
        icon: GraduationCap,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500'
    },
    {
        value: 'mentor' as Role,
        label: 'Mentor',
        description: 'Guide and review student work',
        icon: Users,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500'
    },
    {
        value: 'admin' as Role,
        label: 'Admin',
        description: 'Manage all projects and users',
        icon: Shield,
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500'
    }
]

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [selectedRole, setSelectedRole] = useState<Role>('student')
    const router = useRouter()

    async function handleGitHubLogin() {
        setIsLoading(true)
        setError(null)

        // Store selected role in sessionStorage for callback to use
        sessionStorage.setItem('signup_role', selectedRole)

        try {
            // Construct the OAuth URL directly - uses exported URL from supabase module
            const redirectTo = `${window.location.origin}/callback`

            if (!SUPABASE_URL) {
                throw new Error('Supabase URL not configured')
            }

            // Direct redirect to Supabase OAuth endpoint
            const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=github&redirect_to=${encodeURIComponent(redirectTo)}`
            window.location.href = authUrl
        } catch (err) {
            const message = err instanceof Error ? err.message : 'GitHub login failed'
            setError(message)
            setIsLoading(false)
        }
    }

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(event.currentTarget)
        const name = formData.get('name') as string
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        try {
            const response = await apiClient.register(email, password, name, selectedRole)

            if (response.success) {
                setSuccess(true)
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    router.push('/login')
                }, 2000)
            } else {
                setError(response.error || 'Registration failed')
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Registration failed. Please try again.'
            setError(message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <Card className="w-full max-w-md z-10 border-border/50 bg-black/40 backdrop-blur-xl shadow-2xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
                    <CardDescription>
                        Select your role and enter your details
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 text-sm text-green-500 bg-green-500/10 border border-green-500/20 rounded-md">
                            Account created! Redirecting to login...
                        </div>
                    )}

                    {/* Role Selection */}
                    <div className="space-y-2">
                        <Label>Select Your Role</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {roleOptions.map((role) => {
                                const Icon = role.icon
                                const isSelected = selectedRole === role.value
                                return (
                                    <button
                                        key={role.value}
                                        type="button"
                                        onClick={() => setSelectedRole(role.value)}
                                        disabled={isLoading}
                                        className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${isSelected
                                            ? `${role.borderColor} ${role.bgColor}`
                                            : 'border-border/50 hover:border-border'
                                            }`}
                                    >
                                        <Icon className={`h-5 w-5 ${isSelected ? role.color : 'text-muted-foreground'}`} />
                                        <span className={`text-xs font-medium ${isSelected ? role.color : 'text-muted-foreground'}`}>
                                            {role.label}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            {roleOptions.find(r => r.value === selectedRole)?.description}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        <Button
                            variant="outline"
                            className="w-full"
                            disabled={isLoading}
                            onClick={handleGitHubLogin}
                            type="button"
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Github className="mr-2 h-4 w-4" />
                            )}{" "}
                            Sign up with GitHub as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                        </Button>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-muted/50" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-transparent px-2 text-muted-foreground backdrop-blur-sm">
                                Or continue with email
                            </span>
                        </div>
                    </div>
                    <form onSubmit={onSubmit}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="John Doe"
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                            <Button className="w-full" type="submit" disabled={isLoading || success} variant="premium">
                                {isLoading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Create {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Account
                            </Button>
                        </div>
                    </form>
                </CardContent>
                <CardFooter>
                    <div className="text-sm text-muted-foreground w-full text-center">
                        Already have an account?{" "}
                        <Link href="/login" className="text-primary hover:underline underline-offset-4">
                            Sign in
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
