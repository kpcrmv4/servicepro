import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
]

function isPublicRoute(pathname: string): boolean {
  // Exact match for public routes
  if (publicRoutes.includes(pathname)) return true

  // Prefix match for customer portal, API routes, and auth callback
  if (pathname.startsWith('/c/')) return true
  if (pathname.startsWith('/api/')) return true
  if (pathname.startsWith('/auth/')) return true

  // Static assets and Next.js internals
  if (pathname.startsWith('/_next/')) return true
  if (pathname.startsWith('/favicon')) return true
  if (pathname.match(/\.(svg|png|jpg|jpeg|gif|ico|css|js|woff|woff2)$/)) return true

  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Refresh auth session on every request
  const { supabaseResponse, user } = await updateSession(request)

  // Allow public routes without authentication
  if (isPublicRoute(pathname)) {
    // If authenticated user visits login/register, redirect to dashboard
    if (user && (pathname === '/login' || pathname === '/register')) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
    return supabaseResponse
  }

  // Protect /dashboard/* and /super-admin/* routes
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/super-admin'))) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
