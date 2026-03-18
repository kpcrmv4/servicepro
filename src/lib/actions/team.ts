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

export async function inviteTeamMember(formData: FormData) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }
  if (!['owner', 'admin'].includes(userInfo.role)) return { error: 'ไม่มีสิทธิ์ เฉพาะเจ้าของหรือแอดมินเท่านั้น' }

  const email = formData.get('email') as string
  const full_name = formData.get('full_name') as string
  const role = formData.get('role') as string
  const phone = formData.get('phone') as string

  if (!email || !full_name || !role) {
    return { error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ' }
  }

  const validRoles = ['owner', 'admin', 'manager', 'technician', 'receptionist', 'viewer']
  if (!validRoles.includes(role)) {
    return { error: 'ตำแหน่งไม่ถูกต้อง' }
  }

  // Check if email already exists in this tenant
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .eq('tenant_id', userInfo.tenant_id)
    .single()

  if (existing) {
    return { error: 'อีเมลนี้มีอยู่ในระบบแล้ว' }
  }

  // Create the auth user via signUp with a temporary password
  const tempPassword = `Temp${Date.now()}!`
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: tempPassword,
    options: {
      data: {
        full_name,
        tenant_id: userInfo.tenant_id,
        role,
      },
    },
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      // User exists in auth but not in this tenant - try to add them
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          email,
          full_name,
          role,
          phone: phone || null,
          tenant_id: userInfo.tenant_id,
          is_active: true,
        })
      if (insertError) return { error: insertError.message }
    } else {
      return { error: authError.message }
    }
  }

  // If auth user was created, also ensure user row exists
  if (authData?.user) {
    const { error: upsertError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        email,
        full_name,
        role,
        phone: phone || null,
        tenant_id: userInfo.tenant_id,
        is_active: true,
      }, { onConflict: 'id' })

    if (upsertError) return { error: upsertError.message }
  }

  revalidatePath('/dashboard/team')
  return { success: true }
}

export async function updateTeamMember(userId: string, formData: FormData) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }
  if (!['owner', 'admin'].includes(userInfo.role)) return { error: 'ไม่มีสิทธิ์ เฉพาะเจ้าของหรือแอดมินเท่านั้น' }

  const full_name = formData.get('full_name') as string
  const role = formData.get('role') as string
  const phone = formData.get('phone') as string
  const is_active = formData.get('is_active') === 'true'

  if (!full_name || !role) {
    return { error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ' }
  }

  // Prevent demoting yourself if you're the only owner
  if (userId === userInfo.id && role !== 'owner' && userInfo.role === 'owner') {
    const { data: owners } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', userInfo.tenant_id)
      .eq('role', 'owner')
      .eq('is_active', true)

    if (owners && owners.length <= 1) {
      return { error: 'ไม่สามารถเปลี่ยนตำแหน่งเจ้าของคนสุดท้ายได้' }
    }
  }

  const { error } = await supabase
    .from('users')
    .update({
      full_name,
      phone: phone || null,
      role,
      is_active,
    })
    .eq('id', userId)
    .eq('tenant_id', userInfo.tenant_id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/team')
  return { success: true }
}

export async function deactivateTeamMember(userId: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }
  if (!['owner', 'admin'].includes(userInfo.role)) return { error: 'ไม่มีสิทธิ์ เฉพาะเจ้าของหรือแอดมินเท่านั้น' }

  // Prevent deactivating yourself
  if (userId === userInfo.id) {
    return { error: 'ไม่สามารถปิดการใช้งานตัวเองได้' }
  }

  const { error } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('id', userId)
    .eq('tenant_id', userInfo.tenant_id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/team')
  return { success: true }
}
