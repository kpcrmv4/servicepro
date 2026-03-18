'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getTenantId } from '@/lib/actions/auth-helpers'

export async function getCustomers(search?: string) {
  const supabase = await createClient()
  const tenantId = await getTenantId()
  if (!tenantId) return []

  if (search) {
    // Search by license plate in vehicles table to get matching customer IDs
    const { data: vehicleMatches } = await supabase
      .from('vehicles')
      .select('customer_id')
      .eq('tenant_id', tenantId)
      .ilike('license_plate', `%${search}%`)

    const customerIdsFromVehicles = (vehicleMatches || [])
      .map((v) => v.customer_id)
      .filter((id): id is string => !!id)

    let query = supabase
      .from('customers')
      .select('*, vehicles(id, license_plate, brand, model)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (customerIdsFromVehicles.length > 0) {
      // Search by name/phone/email OR by customer IDs matched from vehicle license plates
      query = query.or(
        `name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,id.in.(${customerIdsFromVehicles.join(',')})`
      )
    } else {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data } = await query
    return data || []
  }

  const { data } = await supabase
    .from('customers')
    .select('*, vehicles(id, license_plate, brand, model)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  return data || []
}

export async function getCustomer(id: string) {
  const supabase = await createClient()
  const tenantId = await getTenantId()
  if (!tenantId) return null

  const { data } = await supabase
    .from('customers')
    .select('*, vehicles(*)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  return data
}

export async function createCustomer(formData: FormData) {
  const supabase = await createClient()
  const tenantId = await getTenantId()
  if (!tenantId) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase.from('customers').insert({
    tenant_id: tenantId,
    type: (formData.get('type') as string) || 'individual',
    name: formData.get('name') as string,
    phone: formData.get('phone') as string,
    email: formData.get('email') as string,
    line_id: formData.get('line_id') as string,
    address: formData.get('address') as string,
    tax_id: formData.get('tax_id') as string,
    notes: formData.get('notes') as string,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/customers')
  return { success: true }
}

export async function updateCustomer(id: string, formData: FormData) {
  const supabase = await createClient()
  const tenantId = await getTenantId()
  if (!tenantId) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase
    .from('customers')
    .update({
      type: (formData.get('type') as string) || 'individual',
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      line_id: formData.get('line_id') as string,
      address: formData.get('address') as string,
      tax_id: formData.get('tax_id') as string,
      notes: formData.get('notes') as string,
    })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/customers')
  return { success: true }
}

export async function getCustomerJobs(customerId: string) {
  const supabase = await createClient()
  const tenantId = await getTenantId()
  if (!tenantId) return []

  const { data } = await supabase
    .from('jobs')
    .select('*, vehicles(license_plate, brand, model), assigned_user:users!jobs_assigned_to_fkey(full_name)')
    .eq('customer_id', customerId)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  return data || []
}

export async function getCustomerInvoices(customerId: string) {
  const supabase = await createClient()
  const tenantId = await getTenantId()
  if (!tenantId) return []

  const { data } = await supabase
    .from('invoices')
    .select('*, jobs(job_number)')
    .eq('customer_id', customerId)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  return data || []
}

export async function deleteCustomer(id: string) {
  const supabase = await createClient()
  const tenantId = await getTenantId()
  if (!tenantId) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/customers')
  return { success: true }
}
