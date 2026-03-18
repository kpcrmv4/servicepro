'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserInfo, generateSequenceNumber } from '@/lib/actions/auth-helpers'

// =============================================================================
// Warranty Policies
// =============================================================================

export async function getWarrantyPolicies() {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  const { data } = await supabase
    .from('warranty_policies')
    .select('*')
    .eq('tenant_id', userInfo.tenant_id)
    .order('created_at', { ascending: false })

  return data || []
}

export async function createWarrantyPolicy(formData: FormData) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase
    .from('warranty_policies')
    .insert({
      tenant_id: userInfo.tenant_id,
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      duration_months: Number(formData.get('duration_months')),
      coverage_type: formData.get('coverage_type') as string,
      terms: formData.get('terms') as string || null,
      is_active: true,
    })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/warranty')
  return { success: true }
}

export async function updateWarrantyPolicy(id: string, formData: FormData) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase
    .from('warranty_policies')
    .update({
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      duration_months: Number(formData.get('duration_months')),
      coverage_type: formData.get('coverage_type') as string,
      terms: formData.get('terms') as string || null,
      is_active: formData.get('is_active') === 'true',
    })
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/warranty')
  return { success: true }
}

export async function deleteWarrantyPolicy(id: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase
    .from('warranty_policies')
    .delete()
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/warranty')
  return { success: true }
}

// =============================================================================
// Warranty Records
// =============================================================================

export async function getWarrantyRecords(filters?: { status?: string; search?: string }) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  let query = supabase
    .from('warranty_records')
    .select(`
      *,
      jobs(id, job_number, description, customers(id, name, phone), vehicles(id, license_plate, brand, model)),
      parts(id, name, part_number),
      warranty_policies(id, name, duration_months, coverage_type)
    `)
    .eq('tenant_id', userInfo.tenant_id)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters?.search) {
    query = query.or(`jobs.job_number.ilike.%${filters.search}%`)
  }

  const { data } = await query
  return data || []
}

export async function createWarrantyRecord(data: {
  job_id: string
  part_id?: string | null
  warranty_policy_id: string
  start_date: string
  end_date: string
  coverage_details?: string | null
}) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase
    .from('warranty_records')
    .insert({
      tenant_id: userInfo.tenant_id,
      job_id: data.job_id,
      part_id: data.part_id || null,
      warranty_policy_id: data.warranty_policy_id,
      start_date: data.start_date,
      end_date: data.end_date,
      status: 'active',
    })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/warranty')
  return { success: true }
}

// =============================================================================
// Warranty Claims
// =============================================================================

export async function getWarrantyClaims(filters?: { status?: string; search?: string }) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  let query = supabase
    .from('warranty_claims')
    .select(`
      *,
      warranty_records(
        id, start_date, end_date, status,
        jobs(id, job_number, customers(id, name), vehicles(id, license_plate, brand, model)),
        warranty_policies(id, name, coverage_type)
      ),
      jobs(id, job_number),
      created_by_user:users!warranty_claims_created_by_fkey(id, full_name)
    `)
    .eq('tenant_id', userInfo.tenant_id)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  const { data } = await query
  return data || []
}

export async function createWarrantyClaim(formData: FormData) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  // Generate claim number: WC-YYYY-XXXX
  const claimNumber = await generateSequenceNumber(
    supabase,
    'warranty_claims',
    'WC',
    userInfo.tenant_id
  )

  const warrantyRecordId = formData.get('warranty_record_id') as string
  const jobId = formData.get('job_id') as string
  const description = formData.get('description') as string

  const { error } = await supabase
    .from('warranty_claims')
    .insert({
      tenant_id: userInfo.tenant_id,
      warranty_record_id: warrantyRecordId,
      job_id: jobId,
      description,
      status: 'pending',
      resolution: null,
      resolved_at: null,
      created_by: userInfo.id,
    })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/warranty')
  return { success: true, claimNumber }
}

export async function updateClaimStatus(id: string, status: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const updateData: Record<string, unknown> = { status }

  // If completed or rejected, set resolved_at
  if (status === 'completed' || status === 'rejected') {
    updateData.resolved_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('warranty_claims')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/warranty')
  return { success: true }
}
