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

  // Prefix match for customer portal and API routes
  if (pathname.startsWith('/c/')) return true
  if (pathname.startsWith('/api/')) return true

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
    return supabaseResponse
  }

  // Protect /dashboard/* routes - redirect to /login if not authenticated
  if (!user && pathname.startsWith('/dashboard')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // For authenticated users, extract tenant_id from user metadata
  if (user) {
    const tenantId = user.user_metadata?.tenant_id

    // Add tenant_id to request headers for downstream use
    if (tenantId) {
      supabaseResponse.headers.set('x-tenant-id', tenantId)
    }

    // If user has no tenant and is trying to access dashboard, redirect to onboarding
    if (!tenantId && pathname.startsWith('/dashboard')) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/onboarding'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
