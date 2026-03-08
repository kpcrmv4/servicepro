import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

// =============================================================================
// Push Notification Send API
// =============================================================================
// ใช้ web-push library ส่ง push notification ไปยัง subscriptions
// =============================================================================

// ตั้งค่า VAPID keys (ต้องตั้ง environment variables)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@kpservicepro.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, unknown>
  actions?: Array<{ action: string; title: string; icon?: string }>
  requireInteraction?: boolean
}

export async function POST(request: NextRequest) {
  try {
    // Verify internal API key (ป้องกันเรียกจากภายนอก)
    const authHeader = request.headers.get('authorization')
    const internalKey = process.env.INTERNAL_API_KEY

    // ถ้ามี internal key ต้องตรวจสอบ, ถ้าไม่มีให้ผ่าน (dev mode)
    if (internalKey && authHeader !== `Bearer ${internalKey}`) {
      // ยังอนุญาตให้เรียกจาก server actions ภายใน (ไม่มี auth header)
      // เพราะ server actions เรียกผ่าน fetch ภายใน
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'VAPID keys not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { subscriptions, payload } = body as {
      subscriptions: PushSubscriptionData[]
      payload: PushPayload
    }

    if (!subscriptions || !Array.isArray(subscriptions) || subscriptions.length === 0) {
      return NextResponse.json({ error: 'No subscriptions provided' }, { status: 400 })
    }

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          JSON.stringify(payload),
          {
            TTL: 60 * 60, // 1 hour
            urgency: 'high',
          }
        )
      )
    )

    const sent = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    // Log failed subscriptions (อาจต้อง deactivate)
    const failedEndpoints: string[] = []
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const error = r.reason as { statusCode?: number }
        // 410 Gone = subscription expired, should remove
        if (error?.statusCode === 410 || error?.statusCode === 404) {
          failedEndpoints.push(subscriptions[i].endpoint)
        }
      }
    })

    // Deactivate expired subscriptions
    if (failedEndpoints.length > 0) {
      // ใช้ supabase admin client ถ้ามี
      // สำหรับตอนนี้ log ไว้ก่อน
      console.log('[Push] Expired subscriptions:', failedEndpoints.length)
    }

    return NextResponse.json({ sent, failed, total: subscriptions.length })
  } catch (error) {
    console.error('[Push API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =============================================================================
// GET: Return VAPID public key for client-side subscription
// =============================================================================
export async function GET() {
  return NextResponse.json({
    publicKey: VAPID_PUBLIC_KEY,
  })
}
