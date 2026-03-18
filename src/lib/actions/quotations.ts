'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserInfo, generateSequenceNumber } from '@/lib/actions/auth-helpers'

export interface QuotationItem {
  type: 'part' | 'labor' | 'other'
  description: string
  quantity: number
  unitPrice: number
  discount: number
}

export async function getQuotation(id: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return null

  const { data } = await supabase
    .from('quotations')
    .select('*, customers(name, phone), vehicles(license_plate, brand, model)')
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id)
    .single()

  return data
}

export async function getQuotationByJobId(jobId: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return null

  const { data } = await supabase
    .from('quotations')
    .select('*, customers(name, phone), vehicles(license_plate, brand, model)')
    .eq('job_id', jobId)
    .eq('tenant_id', userInfo.tenant_id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}

export async function createQuotation(jobId: string, items: QuotationItem[], notes?: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  // Get job details
  const { data: job } = await supabase
    .from('jobs')
    .select('id, customer_id, vehicle_id, tenant_id')
    .eq('id', jobId)
    .eq('tenant_id', userInfo.tenant_id)
    .single()

  if (!job) return { error: 'ไม่พบข้อมูล Job' }

  // Generate quotation number
  const quotationNumber = await generateSequenceNumber(supabase, 'quotations', 'QT', userInfo.tenant_id)

  // Calculate totals
  const itemsWithTotal = items.map((item) => ({
    ...item,
    total: (item.quantity * item.unitPrice) - item.discount,
  }))

  const subtotal = itemsWithTotal.reduce((sum, item) => sum + item.total, 0)
  const vat = Math.round(subtotal * 0.07 * 100) / 100
  const total = subtotal + vat

  // Create quotation
  const { data: quotation, error } = await supabase
    .from('quotations')
    .insert({
      tenant_id: userInfo.tenant_id,
      quotation_number: quotationNumber,
      job_id: jobId,
      customer_id: job.customer_id,
      vehicle_id: job.vehicle_id,
      status: 'draft',
      items: itemsWithTotal,
      subtotal,
      discount: 0,
      vat,
      total,
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
      notes: notes || null,
      created_by: userInfo.id,
    })
    .select('id')
    .single()

  if (error) return { error: `สร้างใบเสนอราคาไม่สำเร็จ: ${error.message}` }

  // Link quotation to job
  await supabase
    .from('jobs')
    .update({ quotation_id: quotation.id })
    .eq('id', jobId)

  revalidatePath(`/dashboard/jobs/${jobId}`)
  revalidatePath('/dashboard/quotations')
  revalidatePath('/dashboard/reception')

  return { success: true, id: quotation.id }
}

export async function updateQuotation(id: string, items: QuotationItem[], notes?: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const itemsWithTotal = items.map((item) => ({
    ...item,
    total: (item.quantity * item.unitPrice) - item.discount,
  }))

  const subtotal = itemsWithTotal.reduce((sum, item) => sum + item.total, 0)
  const vat = Math.round(subtotal * 0.07 * 100) / 100
  const total = subtotal + vat

  const { error } = await supabase
    .from('quotations')
    .update({
      items: itemsWithTotal,
      subtotal,
      vat,
      total,
      notes: notes || null,
    })
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/quotations')
  return { success: true }
}

export async function sendQuotationToCustomer(quotationId: string, jobId: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  // Update quotation status to sent
  const { error: quotationError } = await supabase
    .from('quotations')
    .update({ status: 'sent' })
    .eq('id', quotationId)
    .eq('tenant_id', userInfo.tenant_id)

  if (quotationError) return { error: quotationError.message }

  // Update job status to quoted
  const { error: jobError } = await supabase
    .from('jobs')
    .update({ status: 'quoted' })
    .eq('id', jobId)
    .eq('tenant_id', userInfo.tenant_id)

  if (jobError) return { error: jobError.message }

  // Add timeline entry
  await supabase.from('job_timeline').insert({
    job_id: jobId,
    status: 'quoted',
    notes: 'ส่งใบเสนอราคาให้ลูกค้า',
    created_by: userInfo.id,
  })

  revalidatePath(`/dashboard/jobs/${jobId}`)
  revalidatePath('/dashboard/reception')
  revalidatePath('/dashboard/quotations')

  return { success: true }
}

export async function approveQuotation(quotationId: string, jobId: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  // Get quotation totals to update job
  const { data: quotation } = await supabase
    .from('quotations')
    .select('total, subtotal, vat, items')
    .eq('id', quotationId)
    .single()

  if (!quotation) return { error: 'ไม่พบใบเสนอราคา' }

  // Calculate parts & labor from items
  const items = (quotation.items as QuotationItem[]) || []
  const totalPartsCost = items
    .filter((i) => i.type === 'part')
    .reduce((sum, i) => sum + ((i.quantity * i.unitPrice) - (i.discount || 0)), 0)
  const totalLaborCost = items
    .filter((i) => i.type === 'labor')
    .reduce((sum, i) => sum + ((i.quantity * i.unitPrice) - (i.discount || 0)), 0)

  // Update quotation status
  const { error: qtError } = await supabase
    .from('quotations')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: userInfo.id,
    })
    .eq('id', quotationId)
    .eq('tenant_id', userInfo.tenant_id)

  if (qtError) return { error: qtError.message }

  // Update job: status → in_progress, copy totals
  const { error: jobError } = await supabase
    .from('jobs')
    .update({
      status: 'in_progress',
      total_parts_cost: totalPartsCost,
      total_labor_cost: totalLaborCost,
      total_amount: quotation.subtotal,
      vat: quotation.vat,
      grand_total: quotation.total,
    })
    .eq('id', jobId)
    .eq('tenant_id', userInfo.tenant_id)

  if (jobError) return { error: jobError.message }

  // Add timeline entry
  await supabase.from('job_timeline').insert({
    job_id: jobId,
    status: 'in_progress',
    notes: `ลูกค้าอนุมัติใบเสนอราคา - เริ่มดำเนินการซ่อม`,
    created_by: userInfo.id,
  })

  revalidatePath(`/dashboard/jobs/${jobId}`)
  revalidatePath('/dashboard/reception')
  revalidatePath('/dashboard/jobs')
  revalidatePath('/dashboard/quotations')

  return { success: true }
}

export async function rejectQuotation(quotationId: string, jobId: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  // Update quotation
  const { error: qtError } = await supabase
    .from('quotations')
    .update({ status: 'rejected' })
    .eq('id', quotationId)
    .eq('tenant_id', userInfo.tenant_id)

  if (qtError) return { error: qtError.message }

  // Update job status to cancelled
  const { error: jobError } = await supabase
    .from('jobs')
    .update({ status: 'cancelled' })
    .eq('id', jobId)
    .eq('tenant_id', userInfo.tenant_id)

  if (jobError) return { error: jobError.message }

  // Add timeline entry
  await supabase.from('job_timeline').insert({
    job_id: jobId,
    status: 'cancelled',
    notes: 'ลูกค้าไม่อนุมัติใบเสนอราคา',
    created_by: userInfo.id,
  })

  revalidatePath(`/dashboard/jobs/${jobId}`)
  revalidatePath('/dashboard/reception')
  revalidatePath('/dashboard/quotations')

  return { success: true }
}
