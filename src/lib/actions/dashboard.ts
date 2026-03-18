'use server'

import { createClient } from '@/lib/supabase/server'
import { getTenantId, getUserInfo } from '@/lib/actions/auth-helpers'

export async function getDashboardStats() {
  const supabase = await createClient()
  const tenantId = await getTenantId()
  if (!tenantId) return null

  // Get jobs stats
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, status, grand_total, created_at')
    .eq('tenant_id', tenantId)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const activeJobs = jobs?.filter(j => ['pending', 'in_progress', 'quality_check', 'waiting_pickup'].includes(j.status)) || []
  const completedToday = jobs?.filter(j => j.status === 'completed' && new Date(j.created_at) >= today) || []
  const monthlyRevenue = jobs?.filter(j => j.status === 'completed' && new Date(j.created_at) >= thisMonth)
    .reduce((sum, j) => sum + Number(j.grand_total), 0) || 0

  // Get customers count
  const { count: customersCount } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  // Get low stock parts
  const { data: lowStockParts } = await supabase
    .from('parts')
    .select('id, name, stock_quantity, min_stock')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)

  const lowStock = lowStockParts?.filter(p => Number(p.stock_quantity) <= Number(p.min_stock)) || []

  // Get pending invoices
  const { data: pendingInvoices } = await supabase
    .from('invoices')
    .select('id, total')
    .eq('tenant_id', tenantId)
    .in('payment_status', ['pending', 'partial'])

  const pendingAmount = pendingInvoices?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0

  return {
    activeJobs: activeJobs.length,
    completedToday: completedToday.length,
    totalJobs: jobs?.length || 0,
    monthlyRevenue,
    customersCount: customersCount || 0,
    lowStockCount: lowStock.length,
    pendingInvoicesCount: pendingInvoices?.length || 0,
    pendingAmount,
    jobsByStatus: {
      pending: jobs?.filter(j => j.status === 'pending').length || 0,
      in_progress: jobs?.filter(j => j.status === 'in_progress').length || 0,
      quality_check: jobs?.filter(j => j.status === 'quality_check').length || 0,
      waiting_pickup: jobs?.filter(j => j.status === 'waiting_pickup').length || 0,
      completed: jobs?.filter(j => j.status === 'completed').length || 0,
      cancelled: jobs?.filter(j => j.status === 'cancelled').length || 0,
    },
  }
}

export async function getRecentJobs(limit = 10) {
  const supabase = await createClient()
  const tenantId = await getTenantId()
  if (!tenantId) return []

  const { data: jobs } = await supabase
    .from('jobs')
    .select(`
      *,
      customers(name, phone),
      vehicles(license_plate, brand, model, color),
      assigned_user:users!jobs_assigned_to_fkey(full_name)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return jobs || []
}

export async function getTenantInfo() {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*, tenants(*)')
    .eq('id', userInfo.id)
    .single()

  return profile
}
