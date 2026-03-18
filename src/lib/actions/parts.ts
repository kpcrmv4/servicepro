'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserInfo, generateSequenceNumber } from '@/lib/actions/auth-helpers'

const REVALIDATE_PATH = '/dashboard/inventory'

// =============================================================================
// Parts CRUD
// =============================================================================

export async function getParts(search?: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  let query = supabase
    .from('parts')
    .select('*, part_categories(name)')
    .eq('tenant_id', userInfo.tenant_id)
    .eq('is_active', true)
    .order('name')

  if (search) {
    query = query.or(`name.ilike.%${search}%,part_number.ilike.%${search}%,brand.ilike.%${search}%,barcode.ilike.%${search}%`)
  }

  const { data } = await query
  return data || []
}

export async function getPartById(id: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return null

  const { data } = await supabase
    .from('parts')
    .select('*, part_categories(name)')
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id)
    .single()

  return data
}

export async function createPart(formData: FormData) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase.from('parts').insert({
    tenant_id: userInfo.tenant_id,
    part_number: formData.get('part_number') as string,
    sku: formData.get('sku') as string || null,
    name: formData.get('name') as string,
    brand: formData.get('brand') as string || null,
    category_id: formData.get('category_id') as string || null,
    description: formData.get('description') as string || null,
    unit: formData.get('unit') as string || 'piece',
    cost_price: Number(formData.get('cost_price')) || 0,
    selling_price: Number(formData.get('selling_price')) || 0,
    stock_quantity: 0,
    min_stock: Number(formData.get('min_stock')) || 0,
    max_stock: Number(formData.get('max_stock')) || null,
    reorder_point: Number(formData.get('reorder_point')) || 0,
    location: formData.get('location') as string || null,
    barcode: formData.get('barcode') as string || null,
    image_url: formData.get('image_url') as string || null,
  })

  if (error) return { error: error.message }
  revalidatePath(REVALIDATE_PATH)
  return { success: true }
}

export async function updatePart(id: string, formData: FormData) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase
    .from('parts')
    .update({
      part_number: formData.get('part_number') as string,
      sku: formData.get('sku') as string || null,
      name: formData.get('name') as string,
      brand: formData.get('brand') as string || null,
      category_id: formData.get('category_id') as string || null,
      description: formData.get('description') as string || null,
      unit: formData.get('unit') as string || 'piece',
      selling_price: Number(formData.get('selling_price')) || 0,
      min_stock: Number(formData.get('min_stock')) || 0,
      max_stock: Number(formData.get('max_stock')) || null,
      reorder_point: Number(formData.get('reorder_point')) || 0,
      location: formData.get('location') as string || null,
      barcode: formData.get('barcode') as string || null,
      image_url: formData.get('image_url') as string || null,
    })
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id)

  if (error) return { error: error.message }
  revalidatePath(REVALIDATE_PATH)
  return { success: true }
}

export async function deletePart(id: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase
    .from('parts')
    .update({ is_active: false })
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id)

  if (error) return { error: error.message }
  revalidatePath(REVALIDATE_PATH)
  return { success: true }
}

// =============================================================================
// Part Categories
// =============================================================================

export async function getPartCategories() {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  const { data } = await supabase
    .from('part_categories')
    .select('*')
    .eq('tenant_id', userInfo.tenant_id)
    .order('name')

  return data || []
}

export async function createPartCategory(name: string, parentId?: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase.from('part_categories').insert({
    tenant_id: userInfo.tenant_id,
    name,
    parent_id: parentId || null,
  })

  if (error) return { error: error.message }
  revalidatePath(REVALIDATE_PATH)
  return { success: true }
}

export async function updatePartCategory(id: string, name: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase
    .from('part_categories')
    .update({ name })
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id)

  if (error) return { error: error.message }
  revalidatePath(REVALIDATE_PATH)
  return { success: true }
}

export async function deletePartCategory(id: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase
    .from('part_categories')
    .delete()
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id)

  if (error) return { error: error.message }
  revalidatePath(REVALIDATE_PATH)
  return { success: true }
}

// =============================================================================
// Suppliers
// =============================================================================

export async function getSuppliers() {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  const { data } = await supabase
    .from('suppliers')
    .select('*')
    .eq('tenant_id', userInfo.tenant_id)
    .eq('is_active', true)
    .order('name')

  return data || []
}

