'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getUserInfo() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('users').select('id, tenant_id, role').eq('id', user.id).single()
  return profile
}

export async function getTeamMembers() {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('tenant_id', userInfo.tenant_id)
    .order('created_at')

  return data || []
}

export async function updateTeamMember(userId: string, formData: FormData) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }
  if (!['owner', 'admin'].includes(userInfo.role)) return { error: 'ไม่มีสิทธิ์' }

  const { error } = await supabase
    .from('users')
    .update({
      full_name: formData.get('full_name') as string,
      phone: formData.get('phone') as string,
      role: formData.get('role') as string,
      is_active: formData.get('is_active') === 'true',
    })
    .eq('id', userId)
    .eq('tenant_id', userInfo.tenant_id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function getShopSettings() {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return null

  const { data } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', userInfo.tenant_id)
    .single()

  return data
}

export async function updateShopSettings(formData: FormData) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }
  if (!['owner', 'admin'].includes(userInfo.role)) return { error: 'ไม่มีสิทธิ์' }

  const { error } = await supabase
    .from('tenants')
    .update({
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      phone: formData.get('phone') as string,
      tax_id: formData.get('tax_id') as string || null,
    })
    .eq('id', userInfo.tenant_id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/settings')
  return { success: true }
}
