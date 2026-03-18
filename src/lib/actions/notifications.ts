'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  NotificationEventType,
  SendNotificationPayload,
  TenantNotificationConfig,
  Notification,
} from '@/lib/types/notifications'
import { ROLE_CONFIG_KEYS } from '@/lib/types/notifications'
import type { UserRole } from '@/lib/types/database'
import { getCurrentUser } from '@/lib/actions/auth-helpers'

// =============================================================================
// Push Subscription Management
// =============================================================================

export async function subscribePush(subscription: {
  endpoint: string
  keys: { p256dh: string; auth: string }
  userAgent?: string
}) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return { error: 'ไม่ได้เข้าสู่ระบบ' }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      tenant_id: user.tenant_id,
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: subscription.userAgent || null,
      device_name: getDeviceName(subscription.userAgent || ''),
      is_active: true,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'endpoint',
    })

  if (error) return { error: error.message }
  return { success: true }
}

export async function unsubscribePush(endpoint: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return { error: 'ไม่ได้เข้าสู่ระบบ' }

  const { error } = await supabase
    .from('push_subscriptions')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('endpoint', endpoint)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function getMySubscriptions() {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return data || []
}

// =============================================================================
// Notification CRUD
// =============================================================================

export async function getNotifications(options?: {
  limit?: number
  unreadOnly?: boolean
}) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return []

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(options?.limit || 50)

  if (options?.unreadOnly) {
    query = query.eq('is_read', false)
  }

  const { data } = await query
  return (data || []) as Notification[]
}

export async function getUnreadCount() {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return 0

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return count || 0
}

