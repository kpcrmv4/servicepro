'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function verifySuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') return null
  return { supabase, userId: profile.id }
}

export async function getSuperAdminStats() {
  const ctx = await verifySuperAdmin()
  if (!ctx) return null

  const { supabase } = ctx

  const { count: tenantsCount } = await supabase
    .from('tenants')
    .select('id', { count: 'exact', head: true })

  const { count: usersCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })

  const { data: tenants } = await supabase
    .from('tenants')
    .select('plan, subscription_status')

  const activeTenants = tenants?.filter(t => t.subscription_status === 'active').length || 0
  const trialTenants = tenants?.filter(t => t.subscription_status === 'trial').length || 0

  const planBreakdown = {
    free: tenants?.filter(t => t.plan === 'free').length || 0,
    basic: tenants?.filter(t => t.plan === 'basic').length || 0,
    professional: tenants?.filter(t => t.plan === 'professional').length || 0,
    premium: tenants?.filter(t => t.plan === 'premium').length || 0,
  }

  return {
    tenantsCount: tenantsCount || 0,
    usersCount: usersCount || 0,
    activeTenants,
    trialTenants,
    planBreakdown,
  }
}

export async function getAllTenants(search?: string) {
  const ctx = await verifySuperAdmin()
  if (!ctx) return []

  const { supabase } = ctx

  let query = supabase
    .from('tenants')
    .select('*, users(id, full_name, email, role)')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`)
  }

  const { data } = await query
  return data || []
}

export async function getTenant(id: string) {
  const ctx = await verifySuperAdmin()
  if (!ctx) return null

  const { supabase } = ctx

  const { data } = await supabase
    .from('tenants')
    .select('*, users(id, full_name, email, role, is_active, created_at)')
    .eq('id', id)
    .single()

  return data
}

export async function updateTenant(id: string, formData: FormData) {
  const ctx = await verifySuperAdmin()
  if (!ctx) return { error: 'ไม่มีสิทธิ์' }

  const { supabase } = ctx

  const { error } = await supabase
    .from('tenants')
    .update({
      name: formData.get('name') as string,
      plan: formData.get('plan') as string,
      subscription_status: formData.get('subscription_status') as string,
      is_active: formData.get('is_active') === 'true',
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/super-admin')
  return { success: true }
}

export async function deleteTenant(id: string) {
  const ctx = await verifySuperAdmin()
  if (!ctx) return { error: 'ไม่มีสิทธิ์' }

  const { supabase } = ctx

  // Soft delete by deactivating
  const { error } = await supabase
    .from('tenants')
    .update({ is_active: false })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/super-admin')
  return { success: true }
}

export async function getAllUsers(search?: string) {
  const ctx = await verifySuperAdmin()
  if (!ctx) return []

  const { supabase } = ctx

  let query = supabase
    .from('users')
    .select('*, tenants(name, slug)')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data } = await query
  return data || []
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  const ctx = await verifySuperAdmin()
  if (!ctx) return { error: 'ไม่มีสิทธิ์' }

  const { supabase } = ctx

  const { error } = await supabase
    .from('users')
    .update({ is_active: isActive })
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/super-admin')
  return { success: true }
}

export async function getSystemAuditLogs(limit = 50) {
  const ctx = await verifySuperAdmin()
  if (!ctx) return []

  const { supabase } = ctx

  const { data } = await supabase
    .from('audit_logs')
    .select('*, users(full_name, email), tenants(name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  return data || []
}
