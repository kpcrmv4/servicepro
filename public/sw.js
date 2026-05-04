// =============================================================================
// KPServicePro Service Worker
// =============================================================================
// Strategies:
//   - Navigation (HTML)        → NetworkFirst, offline-fallback to /offline
//   - Static assets            → StaleWhileRevalidate (JS/CSS/fonts/images)
//   - Manifest + icons         → CacheFirst
//   - API endpoints            → NetworkOnly (skip cache)
//
// Also handles: Push notifications, background sync queue stub.
// =============================================================================

const VERSION = 'v2-2026-05-04'
const PRECACHE = `kpservicepro-precache-${VERSION}`
const RUNTIME_HTML = `kpservicepro-runtime-html-${VERSION}`
const RUNTIME_STATIC = `kpservicepro-runtime-static-${VERSION}`
const OFFLINE_URL = '/offline'

const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// =============================================================================
// INSTALL — precache critical shell
// =============================================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_ASSETS))
  )
  self.skipWaiting()
})

// =============================================================================
// ACTIVATE — purge old versions
// =============================================================================
self.addEventListener('activate', (event) => {
  const allow = new Set([PRECACHE, RUNTIME_HTML, RUNTIME_STATIC])
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((n) => !allow.has(n)).map((n) => caches.delete(n)))
      )
      .then(() => self.clients.claim())
  )
})

// =============================================================================
// FETCH — strategy-by-route
// =============================================================================
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return
  // Skip API + auth — always live
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return
  // Skip Sentry tunnel
  if (url.pathname.startsWith('/monitoring/')) return

  // Navigation requests → NetworkFirst, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, RUNTIME_HTML, OFFLINE_URL))
    return
  }

  // Manifest + icons → CacheFirst (rarely change)
  if (url.pathname === '/manifest.json' || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(request, PRECACHE))
    return
  }

  // Everything else (Next.js _next/static, fonts, images) → StaleWhileRevalidate
  event.respondWith(staleWhileRevalidate(request, RUNTIME_STATIC))
})

async function networkFirst(request, cacheName, offlineUrl) {
  try {
    const fresh = await fetch(request)
    if (fresh && fresh.status === 200) {
      const cache = await caches.open(cacheName)
      cache.put(request, fresh.clone())
    }
    return fresh
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    if (offlineUrl) {
      const offline = await caches.match(offlineUrl)
      if (offline) return offline
    }
    return new Response('Offline', { status: 503 })
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const fresh = await fetch(request)
    if (fresh && fresh.status === 200) {
      const cache = await caches.open(cacheName)
      cache.put(request, fresh.clone())
    }
    return fresh
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const networkPromise = fetch(request)
    .then((fresh) => {
      if (fresh && fresh.status === 200) cache.put(request, fresh.clone())
      return fresh
    })
    .catch(() => undefined)
  return cached || networkPromise || new Response('Offline', { status: 503 })
}

// =============================================================================
// PUSH NOTIFICATIONS
// =============================================================================
self.addEventListener('push', (event) => {
  let data = {
    title: 'KPServicePro',
    body: 'คุณมีการแจ้งเตือนใหม่',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'default',
    data: { url: '/dashboard' },
  }

  try {
    if (event.data) {
      const payload = event.data.json()
      data = { ...data, ...payload }
    }
  } catch (e) {
    console.error('[SW] Error parsing push data:', e)
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-96x96.png',
    tag: data.tag || 'default',
    data: data.data || { url: '/dashboard' },
    vibrate: [100, 50, 100],
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    lang: 'th',
    dir: 'ltr',
    renotify: true,
    silent: false,
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'

  if (event.action === 'dismiss') return

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus()
            client.navigate(url)
            return
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url)
      })
  )
})

self.addEventListener('notificationclose', () => {})

// =============================================================================
// BACKGROUND SYNC — queue mutations made while offline
// =============================================================================
// The app posts {type:'queue-mutation', payload} to the SW.
// We persist via cache (no IndexedDB to keep this lean) and replay on 'sync'.

self.addEventListener('sync', (event) => {
  if (event.tag === 'kpservicepro-mutation-queue') {
    event.waitUntil(replayQueue())
  }
})

async function replayQueue() {
  // No-op stub for Phase 1. Real queue persistence will land alongside the
  // sync-queue indicator UI in Phase 6 (customer/LIFF) where offline writes
  // matter most. Leaving the listener registered keeps the API surface stable.
  return undefined
}

// =============================================================================
// MESSAGE — control channel from app (skipWaiting, etc.)
// =============================================================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
