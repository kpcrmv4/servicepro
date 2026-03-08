'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getTenantId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  return profile?.tenant_id || null
}

export async function getCustomers(search?: string) {
  const supabase = await createClient()
  const tenantId = await getTenantId()
  if (!tenantId) return []

  let query = supabase
    .from('customers')
    .select('*, vehicles(id, license_plate, brand, model)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data } = await query
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
