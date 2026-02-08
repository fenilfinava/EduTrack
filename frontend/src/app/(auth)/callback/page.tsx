"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { apiClient } from "@/lib/api"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const hasRun = useRef(false)

    useEffect(() => {
        if (hasRun.current) return
        hasRun.current = true

        async function handleCallback() {
            try {
                // Get session from Supabase after OAuth redirect
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                if (sessionError || !session?.user) {
                    setError("Authentication failed. Please try again.")
                    setTimeout(() => router.push('/login'), 2000)
                    return
                }

                // Store the access token
                if (session.access_token) {
                    localStorage.setItem('access_token', session.access_token)
                    apiClient.setToken(session.access_token)
                }

                // Check if role was stored during signup (for new users)
                const signupRole = sessionStorage.getItem('signup_role') || 'student'
                sessionStorage.removeItem('signup_role') // Clean up

                // Use backend API to sync/create profile (bypasses RLS)
                const profileRes = await apiClient.syncProfile(
                    session.user.id,
                    session.user.email || '',
                    session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                    signupRole
                )

                if (profileRes.success && profileRes.data) {
                    const profile = profileRes.data as { role: string }
                    router.push(`/${profile.role}`)
                } else {
                    setError("Failed to sync profile. Please try again.")
                    setTimeout(() => router.push('/register'), 2000)
                }

            } catch (err) {
                console.error("Auth callback error:", err)
                setError("Something went wrong. Redirecting to login...")
                setTimeout(() => router.push('/login'), 2000)
            }
        }

        handleCallback()
    }, [router])

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <div className="text-center space-y-4">
                {error ? (
                    <p className="text-red-500">{error}</p>
                ) : (
                    <>
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="text-muted-foreground">Completing authentication...</p>
                    </>
                )}
            </div>
        </div>
    )
}
