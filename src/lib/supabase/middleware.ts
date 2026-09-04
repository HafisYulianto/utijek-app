import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/types/database.types'

const ROLE_ROUTES: Record<UserRole, string> = {
  admin: '/admin',
  driver: '/driver',
  customer: '/',
}

const PROTECTED_ROUTES = ['/admin', '/driver', '/book', '/orders', '/profile']
const ADMIN_ROUTES = ['/admin']
const DRIVER_ROUTES = ['/driver']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project')) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Redirect unauthenticated users from protected routes
  if (!user && PROTECTED_ROUTES.some((r) => path.startsWith(r))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If authenticated, get user role and enforce route access
  if (user) {
    // Redirect from login if already authed
    if (path === '/login') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = (profile?.role as UserRole) ?? 'customer'
      return NextResponse.redirect(new URL(ROLE_ROUTES[role], request.url))
    }

    // Block wrong role from admin routes
    if (ADMIN_ROUTES.some((r) => path.startsWith(r))) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile?.role !== 'admin') {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    // Block wrong role from driver routes
    if (DRIVER_ROUTES.some((r) => path.startsWith(r))) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile?.role !== 'driver') {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
  }

  return supabaseResponse
}
