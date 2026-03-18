'use server'

import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
// Auth Helpers - ใช้แทน getUserInfo/getTenantId/getCurrentUser ที่ซ้ำใน 10+ ไฟล์
// =============================================================================

export interface UserInfo {
  id: string
  tenant_id: string
  role: string
}

export interface UserInfoFull extends UserInfo {
  full_name: string
}

/**
 * ดึงข้อมูล user ปัจจุบัน (id, tenant_id, role)
 * ใช้แทน getUserInfo() ที่ซ้ำใน jobs.ts, quotations.ts, finance.ts, parts.ts, reception.ts, quotation-line.ts
 */
export async function getUserInfo(): Promise<UserInfo | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('id, tenant_id, role')
    .eq('id', user.id)
    .single()

  return profile as UserInfo | null
}

/**
 * ดึง tenant_id ของ user ปัจจุบัน
 * ใช้แทน getTenantId() ที่ซ้ำใน customers.ts, vehicles.ts
 */
export async function getTenantId(): Promise<string | null> {
  const userInfo = await getUserInfo()
  return userInfo?.tenant_id || null
}

/**
 * ดึงข้อมูล user แบบเต็ม (id, tenant_id, role, full_name)
 * ใช้แทน getCurrentUser() ที่ซ้ำใน notifications.ts
 */
export async function getCurrentUser(): Promise<UserInfoFull | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('id, tenant_id, role, full_name')
    .eq('id', user.id)
    .single()

  return profile as UserInfoFull | null
}

// =============================================================================
// Sequence Number Generator - ใช้แทน logic สร้างเลขเอกสารที่ซ้ำ 7 ที่
// =============================================================================

/**
 * สร้างเลขเอกสาร format: PREFIX-YYYY-XXXX
 * เช่น JOB-2026-0001, QT-2026-0001, INV-2026-0001
 *
 * @param supabase - Supabase client instance
 * @param table - ชื่อตาราง เช่น 'jobs', 'quotations', 'invoices'
 * @param prefix - prefix เช่น 'JOB', 'QT', 'INV', 'REC', 'PO', 'SALE'
 * @param tenantId - tenant_id ของร้าน
 */
export async function generateSequenceNumber(
  supabase: SupabaseClient,
  table: string,
  prefix: string,
  tenantId: string
): Promise<string> {
  const { count } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  const year = new Date().getFullYear()
  const seq = String((count || 0) + 1).padStart(4, '0')
  return `${prefix}-${year}-${seq}`
}
