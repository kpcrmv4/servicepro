// =============================================================================
// Push Notification & Notification System Types
// =============================================================================

import type { UserRole } from './database'

// =============================================================================
// Event Types - ทุก event ที่ระบบรองรับ
// =============================================================================

export const NOTIFICATION_EVENTS = {
  // งานซ่อม
  job_created: { label: 'งานซ่อมใหม่', category: 'jobs', icon: '🔧' },
  job_status_changed: { label: 'สถานะงานเปลี่ยน', category: 'jobs', icon: '🔄' },
  job_assigned: { label: 'ได้รับมอบหมายงาน', category: 'jobs', icon: '👤' },
  job_completed: { label: 'งานเสร็จสิ้น', category: 'jobs', icon: '✅' },
  job_urgent: { label: 'งานเร่งด่วน', category: 'jobs', icon: '🚨' },

  // ใบเสนอราคา
  quotation_pending: { label: 'ใบเสนอราคารออนุมัติ', category: 'quotations', icon: '📋' },
  quotation_approved: { label: 'ใบเสนอราคาอนุมัติแล้ว', category: 'quotations', icon: '✅' },
  quotation_rejected: { label: 'ใบเสนอราคาถูกปฏิเสธ', category: 'quotations', icon: '❌' },

  // DVI ตรวจสภาพรถ
  dvi_completed: { label: 'ตรวจสภาพรถเสร็จ', category: 'dvi', icon: '🔍' },
  dvi_sent_customer: { label: 'ส่ง DVI ให้ลูกค้าแล้ว', category: 'dvi', icon: '📤' },

  // การเงิน
  payment_received: { label: 'รับชำระเงิน', category: 'finance', icon: '💰' },
  payment_overdue: { label: 'ค้างชำระเกินกำหนด', category: 'finance', icon: '⚠️' },

  // สต็อกอะไหล่
  stock_low: { label: 'สต็อกอะไหล่ต่ำ', category: 'inventory', icon: '📦' },
  stock_out: { label: 'อะไหล่หมด', category: 'inventory', icon: '🚫' },
  po_received: { label: 'รับอะไหล่เข้าสต็อก', category: 'inventory', icon: '📥' },

  // LINE OA
  line_new_message: { label: 'ข้อความ LINE ใหม่', category: 'line', icon: '💬' },
  line_new_follower: { label: 'ผู้ติดตาม LINE ใหม่', category: 'line', icon: '➕' },

  // นัดหมาย
  booking_new: { label: 'นัดหมายใหม่', category: 'bookings', icon: '📅' },
  booking_reminder: { label: 'เตือนนัดหมาย', category: 'bookings', icon: '⏰' },

  // เตือนบริการ
  service_reminder: { label: 'เตือนเช็คระยะ', category: 'reminders', icon: '🔔' },
  warranty_expiring: { label: 'รับประกันใกล้หมด', category: 'reminders', icon: '📄' },

  // พนักงาน
  employee_clock_in: { label: 'พนักงานเข้างาน', category: 'employees', icon: '🟢' },
  employee_clock_out: { label: 'พนักงานออกงาน', category: 'employees', icon: '🔴' },

  // รายงาน
  daily_summary: { label: 'สรุปรายวัน', category: 'reports', icon: '📊' },

  // ประกัน
  insurance_claim_update: { label: 'อัปเดตเคลมประกัน', category: 'insurance', icon: '🏥' },

  // งานเพิ่มเติม
  additional_work_request: { label: 'ขอทำงานเพิ่มเติม', category: 'jobs', icon: '➕' },

  // รีวิว
  review_received: { label: 'ได้รับรีวิวจากลูกค้า', category: 'reviews', icon: '⭐' },
} as const

export type NotificationEventType = keyof typeof NOTIFICATION_EVENTS

// =============================================================================
// Event Categories - จัดกลุ่ม events สำหรับ UI
// =============================================================================

export const EVENT_CATEGORIES = {
  jobs: { label: 'งานซ่อม', icon: '🔧' },
  quotations: { label: 'ใบเสนอราคา', icon: '📋' },
  dvi: { label: 'ตรวจสภาพรถ (DVI)', icon: '🔍' },
  finance: { label: 'การเงิน', icon: '💰' },
  inventory: { label: 'สต็อกอะไหล่', icon: '📦' },
  line: { label: 'LINE OA', icon: '💬' },
  bookings: { label: 'นัดหมาย', icon: '📅' },
  reminders: { label: 'การเตือน', icon: '🔔' },
  employees: { label: 'พนักงาน', icon: '👥' },
  reports: { label: 'รายงาน', icon: '📊' },
  insurance: { label: 'ประกัน', icon: '🏥' },
  reviews: { label: 'รีวิว', icon: '⭐' },
} as const

