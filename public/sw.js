// =============================================================================
// KPServicePro Service Worker
// =============================================================================
// Handles: PWA offline support, Push Notifications, Background Sync
// =============================================================================

const CACHE_NAME = 'kpservicepro-v1'
const OFFLINE_URL = '/offline'

// Assets to cache for offline support
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// =============================================================================
// INSTALL EVENT - Cache essential assets
// =============================================================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching assets')
      return cache.addAll(PRECACHE_ASSETS)
    })
  )
  // Activate immediately
  self.skipWaiting()
})

// =============================================================================
// ACTIVATE EVENT - Clean up old caches
// =============================================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  // Take control of all pages immediately
  self.clients.claim()
})

// =============================================================================
// FETCH EVENT - Network first, fallback to cache
// =============================================================================
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip API requests and auth requests
  const url = new URL(event.request.url)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse
          // If no cache, show offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL)
          }
          return new Response('Offline', { status: 503 })
        })
      })
  )
})

// =============================================================================
// PUSH EVENT - Handle Push Notifications
// =============================================================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')

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
    // Thai language support
    lang: 'th',
    dir: 'ltr',
    renotify: true,
    silent: false,
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// =============================================================================
// NOTIFICATION CLICK EVENT - Handle notification interactions
// =============================================================================
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag)
  event.notification.close()

  const url = event.notification.data?.url || '/dashboard'

  // Handle action buttons
  if (event.action) {
    switch (event.action) {
      case 'view':
        // Open the specific page
        break
      case 'dismiss':
        // Just close the notification
        return
      case 'approve':
        // Handle approve action (e.g., quotation approval)
        break
      default:
        break
    }
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })
  )
})

// =============================================================================
// NOTIFICATION CLOSE EVENT - Track dismissed notifications
// =============================================================================
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification dismissed:', event.notification.tag)
})

// =============================================================================
// MESSAGE EVENT - Handle messages from the main app
// =============================================================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
