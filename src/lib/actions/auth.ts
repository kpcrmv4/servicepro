'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'กรุณากรอกอีเมลและรหัสผ่าน' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }
    }
    return { error: error.message }
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', data.user.id)
    .single()

  if (!profile) {
    return { error: 'ไม่พบข้อมูลผู้ใช้ในระบบ' }
  }

  if (!profile.tenant_id && profile.role !== 'super_admin') {
    return { error: 'บัญชีนี้ยังไม่ได้เชื่อมกับอู่ กรุณาติดต่อผู้ดูแลระบบ' }
  }

  revalidatePath('/', 'layout')

  if (profile.role === 'super_admin') {
    redirect('/super-admin')
  }

  redirect('/dashboard')
}

export async function register(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const shopName = formData.get('shop_name') as string
  const phone = formData.get('phone') as string

  if (!email || !password || !fullName || !shopName) {
    return { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }
  }

  if (password.length < 6) {
    return { error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }
  }

  // Create slug from shop name
  const slug = shopName
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙]+/g, '-')
    .replace(/^-|-$/g, '')
    || `shop-${Date.now()}`

  // First create the tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name: shopName,
      slug,
      phone,
      plan: 'free',
      subscription_status: 'trial',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single()

  if (tenantError) {
    if (tenantError.message.includes('duplicate')) {
      return { error: 'ชื่อร้านนี้ถูกใช้งานแล้ว กรุณาเปลี่ยนชื่อ' }
    }
    return { error: 'ไม่สามารถสร้างร้านได้: ' + tenantError.message }
  }

  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        tenant_id: tenant.id,
        role: 'owner',
      },
    },
  })

  if (authError) {
    // Rollback: delete tenant
    await supabase.from('tenants').delete().eq('id', tenant.id)
    if (authError.message.includes('already registered')) {
      return { error: 'อีเมลนี้ถูกใช้งานแล้ว' }
    }
    return { error: authError.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  if (!email) {
    return { error: 'กรุณากรอกอีเมล' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบอีเมล' }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function getCurrentUser() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*, tenants(*)')
    .eq('id', user.id)
    .single()

  return profile
}
