'use server'

import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
// FEFO Stock Deduction Helper
// ใช้แทน logic ตัดสต็อกที่ซ้ำใน withdrawPart() และ withdrawPartForSale()
// =============================================================================

/**
 * ตัดสต็อกแบบ FEFO (First Expiry, First Out) จาก stock_batches
 * แล้วสร้าง stock_movement record + อัปเดต part.stock_quantity
 *
 * @param supabase - Supabase client
 * @param params.tenantId - tenant_id
 * @param params.userId - user ที่ทำรายการ
 * @param params.partId - อะไหล่ที่จะตัดสต็อก
 * @param params.quantity - จำนวนที่ต้องการตัด
 * @param params.reference - reference เช่น jobId หรือ saleNumber
 * @param params.notes - หมายเหตุ
 * @param params.jobId - (optional) ถ้าเบิกสำหรับงานซ่อม
 */
export async function deductStockFEFO(
  supabase: SupabaseClient,
  params: {
    tenantId: string
    userId: string
    partId: string
    quantity: number
    reference: string
    notes: string
    jobId?: string
  }
): Promise<{ success?: boolean; error?: string }> {
  const { tenantId, userId, partId, quantity, reference, notes, jobId } = params

  // ตรวจสต็อก
  const { data: part } = await supabase
    .from('parts')
    .select('stock_quantity, name')
    .eq('id', partId)
    .single()

  if (!part) return { error: 'ไม่พบอะไหล่' }
  if (Number(part.stock_quantity) < quantity) {
    return { error: `สต็อกไม่เพียงพอ (มี ${part.stock_quantity} ชิ้น)` }
  }

  // FEFO: ตัดจาก batch ที่หมดอายุเร็วสุดก่อน
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

  // สร้าง stock movement (out)
  await supabase.from('stock_movements').insert({
    tenant_id: tenantId,
    part_id: partId,
    ...(jobId && { job_id: jobId }),
    type: 'out',
    quantity,
    reference,
    notes,
    created_by: userId,
  })

  // อัปเดต part stock_quantity
  await supabase
    .from('parts')
    .update({ stock_quantity: Number(part.stock_quantity) - quantity })
    .eq('id', partId)

  return { success: true }
}
