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

export async function getParts(search?: string) {
  const supabase = await createClient()
  const tenantId = await getTenantId()
  if (!tenantId) return []

  let query = supabase
    .from('parts')
    .select('*, part_categories(name)')
    .eq('tenant_id', tenantId)
    .order('name')

  if (search) {
    query = query.or(`name.ilike.%${search}%,part_number.ilike.%${search}%,brand.ilike.%${search}%`)
  }

  const { data } = await query
  return data || []
}

export async function getPartCategories() {
  const supabase = await createClient()
  const tenantId = await getTenantId()
  if (!tenantId) return []

  const { data } = await supabase
    .from('part_categories')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name')

  return data || []
}

export async function createPart(formData: FormData) {
  const supabase = await createClient()
  const tenantId = await getTenantId()
  if (!tenantId) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase.from('parts').insert({
    tenant_id: tenantId,
    part_number: formData.get('part_number') as string,
    sku: formData.get('sku') as string || null,
    name: formData.get('name') as string,
    brand: formData.get('brand') as string || null,
    category_id: formData.get('category_id') as string || null,
    unit: formData.get('unit') as string || 'piece',
    cost_price: Number(formData.get('cost_price')) || 0,
    selling_price: Number(formData.get('selling_price')) || 0,
    stock_quantity: Number(formData.get('stock_quantity')) || 0,
    min_stock: Number(formData.get('min_stock')) || 0,
    reorder_point: Number(formData.get('reorder_point')) || 0,
    location: formData.get('location') as string || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/parts')
  return { success: true }
}

export async function updatePart(id: string, formData: FormData) {
  const supabase = await createClient()
  const tenantId = await getTenantId()
  if (!tenantId) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase
    .from('parts')
    .update({
      part_number: formData.get('part_number') as string,
      sku: formData.get('sku') as string || null,
      name: formData.get('name') as string,
      brand: formData.get('brand') as string || null,
      category_id: formData.get('category_id') as string || null,
      unit: formData.get('unit') as string || 'piece',
      cost_price: Number(formData.get('cost_price')) || 0,
      selling_price: Number(formData.get('selling_price')) || 0,
      stock_quantity: Number(formData.get('stock_quantity')) || 0,
      min_stock: Number(formData.get('min_stock')) || 0,
      reorder_point: Number(formData.get('reorder_point')) || 0,
      location: formData.get('location') as string || null,
    })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/parts')
  return { success: true }
}

export async function deletePart(id: string) {
  const supabase = await createClient()
  const tenantId = await getTenantId()
  if (!tenantId) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase.from('parts').delete().eq('id', id).eq('tenant_id', tenantId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/parts')
  return { success: true }
}

export async function getSuppliers() {
  const supabase = await createClient()
  const tenantId = await getTenantId()
  if (!tenantId) return []

  const { data } = await supabase
    .from('suppliers')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('name')

  return data || []
}
