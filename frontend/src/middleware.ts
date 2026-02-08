import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return parseCookieHeader(request.headers.get('Cookie') ?? '').map((cookie) => ({
                        ...cookie,
                        value: cookie.value ?? '',
                    }))
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { session },
    } = await supabase.auth.getSession()

    // Protected routes pattern
    if (session && (
        request.nextUrl.pathname.startsWith('/admin') ||
        request.nextUrl.pathname.startsWith('/student') ||
        request.nextUrl.pathname.startsWith('/mentor'))) {

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

        const role = profile?.role || 'student'

        // Strict Role Enforcement
        if (request.nextUrl.pathname.startsWith('/admin') && role !== 'admin') {
            return NextResponse.redirect(new URL(`/${role}`, request.url))
        }
        if (request.nextUrl.pathname.startsWith('/mentor') && role !== 'mentor') {
            return NextResponse.redirect(new URL(`/${role}`, request.url))
        }
        // Student route is generally open to admins too in some systems, but strict here
        if (request.nextUrl.pathname.startsWith('/student') && role !== 'student' && role !== 'admin') {
            return NextResponse.redirect(new URL(`/${role}`, request.url))
        }
    }

    return response
}

export const config = {
    matcher: ['/admin/:path*', '/student/:path*', '/mentor/:path*'],
}
