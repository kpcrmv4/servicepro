'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getUserInfo() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('id, tenant_id, role')
    .eq('id', user.id)
    .single()

  return profile
}

export async function getJobs(filters?: { status?: string; search?: string }) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  let query = supabase
    .from('jobs')
    .select(`
      *,
      customers(id, name, phone),
      vehicles(id, license_plate, brand, model, color),
      assigned_user:users!jobs_assigned_to_fkey(id, full_name),
      created_by_user:users!jobs_created_by_fkey(id, full_name)
    `)
    .eq('tenant_id', userInfo.tenant_id)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters?.search) {
    query = query.or(`job_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  const { data } = await query
  return data || []
}

export async function getJob(id: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return null

  const { data: job } = await supabase
    .from('jobs')
    .select(`
      *,
      customers(*, vehicles(*)),
      vehicles(*),
      assigned_user:users!jobs_assigned_to_fkey(id, full_name, phone),
      created_by_user:users!jobs_created_by_fkey(id, full_name),
      job_items(*),
      job_timeline(*, created_by_user:users!job_timeline_created_by_fkey(full_name))
    `)
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id)
    .single()

  return job
}

export async function createJob(formData: FormData) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  // Generate job number
  const { count } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', userInfo.tenant_id)

  const jobNumber = `JOB-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      tenant_id: userInfo.tenant_id,
      job_number: jobNumber,
      vehicle_id: formData.get('vehicle_id') as string,
      customer_id: formData.get('customer_id') as string,
      type: (formData.get('type') as string) || 'repair',
      status: 'pending',
      priority: (formData.get('priority') as string) || 'normal',
      description: formData.get('description') as string,
      assigned_to: formData.get('assigned_to') as string || null,
      bay_number: formData.get('bay_number') as string || null,
      notes: formData.get('notes') as string || null,
      created_by: userInfo.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Create initial timeline entry
  await supabase.from('job_timeline').insert({
    job_id: data.id,
    status: 'pending',
    notes: 'รับรถเข้าอู่',
    created_by: userInfo.id,
  })

  revalidatePath('/dashboard/jobs')
  revalidatePath('/dashboard')
  return { success: true, id: data.id }
}

export async function updateJobStatus(id: string, status: string, notes?: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const updateData: Record<string, unknown> = { status }
  if (status === 'completed') {
    updateData.actual_completion = new Date().toISOString()
  }

  const { error } = await supabase
    .from('jobs')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id)

  if (error) return { error: error.message }

  // Add timeline entry
  await supabase.from('job_timeline').insert({
    job_id: id,
    status: status as 'pending' | 'in_progress' | 'quality_check' | 'waiting_pickup' | 'completed' | 'cancelled',
    notes: notes || `เปลี่ยนสถานะเป็น ${status}`,
    created_by: userInfo.id,
  })

  revalidatePath('/dashboard/jobs')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateJob(id: string, formData: FormData) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase
    .from('jobs')
    .update({
      type: formData.get('type') as string,
      priority: formData.get('priority') as string,
      description: formData.get('description') as string,
      assigned_to: formData.get('assigned_to') as string || null,
      bay_number: formData.get('bay_number') as string || null,
      notes: formData.get('notes') as string || null,
      estimated_completion: formData.get('estimated_completion') as string || null,
    })
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/jobs')
  return { success: true }
}

export async function deleteJob(id: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/jobs')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getTechnicians() {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  const { data } = await supabase
    .from('users')
    .select('id, full_name, role')
    .eq('tenant_id', userInfo.tenant_id)
    .in('role', ['technician', 'manager', 'admin', 'owner'])
    .eq('is_active', true)

  return data || []
}
