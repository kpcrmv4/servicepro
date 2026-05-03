import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { updateSession } from '@/lib/supabase/middleware'

// ============================================================
// Custom domain → tenant rewrite
// ============================================================
// When a request comes in via a tenant's custom domain (e.g.
// www.mygarage.com), we rewrite the URL to /shop/<slug>/... so the
// public storefront and landing pages just work as if the customer
// had visited /shop/<slug> directly.
//
// We never rewrite for the platform's own host (kpservicepro.com or
// the Vercel preview/local hosts).

const PLATFORM_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '').replace(/\/$/, ''),
].filter(Boolean) as string[])

function isPlatformHost(host: string): boolean {
  if (PLATFORM_HOSTS.has(host)) return true
  // Vercel preview deployments
  if (host.endsWith('.vercel.app')) return true
  // Localhost with port
  if (host.startsWith('localhost:') || host.startsWith('127.0.0.1:')) return true
  // Production domain (configurable via NEXT_PUBLIC_APP_URL)
  return false
}

// Cache tenant lookups in-process for the duration of one cold start
// (or until middleware reloads). 60-second TTL is fine.
const TENANT_CACHE = new Map<string, { slug: string | null; expiresAt: number }>()
const TENANT_CACHE_TTL_MS = 60_000

async function lookupTenantByDomain(host: string): Promise<string | null> {
  const cached = TENANT_CACHE.get(host)
  if (cached && cached.expiresAt > Date.now()) return cached.slug

  // Service-role lookup — middleware runs without auth context
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
  const { data } = await supabase
    .from('tenants')
    .select('slug')
    .eq('custom_domain', host)
    .eq('custom_domain_verified', true)
    .maybeSingle()
  const slug = (data?.slug as string) ?? null
  TENANT_CACHE.set(host, { slug, expiresAt: Date.now() + TENANT_CACHE_TTL_MS })
  return slug
}

// ============================================================
// Auth-protected routes
// ============================================================

const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
]

function isPublicRoute(pathname: string): boolean {
  if (publicRoutes.includes(pathname)) return true
  if (pathname.startsWith('/c/')) return true
  if (pathname.startsWith('/liff/')) return true
  if (pathname.startsWith('/shop/')) return true
  if (pathname.startsWith('/inspect/')) return true
  if (pathname.startsWith('/api/')) return true
  if (pathname.startsWith('/auth/')) return true
  if (pathname.startsWith('/_next/')) return true
  if (pathname.startsWith('/favicon')) return true
  if (pathname.match(/\.(svg|png|jpg|jpeg|gif|ico|css|js|woff|woff2)$/)) return true
  return false
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const host = request.headers.get('host')?.toLowerCase().split(':')[0] || ''

  // ----- Custom domain handling -----
  // Skip for platform hosts and API routes (API stays on the
  // platform domain regardless of which tenant called it).
  if (
    !isPlatformHost(host) &&
    !url.pathname.startsWith('/api/') &&
    !url.pathname.startsWith('/_next/')
  ) {
    const slug = await lookupTenantByDomain(host)
    if (slug) {
      // Already on /shop/<slug>/... ? leave it alone.
      if (!url.pathname.startsWith(`/shop/${slug}`)) {
        // Default: route bare hostname to /shop/<slug>
        // Specific shorthand routes:
        //   /booking → /c/booking?tenant=<slug>
        //   /track/* → /c/track/* (works as-is)
        const p = url.pathname
        if (p === '/' || p === '/index') {
          url.pathname = `/shop/${slug}`
        } else if (p === '/booking') {
          url.pathname = '/c/booking'
          url.searchParams.set('tenant', slug)
        } else if (p.startsWith('/track/')) {
          url.pathname = `/c${p}`
        } else if (
          p.startsWith('/products') ||
          p.startsWith('/cart') ||
          p.startsWith('/checkout') ||
          p.startsWith('/orders')
        ) {
          url.pathname = `/shop/${slug}${p}`
        } else {
          // Generic — prefix with /shop/<slug>
          url.pathname = `/shop/${slug}${p}`
        }
        return NextResponse.rewrite(url)
      }
    }
  }

  // ----- Auth check -----
  const { supabaseResponse, user } = await updateSession(request)

  if (isPublicRoute(url.pathname)) {
    if (user && (url.pathname === '/login' || url.pathname === '/register')) {
      const { supabase } = await updateSession(request)
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = profile?.role === 'super_admin' ? '/super-admin' : '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
    return supabaseResponse
  }

  if (!user && (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/super-admin'))) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirect', url.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