export async function markAsRead(notificationId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return { error: 'ไม่ได้เข้าสู่ระบบ' }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

export async function markAllAsRead() {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return { error: 'ไม่ได้เข้าสู่ระบบ' }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteNotification(notificationId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return { error: 'ไม่ได้เข้าสู่ระบบ' }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

// =============================================================================
// Tenant Notification Config (per-tenant per-role settings)
// =============================================================================

export async function getTenantNotificationConfig(): Promise<TenantNotificationConfig[]> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data } = await supabase
    .from('tenant_notification_config')
    .select('*')
    .eq('tenant_id', user.tenant_id)
    .order('event_type')

  return (data || []) as TenantNotificationConfig[]
}

export async function updateTenantNotificationConfig(
  eventType: NotificationEventType,
  updates: Partial<Omit<TenantNotificationConfig, 'id' | 'tenant_id' | 'event_type' | 'created_at' | 'updated_at'>>
) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return { error: 'ไม่ได้เข้าสู่ระบบ' }
  if (!['owner', 'admin'].includes(user.role)) return { error: 'เฉพาะเจ้าของร้านหรือผู้ดูแลเท่านั้นที่แก้ไขได้' }

  const { error } = await supabase
    .from('tenant_notification_config')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', user.tenant_id)
    .eq('event_type', eventType)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function bulkUpdateTenantNotificationConfig(
  configs: Array<{
    eventType: NotificationEventType
    updates: Partial<Omit<TenantNotificationConfig, 'id' | 'tenant_id' | 'event_type' | 'created_at' | 'updated_at'>>
  }>
) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return { error: 'ไม่ได้เข้าสู่ระบบ' }
  if (!['owner', 'admin'].includes(user.role)) return { error: 'เฉพาะเจ้าของร้านหรือผู้ดูแลเท่านั้นที่แก้ไขได้' }

  const errors: string[] = []
  for (const config of configs) {
    const { error } = await supabase
      .from('tenant_notification_config')
      .update({
        ...config.updates,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', user.tenant_id)
      .eq('event_type', config.eventType)

    if (error) errors.push(`${config.eventType}: ${error.message}`)
  }

  if (errors.length > 0) return { error: errors.join(', ') }
  revalidatePath('/dashboard/settings')
  return { success: true }
}

// =============================================================================
// Send Notification - Core function ที่เรียกจาก triggers ต่างๆ
// =============================================================================

export async function sendNotification(payload: SendNotificationPayload) {
  const supabase = await createClient()

  // 1. ดึง tenant notification config สำหรับ event นี้
  const { data: config } = await supabase
    .from('tenant_notification_config')
    .select('*')
    .eq('tenant_id', payload.tenantId)
    .eq('event_type', payload.eventType)
    .single()

  // ถ้าไม่มี config หรือปิดอยู่ ไม่ส่ง
  if (!config || !config.is_enabled) return { skipped: true }

  // 2. หา users ที่ต้องส่งแจ้งเตือน
  let targetUsers: Array<{ id: string; role: string }> = []

  if (payload.targetUserId) {
    // ส่งเฉพาะ user ที่ระบุ
    const { data } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', payload.targetUserId)
      .eq('is_active', true)
      .single()
    if (data) targetUsers = [data]
  } else {
    // ส่งตาม role config ของ tenant
    const roles: UserRole[] = payload.targetRoles || []

    if (!payload.targetRoles) {
      // ใช้ config จาก tenant_notification_config
      if (config.notify_owner) roles.push('owner')
      if (config.notify_admin) roles.push('admin')
      if (config.notify_manager) roles.push('manager')
      if (config.notify_technician) roles.push('technician')
      if (config.notify_receptionist) roles.push('receptionist')
    }

    if (roles.length === 0) return { skipped: true }

    const { data } = await supabase
      .from('users')
      .select('id, role')
      .eq('tenant_id', payload.tenantId)
      .eq('is_active', true)
      .in('role', roles)

    targetUsers = data || []
  }

  if (targetUsers.length === 0) return { skipped: true }

  // 3. สร้าง in-app notifications
  const channel: 'push' | 'in_app' | 'both' =
    config.push_enabled && config.in_app_enabled ? 'both' :
    config.push_enabled ? 'push' : 'in_app'

  if (config.in_app_enabled) {
    const notifications = targetUsers.map((u) => ({
      tenant_id: payload.tenantId,
      user_id: u.id,
      event_type: payload.eventType,
      title: payload.title,
      body: payload.body,
      icon: payload.icon || null,
      url: payload.url || null,
      data: payload.data || null,
      channel,
      is_read: false,
      push_sent: false,
    }))

    await supabase.from('notifications').insert(notifications)
  }

  // 4. ส่ง Web Push notifications
  if (config.push_enabled) {
    const userIds = targetUsers.map((u) => u.id)

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds)
      .eq('is_active', true)

    if (subscriptions && subscriptions.length > 0) {
      // ส่ง push ผ่าน API route (เพราะ web-push ต้องใช้ server-side)
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000'

        await fetch(`${baseUrl}/api/push/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscriptions: subscriptions.map((s) => ({
              endpoint: s.endpoint,
              keys: { p256dh: s.p256dh, auth: s.auth },
            })),
            payload: {
              title: payload.title,
              body: payload.body,
              icon: payload.icon || '/icons/icon-192x192.png',
              badge: '/icons/icon-96x96.png',
              tag: payload.eventType,
              data: {
                url: payload.url || '/dashboard',
                ...payload.data,
              },
            },
          }),
        })
      } catch (e) {
        console.error('[Notification] Failed to send push:', e)
      }
    }
  }

  return { sent: targetUsers.length }
}

// =============================================================================
// Initialize default config for a tenant (เรียกเมื่อสร้าง tenant ใหม่)
// =============================================================================

export async function initializeNotificationConfig(tenantId: string) {
  const supabase = await createClient()

  const { NOTIFICATION_EVENTS, DEFAULT_ROLE_CONFIG } = await import('@/lib/types/notifications')

  const configs = Object.keys(NOTIFICATION_EVENTS).map((eventType) => {
    const roles = DEFAULT_ROLE_CONFIG[eventType as NotificationEventType] || []
    return {
      tenant_id: tenantId,
      event_type: eventType,
      notify_owner: roles.includes('owner'),
      notify_admin: roles.includes('admin'),
      notify_manager: roles.includes('manager'),
      notify_technician: roles.includes('technician'),
      notify_receptionist: roles.includes('receptionist'),
      push_enabled: true,
      in_app_enabled: true,
      line_enabled: false,
      is_enabled: true,
    }
  })

  const { error } = await supabase
    .from('tenant_notification_config')
    .upsert(configs, { onConflict: 'tenant_id,event_type' })

  if (error) return { error: error.message }
  return { success: true }
}

// =============================================================================
// Helpers
// =============================================================================

function getDeviceName(userAgent: string): string {
  if (/iPhone/i.test(userAgent)) return 'iPhone'
  if (/iPad/i.test(userAgent)) return 'iPad'
  if (/Android/i.test(userAgent)) return 'Android'
  if (/Windows/i.test(userAgent)) return 'Windows PC'
  if (/Mac/i.test(userAgent)) return 'Mac'
  if (/Linux/i.test(userAgent)) return 'Linux'
  return 'Unknown Device'
}