export type EventCategory = keyof typeof EVENT_CATEGORIES

// =============================================================================
// Database Interfaces
// =============================================================================

export interface PushSubscription {
  id: string
  tenant_id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  user_agent: string | null
  device_name: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  tenant_id: string
  user_id: string
  event_type: NotificationEventType
  title: string
  body: string
  icon: string | null
  url: string | null
  data: Record<string, unknown> | null
  channel: 'push' | 'in_app' | 'both'
  is_read: boolean
  read_at: string | null
  push_sent: boolean
  push_sent_at: string | null
  created_at: string
}

export interface TenantNotificationConfig {
  id: string
  tenant_id: string
  event_type: NotificationEventType
  notify_owner: boolean
  notify_admin: boolean
  notify_manager: boolean
  notify_technician: boolean
  notify_receptionist: boolean
  push_enabled: boolean
  in_app_enabled: boolean
  line_enabled: boolean
  is_enabled: boolean
  created_at: string
  updated_at: string
}

// =============================================================================
// Helper Types
// =============================================================================

export type NotificationChannel = 'push' | 'in_app' | 'both'

export interface SendNotificationPayload {
  tenantId: string
  eventType: NotificationEventType
  title: string
  body: string
  url?: string
  icon?: string
  data?: Record<string, unknown>
  // ถ้าระบุ targetUserId จะส่งเฉพาะ user นั้น (เช่น job_assigned)
  targetUserId?: string
  // ถ้าระบุ targetRoles จะส่งเฉพาะ roles เหล่านี้ (override config)
  targetRoles?: UserRole[]
}

// Role keys ที่ใช้ใน tenant_notification_config
export const ROLE_CONFIG_KEYS: Record<UserRole, keyof TenantNotificationConfig> = {
  owner: 'notify_owner',
  admin: 'notify_admin',
  manager: 'notify_manager',
  technician: 'notify_technician',
  receptionist: 'notify_receptionist',
  viewer: 'notify_owner', // viewer ใช้ config เดียวกับ owner (ไม่มี column แยก)
}

// Default role assignments สำหรับแต่ละ event (ใช้ตอนสร้าง tenant ใหม่)
export const DEFAULT_ROLE_CONFIG: Record<NotificationEventType, UserRole[]> = {
  job_created: ['owner', 'admin', 'manager', 'receptionist'],
  job_status_changed: ['owner', 'admin', 'manager', 'technician', 'receptionist'],
  job_assigned: ['technician'],
  job_completed: ['owner', 'admin', 'manager', 'receptionist'],
  job_urgent: ['owner', 'admin', 'manager', 'technician', 'receptionist'],
  quotation_pending: ['owner', 'admin', 'manager'],
  quotation_approved: ['owner', 'admin', 'manager', 'receptionist'],
  quotation_rejected: ['owner', 'admin', 'manager', 'receptionist'],
  dvi_completed: ['owner', 'admin', 'manager', 'receptionist'],
  dvi_sent_customer: ['owner', 'admin', 'manager', 'receptionist'],
  payment_received: ['owner', 'admin', 'manager', 'receptionist'],
  payment_overdue: ['owner', 'admin', 'manager'],
  stock_low: ['owner', 'admin', 'manager'],
  stock_out: ['owner', 'admin', 'manager'],
  po_received: ['owner', 'admin', 'manager'],
  line_new_message: ['receptionist'],
  line_new_follower: ['owner', 'admin', 'manager', 'receptionist'],
  booking_new: ['owner', 'admin', 'manager', 'receptionist'],
  booking_reminder: ['receptionist'],
  service_reminder: ['owner', 'admin', 'manager', 'receptionist'],
  warranty_expiring: ['owner', 'admin', 'manager'],
  employee_clock_in: ['owner', 'admin', 'manager'],
  employee_clock_out: ['owner', 'admin', 'manager'],
  daily_summary: ['owner', 'admin', 'manager'],
  insurance_claim_update: ['owner', 'admin', 'manager'],
  additional_work_request: ['owner', 'admin', 'manager', 'technician', 'receptionist'],
  review_received: ['owner', 'admin', 'manager'],
}
