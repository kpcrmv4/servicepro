'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getTenantId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
  return profile?.tenant_id || null
}

export async function getVehicles(search?: string) {
  const supabase = await createClient()
  const tenantId = await getTenantId()
  if (!tenantId) return []

  let query = supabase
    .from('vehicles')
    .select('*, customers(name, phone)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`license_plate.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`)
  }

  const { data } = await query
  return data || []
}

export async function getVehicle(id: string) {
  const supabase = await createClient()
  const tenantId = await getTenantId()
  if (!tenantId) return null

  const { data } = await supabase
    .from('vehicles')
    .select('*, customers(name, phone, email)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  return data
}

export async function createVehicle(formData: FormData) {
  const supabase = await createClient()
  const tenantId = await getTenantId()
  if (!tenantId) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase.from('vehicles').insert({
    tenant_id: tenantId,
    customer_id: formData.get('customer_id') as string,
    license_plate: formData.get('license_plate') as string,
    brand: formData.get('brand') as string,
    model: formData.get('model') as string,
    year: Number(formData.get('year')) || null,
    color: formData.get('color') as string || null,
    vin: formData.get('vin') as string || null,
    engine_number: formData.get('engine_number') as string || null,
    current_mileage: Number(formData.get('current_mileage')) || null,
    insurance_company: formData.get('insurance_company') as string || null,
    insurance_expiry: formData.get('insurance_expiry') as string || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/customers')
  return { success: true }
}

export async function updateVehicle(id: string, formData: FormData) {
  const supabase = await createClient()
  const tenantId = await getTenantId()
  if (!tenantId) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase
    .from('vehicles')
    .update({
      license_plate: formData.get('license_plate') as string,
      brand: formData.get('brand') as string,
      model: formData.get('model') as string,
      year: Number(formData.get('year')) || null,
      color: formData.get('color') as string || null,
      vin: formData.get('vin') as string || null,
      engine_number: formData.get('engine_number') as string || null,
      current_mileage: Number(formData.get('current_mileage')) || null,
      insurance_company: formData.get('insurance_company') as string || null,
      insurance_expiry: formData.get('insurance_expiry') as string || null,
    })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/customers')
  return { success: true }
}

export async function deleteVehicle(id: string) {
  const supabase = await createClient()
  const tenantId = await getTenantId()
  if (!tenantId) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase.from('vehicles').delete().eq('id', id).eq('tenant_id', tenantId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/customers')
  return { success: true }
}
