'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approveQuotationPublic(quotationId: string, jobId: string) {
  const supabase = await createServerClient()

  // Verify quotation exists and is in 'sent' status
  const { data: quotation } = await supabase
    .from('quotations')
    .select('id, status, total, subtotal, vat, items')
    .eq('id', quotationId)
    .single()

  if (!quotation) return { error: 'ไม่พบใบเสนอราคา' }
  if (quotation.status !== 'sent') return { error: 'ใบเสนอราคานี้ไม่สามารถอนุมัติได้' }

  // Calculate parts & labor from items
  const items = (quotation.items as { type: string; quantity: number; unitPrice: number; discount: number }[]) || []
  const totalPartsCost = items
    .filter((i) => i.type === 'part')
    .reduce((sum, i) => sum + ((i.quantity * i.unitPrice) - (i.discount || 0)), 0)
  const totalLaborCost = items
    .filter((i) => i.type === 'labor')
    .reduce((sum, i) => sum + ((i.quantity * i.unitPrice) - (i.discount || 0)), 0)

  // Update quotation
  const { error: qtError } = await supabase
    .from('quotations')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
    })
    .eq('id', quotationId)

  if (qtError) return { error: qtError.message }

  // Update job — go to ready_to_repair (queue) not in_progress yet
  const { error: jobError } = await supabase
    .from('jobs')
    .update({
      status: 'ready_to_repair',
      total_parts_cost: totalPartsCost,
      total_labor_cost: totalLaborCost,
      total_amount: quotation.subtotal,
      vat: quotation.vat,
      grand_total: quotation.total,
    })
    .eq('id', jobId)

  if (jobError) return { error: jobError.message }

  // Timeline entry
  await supabase.from('job_timeline').insert({
    job_id: jobId,
    status: 'ready_to_repair',
    notes: 'ลูกค้าอนุมัติใบเสนอราคาออนไลน์ — เข้าคิวพร้อมซ่อม',
  })

  revalidatePath(`/c/quotation/${quotationId}`)
  revalidatePath(`/dashboard/jobs/${jobId}`)
  revalidatePath('/dashboard/reception')
  revalidatePath('/dashboard/quotations')

  return { success: true }
}

export async function rejectQuotationPublic(quotationId: string, jobId: string) {
  const supabase = await createServerClient()

  const { data: quotation } = await supabase
    .from('quotations')
    .select('id, status')
    .eq('id', quotationId)
    .single()

  if (!quotation) return { error: 'ไม่พบใบเสนอราคา' }
  if (quotation.status !== 'sent') return { error: 'ใบเสนอราคานี้ไม่สามารถดำเนินการได้' }

  const { error: qtError } = await supabase
    .from('quotations')
    .update({ status: 'rejected' })
    .eq('id', quotationId)

  if (qtError) return { error: qtError.message }

  const { error: jobError } = await supabase
    .from('jobs')
    .update({ status: 'cancelled' })
    .eq('id', jobId)

  if (jobError) return { error: jobError.message }

  await supabase.from('job_timeline').insert({
    job_id: jobId,
    status: 'cancelled',
    notes: 'ลูกค้าไม่อนุมัติใบเสนอราคาออนไลน์',
  })

  revalidatePath(`/c/quotation/${quotationId}`)
  revalidatePath(`/dashboard/jobs/${jobId}`)
  revalidatePath('/dashboard/reception')
  revalidatePath('/dashboard/quotations')

  return { success: true }
}