export async function createSupplier(formData: FormData) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase.from('suppliers').insert({
    tenant_id: userInfo.tenant_id,
    name: formData.get('name') as string,
    contact_person: formData.get('contact_person') as string || null,
    phone: formData.get('phone') as string || null,
    email: formData.get('email') as string || null,
    address: formData.get('address') as string || null,
    tax_id: formData.get('tax_id') as string || null,
    payment_terms: formData.get('payment_terms') as string || null,
  })

  if (error) return { error: error.message }
  revalidatePath(REVALIDATE_PATH)
  return { success: true }
}

// =============================================================================
// Purchase Orders
// =============================================================================

export async function getPurchaseOrders() {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  const { data } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      suppliers(name),
      created_by_user:users!purchase_orders_created_by_fkey(full_name)
    `)
    .eq('tenant_id', userInfo.tenant_id)
    .order('created_at', { ascending: false })

  return data || []
}

export async function createPurchaseOrder(formData: FormData) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const poNumber = await generateSequenceNumber(supabase, 'purchase_orders', 'PO', userInfo.tenant_id)

  const items = JSON.parse(formData.get('items') as string || '[]')
  const subtotal = items.reduce((sum: number, item: Record<string, unknown>) =>
    sum + (Number(item.quantity) || 0) * (Number(item.cost_per_unit) || 0), 0)
  const vat = Number(formData.get('vat')) || 0
  const total = subtotal + vat

  const { error } = await supabase.from('purchase_orders').insert({
    tenant_id: userInfo.tenant_id,
    po_number: poNumber,
    supplier_id: formData.get('supplier_id') as string,
    status: 'draft',
    items,
    subtotal,
    vat,
    total,
    expected_delivery: formData.get('expected_delivery') as string || null,
    notes: formData.get('notes') as string || null,
    created_by: userInfo.id,
  })

  if (error) return { error: error.message }
  revalidatePath(REVALIDATE_PATH)
  return { success: true }
}

export async function updatePurchaseOrderStatus(id: string, status: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase
    .from('purchase_orders')
    .update({ status })
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id)

  if (error) return { error: error.message }
  revalidatePath(REVALIDATE_PATH)
  return { success: true }
}

// =============================================================================
// Receive PO - Import parts from purchase order
// =============================================================================

export interface ReceiveItem {
  part_id: string
  part_name: string
  ordered_quantity: number
  received_quantity: number
  cost_per_unit: number
  expiry_date?: string | null
}

export async function receivePurchaseOrder(poId: string, receivedItems: ReceiveItem[]) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  // Fetch PO
  const { data: po } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('id', poId)
    .eq('tenant_id', userInfo.tenant_id)
    .single()

  if (!po) return { error: 'ไม่พบใบสั่งซื้อ' }

  for (const item of receivedItems) {
    if (item.received_quantity <= 0) continue

    // Create stock batch for tracking cost and expiry
    await supabase.from('stock_batches').insert({
      tenant_id: userInfo.tenant_id,
      part_id: item.part_id,
      po_id: poId,
      quantity_received: item.received_quantity,
      quantity_remaining: item.received_quantity,
      cost_per_unit: item.cost_per_unit,
      expiry_date: item.expiry_date || null,
      batch_reference: po.po_number,
    })

    // Create stock movement (in)
    await supabase.from('stock_movements').insert({
      tenant_id: userInfo.tenant_id,
      part_id: item.part_id,
      po_id: poId,
      type: 'in',
      quantity: item.received_quantity,
      reference: po.po_number,
      notes: `นำเข้าจากใบสั่งซื้อ ${po.po_number}`,
      created_by: userInfo.id,
    })

    // Update part stock_quantity and recalculate weighted average cost
    const { data: part } = await supabase
      .from('parts')
      .select('stock_quantity, cost_price')
      .eq('id', item.part_id)
      .single()

    if (part) {
      const oldQty = Number(part.stock_quantity) || 0
      const oldCost = Number(part.cost_price) || 0
      const newQty = oldQty + item.received_quantity
      const avgCost = newQty > 0
        ? ((oldQty * oldCost) + (item.received_quantity * item.cost_per_unit)) / newQty
        : item.cost_per_unit

      await supabase
        .from('parts')
        .update({
          stock_quantity: newQty,
          cost_price: Math.round(avgCost * 100) / 100,
        })
        .eq('id', item.part_id)
    }
  }

  // Check if all items fully received
  const allReceived = receivedItems.every((item) => item.received_quantity >= item.ordered_quantity)
  await supabase
    .from('purchase_orders')
    .update({ status: allReceived ? 'received' : 'partial' })
    .eq('id', poId)

  revalidatePath(REVALIDATE_PATH)
  return { success: true }
}

// =============================================================================
// Stock Withdrawal (linked to Job) with FEFO
// =============================================================================

export async function getPartBatches(partId: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  const { data } = await supabase
    .from('stock_batches')
    .select('*')
    .eq('part_id', partId)
    .eq('tenant_id', userInfo.tenant_id)
    .gt('quantity_remaining', 0)
    .order('expiry_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  return data || []
}

export async function withdrawPart(params: {
  partId: string
  jobId: string
  quantity: number
  notes?: string
}) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const { data: part } = await supabase
    .from('parts')
    .select('stock_quantity, name')
    .eq('id', params.partId)
    .eq('tenant_id', userInfo.tenant_id)
    .single()

  if (!part) return { error: 'ไม่พบอะไหล่' }
  if (Number(part.stock_quantity) < params.quantity) {
    return { error: `สต็อกไม่เพียงพอ (มี ${part.stock_quantity} ชิ้น)` }
  }

  // FEFO: deduct from batches with earliest expiry first
  let remainingToWithdraw = params.quantity

  const { data: batches } = await supabase
    .from('stock_batches')
    .select('*')
    .eq('part_id', params.partId)
    .eq('tenant_id', userInfo.tenant_id)
    .gt('quantity_remaining', 0)
    .order('expiry_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  if (batches) {
    for (const batch of batches) {
      if (remainingToWithdraw <= 0) break

      const deductQty = Math.min(remainingToWithdraw, Number(batch.quantity_remaining))
      await supabase
        .from('stock_batches')
        .update({ quantity_remaining: Number(batch.quantity_remaining) - deductQty })
        .eq('id', batch.id)

      remainingToWithdraw -= deductQty
    }
  }

  // Create stock movement (out)
  await supabase.from('stock_movements').insert({
    tenant_id: userInfo.tenant_id,
    part_id: params.partId,
    job_id: params.jobId,
    type: 'out',
    quantity: params.quantity,
    reference: params.jobId,
    notes: params.notes || `เบิกอะไหล่สำหรับงานซ่อม`,
    created_by: userInfo.id,
  })

  // Update part stock_quantity
  await supabase
    .from('parts')
    .update({ stock_quantity: Number(part.stock_quantity) - params.quantity })
    .eq('id', params.partId)

  revalidatePath(REVALIDATE_PATH)
  return { success: true }
}

// =============================================================================
// Stock Movement History
// =============================================================================

export async function getStockMovements(filters?: { partId?: string; jobId?: string; type?: string }) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  let query = supabase
    .from('stock_movements')
    .select(`
      *,
      parts(name, part_number),
      jobs(job_number),
      purchase_orders(po_number),
      created_by_user:users!stock_movements_created_by_fkey(full_name)
    `)
    .eq('tenant_id', userInfo.tenant_id)
    .order('created_at', { ascending: false })
    .limit(200)

  if (filters?.partId) query = query.eq('part_id', filters.partId)
  if (filters?.jobId) query = query.eq('job_id', filters.jobId)
  if (filters?.type) query = query.eq('type', filters.type)

  const { data } = await query
  return data || []
}

export async function getJobWithdrawals(jobId: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  const { data } = await supabase
    .from('stock_movements')
    .select(`
      *,
      parts(name, part_number, unit),
      created_by_user:users!stock_movements_created_by_fkey(full_name)
    `)
    .eq('tenant_id', userInfo.tenant_id)
    .eq('job_id', jobId)
    .eq('type', 'out')
    .order('created_at', { ascending: false })

  return data || []
}

// =============================================================================
// POS Sales
// =============================================================================

export async function createPosSale(formData: FormData) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const saleNumber = await generateSequenceNumber(supabase, 'pos_sales', 'SALE', userInfo.tenant_id)

  const items = JSON.parse(formData.get('items') as string || '[]') as Array<{
    part_id: string
    name: string
    quantity: number
    unit_price: number
    total: number
  }>

  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0)
  const discount = Number(formData.get('discount')) || 0
  const vat = Number(formData.get('vat')) || 0
  const total = subtotal - discount + vat

  // Deduct stock for each item using FEFO
  for (const item of items) {
    const result = await withdrawPartForSale(
      userInfo.tenant_id,
      userInfo.id,
      item.part_id,
      item.quantity,
      saleNumber,
    )
    if (result?.error) return { error: `${item.name}: ${result.error}` }
  }

  const { error } = await supabase.from('pos_sales').insert({
    tenant_id: userInfo.tenant_id,
    sale_number: saleNumber,
    items,
    subtotal,
    discount,
    vat,
    total,
    payment_method: (formData.get('payment_method') as string) || 'cash',
    customer_id: formData.get('customer_id') as string || null,
    notes: formData.get('notes') as string || null,
    created_by: userInfo.id,
  })

  if (error) return { error: error.message }
  revalidatePath(REVALIDATE_PATH)
  return { success: true, saleNumber }
}

async function withdrawPartForSale(
  tenantId: string,
  userId: string,
  partId: string,
  quantity: number,
  reference: string,
) {
  const supabase = await createClient()

  const { data: part } = await supabase
    .from('parts')
    .select('stock_quantity')
    .eq('id', partId)
    .single()

  if (!part || Number(part.stock_quantity) < quantity) {
    return { error: 'สต็อกไม่เพียงพอ' }
  }

  // FEFO deduction
  let remaining = quantity
  const { data: batches } = await supabase
    .from('stock_batches')
    .select('*')
    .eq('part_id', partId)
    .eq('tenant_id', tenantId)
    .gt('quantity_remaining', 0)
    .order('expiry_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  if (batches) {
    for (const batch of batches) {
      if (remaining <= 0) break
      const deductQty = Math.min(remaining, Number(batch.quantity_remaining))
      await supabase
        .from('stock_batches')
        .update({ quantity_remaining: Number(batch.quantity_remaining) - deductQty })
        .eq('id', batch.id)
      remaining -= deductQty
    }
  }

  await supabase.from('stock_movements').insert({
    tenant_id: tenantId,
    part_id: partId,
    type: 'out',
    quantity,
    reference,
    notes: `ขายหน้าร้าน ${reference}`,
    created_by: userId,
  })

  await supabase
    .from('parts')
    .update({ stock_quantity: Number(part.stock_quantity) - quantity })
    .eq('id', partId)

  return { success: true }
}

export async function getPosSales() {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  const { data } = await supabase
    .from('pos_sales')
    .select(`
      *,
      customers(name),
      created_by_user:users!pos_sales_created_by_fkey(full_name)
    `)
    .eq('tenant_id', userInfo.tenant_id)
    .order('created_at', { ascending: false })
    .limit(100)

  return data || []
}

// =============================================================================
// Average Cost Calculation
// =============================================================================

export async function getPartAverageCost(partId: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return null

  const { data: batches } = await supabase
    .from('stock_batches')
    .select('quantity_remaining, cost_per_unit')
    .eq('part_id', partId)
    .eq('tenant_id', userInfo.tenant_id)
    .gt('quantity_remaining', 0)

  if (!batches || batches.length === 0) return null

  const totalQty = batches.reduce((sum, b) => sum + Number(b.quantity_remaining), 0)
  const totalCost = batches.reduce((sum, b) => sum + (Number(b.quantity_remaining) * Number(b.cost_per_unit)), 0)

  return {
    averageCost: totalQty > 0 ? Math.round((totalCost / totalQty) * 100) / 100 : 0,
    totalQuantity: totalQty,
    batchCount: batches.length,
  }
}

// =============================================================================
// Expiring Parts (FEFO recommendation)
// =============================================================================

export async function getExpiringBatches(daysAhead: number = 90) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)

  const { data } = await supabase
    .from('stock_batches')
    .select(`
      *,
      parts(name, part_number, unit)
    `)
    .eq('tenant_id', userInfo.tenant_id)
    .gt('quantity_remaining', 0)
    .not('expiry_date', 'is', null)
    .lte('expiry_date', futureDate.toISOString().split('T')[0])
    .order('expiry_date', { ascending: true })

  return data || []
}

// =============================================================================
// Jobs list (for part withdrawal)
// =============================================================================

export async function getActiveJobs() {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  const { data } = await supabase
    .from('jobs')
    .select('id, job_number, description, customers(name), vehicles(license_plate)')
    .eq('tenant_id', userInfo.tenant_id)
    .in('status', ['pending', 'diagnosing', 'quoted', 'in_progress', 'quality_check'])
    .order('created_at', { ascending: false })

  return data || []
}
