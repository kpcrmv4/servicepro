'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserInfo } from '@/lib/actions/auth-helpers'

const REVALIDATE_PATH = '/dashboard/inspections'

// =============================================================================
// Inspection Templates CRUD
// =============================================================================

export async function getInspectionTemplates() {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  const { data, error } = await supabase
    .from('inspection_templates')
    .select('*')
    .eq('tenant_id', userInfo.tenant_id)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('name')

  if (error) throw error
  return data || []
}

export async function getInspectionTemplate(id: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return null

  const { data, error } = await supabase
    .from('inspection_templates')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id)
    .single()

  if (error) throw error
  return data
}

export async function createInspectionTemplate(formData: FormData) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const name = formData.get('name') as string
  if (!name) return { error: 'กรุณาระบุชื่อเทมเพลต' }

  const itemsStr = formData.get('items') as string
  let items: unknown[] = []
  try {
    items = itemsStr ? JSON.parse(itemsStr) : []
  } catch {
    return { error: 'ข้อมูลรายการตรวจไม่ถูกต้อง' }
  }

  const { error } = await supabase.from('inspection_templates').insert({
    tenant_id: userInfo.tenant_id,
    name,
    description: formData.get('description') as string || null,
    items,
    is_default: false,
    is_active: true,
    created_by: userInfo.id,
  })

  if (error) return { error: error.message }
  revalidatePath(REVALIDATE_PATH)
  return { success: true }
}

export async function updateInspectionTemplate(id: string, formData: FormData) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const name = formData.get('name') as string
  if (!name) return { error: 'กรุณาระบุชื่อเทมเพลต' }

  const itemsStr = formData.get('items') as string
  let items: unknown[] = []
  try {
    items = itemsStr ? JSON.parse(itemsStr) : []
  } catch {
    return { error: 'ข้อมูลรายการตรวจไม่ถูกต้อง' }
  }

  const { error } = await supabase
    .from('inspection_templates')
    .update({
      name,
      description: formData.get('description') as string || null,
      items,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id)

  if (error) return { error: error.message }
  revalidatePath(REVALIDATE_PATH)
  return { success: true }
}

export async function deleteInspectionTemplate(id: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase
    .from('inspection_templates')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id)

  if (error) return { error: error.message }
  revalidatePath(REVALIDATE_PATH)
  return { success: true }
}

export async function setDefaultTemplate(id: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  // Unset all other defaults for this tenant
  await supabase
    .from('inspection_templates')
    .update({ is_default: false, updated_at: new Date().toISOString() })
    .eq('tenant_id', userInfo.tenant_id)
    .eq('is_default', true)

  // Set the selected one as default
  const { error } = await supabase
    .from('inspection_templates')
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id)

  if (error) return { error: error.message }
  revalidatePath(REVALIDATE_PATH)
  return { success: true }
}

// =============================================================================
// Inspection Categories CRUD
// =============================================================================

export async function getInspectionCategories() {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  const { data, error } = await supabase
    .from('inspection_categories')
    .select('*')
    .eq('tenant_id', userInfo.tenant_id)
    .eq('is_active', true)
    .order('sort_order')

  if (error) throw error
  return data || []
}

export async function createInspectionCategory(formData: FormData) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const name = formData.get('name') as string
  if (!name) return { error: 'กรุณาระบุชื่อหมวดหมู่' }

  const { error } = await supabase.from('inspection_categories').insert({
    tenant_id: userInfo.tenant_id,
    name,
    icon: formData.get('icon') as string || null,
    sort_order: Number(formData.get('sort_order')) || 0,
    is_active: true,
  })

  if (error) return { error: error.message }
  revalidatePath(REVALIDATE_PATH)
  return { success: true }
}

export async function updateInspectionCategory(id: string, formData: FormData) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const name = formData.get('name') as string
  if (!name) return { error: 'กรุณาระบุชื่อหมวดหมู่' }

  const { error } = await supabase
    .from('inspection_categories')
    .update({
      name,
      icon: formData.get('icon') as string || null,
      sort_order: Number(formData.get('sort_order')) || 0,
    })
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id)

  if (error) return { error: error.message }
  revalidatePath(REVALIDATE_PATH)
  return { success: true }
}

export async function deleteInspectionCategory(id: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase
    .from('inspection_categories')
    .update({ is_active: false })
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id)

  if (error) return { error: error.message }
  revalidatePath(REVALIDATE_PATH)
  return { success: true }
}
