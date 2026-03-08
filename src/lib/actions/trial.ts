"use server"

import { createClient } from "@/lib/supabase/server"

// Get all trial registrations
export async function getTrialRegistrations(filters?: {
  status?: string
  search?: string
}) {
  const supabase = await createClient()
  let query = supabase
    .from("trial_registrations")
    .select("*")
    .order("created_at", { ascending: false })

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status)
  }
  if (filters?.search) {
    query = query.or(
      `shop_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// Get trial statistics for super admin dashboard
export async function getTrialStats() {
  const supabase = await createClient()

  const [
    { count: totalTrials },
    { count: activeTrials },
    { count: convertedTrials },
    { count: expiredTrials },
  ] = await Promise.all([
    supabase.from("trial_registrations").select("*", { count: "exact", head: true }),
    supabase.from("trial_registrations").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("trial_registrations").select("*", { count: "exact", head: true }).eq("status", "converted"),
    supabase.from("trial_registrations").select("*", { count: "exact", head: true }).eq("status", "expired"),
  ])

  return {
    total: totalTrials || 0,
    active: activeTrials || 0,
    converted: convertedTrials || 0,
    expired: expiredTrials || 0,
    conversionRate: totalTrials ? Math.round(((convertedTrials || 0) / totalTrials) * 100) : 0,
  }
}

// Activate a tenant subscription (convert trial to paid)
export async function activateSubscription(tenantId: string, plan: string) {
  const supabase = await createClient()

  const { error: tenantError } = await supabase
    .from("tenants")
    .update({
      subscription_status: "active",
      subscription_plan: plan,
      trial_ends_at: null,
    })
    .eq("id", tenantId)

  if (tenantError) throw tenantError

  // Update trial registration status
  await supabase
    .from("trial_registrations")
    .update({ status: "converted", converted_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)

  // Record subscription history
  await supabase.from("subscription_history").insert({
    tenant_id: tenantId,
    action: "activated",
    plan,
    details: { activated_by: "super_admin" },
  })

  return { success: true }
}

// Extend trial period
export async function extendTrial(tenantId: string, days: number) {
  const supabase = await createClient()

  // Get current trial end date
  const { data: tenant } = await supabase
    .from("tenants")
    .select("trial_ends_at")
    .eq("id", tenantId)
    .single()

  const currentEnd = tenant?.trial_ends_at ? new Date(tenant.trial_ends_at) : new Date()
  const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000)

  const { error } = await supabase
    .from("tenants")
    .update({
      trial_ends_at: newEnd.toISOString(),
      subscription_status: "trial",
    })
    .eq("id", tenantId)

  if (error) throw error

  // Record history
  await supabase.from("subscription_history").insert({
    tenant_id: tenantId,
    action: "trial_extended",
    details: { extended_days: days, new_end_date: newEnd.toISOString() },
  })

  return { success: true, newEndDate: newEnd.toISOString() }
}

// Suspend a tenant
export async function suspendTenant(tenantId: string, reason?: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("tenants")
    .update({ subscription_status: "suspended" })
    .eq("id", tenantId)

  if (error) throw error

  await supabase.from("subscription_history").insert({
    tenant_id: tenantId,
    action: "suspended",
    details: { reason: reason || "Suspended by super admin" },
  })

  return { success: true }
}

// Reactivate a suspended tenant
export async function reactivateTenant(tenantId: string, plan: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("tenants")
    .update({
      subscription_status: "active",
      subscription_plan: plan,
    })
    .eq("id", tenantId)

  if (error) throw error

  await supabase.from("subscription_history").insert({
    tenant_id: tenantId,
    action: "reactivated",
    plan,
    details: { reactivated_by: "super_admin" },
  })

  return { success: true }
}

// Get subscription history for a tenant
export async function getSubscriptionHistory(tenantId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("subscription_history")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

// Get expiring trials (within next N days)
export async function getExpiringTrials(withinDays: number = 3) {
  const supabase = await createClient()
  const futureDate = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, slug, phone, subscription_plan, trial_ends_at, created_at")
    .eq("subscription_status", "trial")
    .lte("trial_ends_at", futureDate)
    .order("trial_ends_at", { ascending: true })

  if (error) throw error
  return data || []
}
