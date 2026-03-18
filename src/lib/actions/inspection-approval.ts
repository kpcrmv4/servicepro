'use server'

import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createSupabaseAdmin(supabaseUrl, supabaseServiceKey)
}

export async function approveInspectionItems(
  shareToken: string,
  approvedItemIds: string[],
  customerNotes?: string
): Promise<{ success?: boolean; jobNumber?: string; error?: string }> {
  try {
    const supabase = getAdminClient()

    // 1. Fetch inspection by share_token
    const { data: inspection, error: inspError } = await supabase
      .from('vehicle_inspections')
      .select(`
        *,
        vehicle:vehicles(id, license_plate, brand, model, customer_id, customer:customers(id, name, phone)),
        inspector:users!vehicle_inspections_inspected_by_fkey(id, full_name),
        items:inspection_items(*)
      `)
      .eq('share_token', shareToken)
      .single()

    if (inspError || !inspection) {
      return { error: 'ไม่พบรายงานตรวจสภาพ หรือลิงก์ไม่ถูกต้อง' }
    }

    // 2. Verify status
    if (!['completed', 'sent'].includes(inspection.status)) {
      return { error: 'รายงานนี้ยังไม่พร้อมให้อนุมัติ' }
    }

    // 3. Verify not already approved
    if (inspection.created_job_id) {
      return { error: 'รายงานนี้ได้รับการอนุมัติแล้ว' }
    }

    // 4. Get vehicle + customer info
    const vehicle = inspection.vehicle as Record<string, unknown> | null
    if (!vehicle) {
      return { error: 'ไม่พบข้อมูลรถ' }
    }

    const customer = vehicle.customer as Record<string, unknown> | null
    const vehicleId = vehicle.id as string
    const customerId = customer?.id as string | undefined
    const tenantId = inspection.tenant_id as string
    const inspectedBy = inspection.inspected_by as string

    // Get items with condition fair or poor
    const allItems = (inspection.items as Record<string, unknown>[]) || []
    const actionableItems = allItems.filter(
      (i) => i.condition === 'fair' || i.condition === 'poor'
    )

    if (approvedItemIds.length === 0) {
      return { error: 'กรุณาเลือกอย่างน้อย 1 รายการ' }
    }

    const approvedItems = actionableItems.filter((i) =>
      approvedItemIds.includes(i.id as string)
    )
    const declinedItems = actionableItems.filter(
      (i) => !approvedItemIds.includes(i.id as string)
    )

    if (approvedItems.length === 0) {
      return { error: 'ไม่พบรายการที่เลือก' }
    }

    // 5. Update approved items: set customer_approved=true, customer_approved_at=now()
    const now = new Date().toISOString()
    for (const item of approvedItems) {
      await supabase
        .from('inspection_items')
        .update({ customer_approved: true, customer_approved_at: now })
        .eq('id', item.id as string)
    }

    // 6. Update non-approved fair/poor items: customer_approved=false
    for (const item of declinedItems) {
      await supabase
        .from('inspection_items')
        .update({ customer_approved: false })
        .eq('id', item.id as string)
    }

    // 7. Create new job - generate job number via count
    const { count: jobCount } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    const year = new Date().getFullYear()
    const seq = String((jobCount || 0) + 1).padStart(4, '0')
    const jobNumber = `JOB-${year}-${seq}`

    const approvedCount = approvedItems.length
    const description = `งานซ่อมจากรายงานตรวจสภาพ #${inspection.inspection_number || inspection.id} - ${approvedCount} รายการ`

    const { data: newJob, error: jobError } = await supabase
      .from('jobs')
      .insert({
        tenant_id: tenantId,
        vehicle_id: vehicleId,
        customer_id: customerId || null,
        job_number: jobNumber,
        type: 'repair',
        status: 'pending',
        description,
        created_by: inspectedBy,
      })
      .select()
      .single()

    if (jobError || !newJob) {
      console.error('Job creation error:', jobError)
      return { error: 'ไม่สามารถสร้างงานซ่อมได้ กรุณาลองใหม่' }
    }

    const jobId = newJob.id as string

    // 8. Create job_items for each approved item
    const jobItems = approvedItems.map((item) => ({
      job_id: jobId,
      tenant_id: tenantId,
      type: 'labor' as const,
      description: String(item.item_name || ''),
      quantity: 1,
      unit_price: Number(item.estimated_cost) || 0,
      total: Number(item.estimated_cost) || 0,
    }))

    if (jobItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('job_items')
        .insert(jobItems)

      if (itemsError) {
        console.error('Job items creation error:', itemsError)
      }
    }

    // 9. Insert declined items into declined_services
    if (declinedItems.length > 0) {
      const declinedRows = declinedItems.map((item) => ({
        tenant_id: tenantId,
        vehicle_id: vehicleId,
        customer_id: customerId || null,
        job_id: jobId,
        description: String(item.item_name || ''),
        estimated_cost: Number(item.estimated_cost) || 0,
        follow_up_date: null,
        status: 'pending',
      }))

      const { error: declinedError } = await supabase
        .from('declined_services')
        .insert(declinedRows)

      if (declinedError) {
        console.error('Declined services insert error:', declinedError)
      }
    }

    // 10. Update inspection: created_job_id, customer_approved_at, customer_approval_notes
    await supabase
      .from('vehicle_inspections')
      .update({
        created_job_id: jobId,
        customer_approved_at: now,
        customer_approval_notes: customerNotes || null,
      })
      .eq('id', inspection.id)

    // 11. Create job_timeline entry
    await supabase.from('job_timeline').insert({
      job_id: jobId,
      status: 'pending',
      note: `สร้างจากการอนุมัติรายงานตรวจสภาพโดยลูกค้า (${approvedCount} รายการอนุมัติ${declinedItems.length > 0 ? `, ${declinedItems.length} รายการปฏิเสธ` : ''})`,
      created_by: inspectedBy,
    })

    // 12. revalidatePath
    revalidatePath(`/inspect/${shareToken}`)
    revalidatePath('/jobs')
    revalidatePath('/inspections')

    // 13. Return success
    return { success: true, jobNumber }
  } catch (err) {
    console.error('approveInspectionItems error:', err)
    return { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' }
  }
}
