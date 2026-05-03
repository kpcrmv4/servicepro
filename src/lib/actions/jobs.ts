'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserInfo, generateSequenceNumber } from '@/lib/actions/auth-helpers'
import type { SupabaseClient } from '@supabase/supabase-js'

// Best-effort send a LINE notification for a job status change. Uses
// the tenant's own LINE OA channel and the customer's linked LINE
// follower; silently no-ops if either is absent.
async function notifyJobStatusViaLine(
  supabase: SupabaseClient,
  jobId: string,
  options?: { holdReason?: string | null; holdUntil?: string | null },
) {
  try {
    const { data: job } = await supabase
      .from('jobs')
      .select('id, tenant_id, customer_id, job_number, status, hold_reason, hold_until, vehicle:vehicles(license_plate, brand, model)')
      .eq('id', jobId)
      .single()
    if (!job?.customer_id) return

    const { data: cfg } = await supabase
      .from('line_oa_configs')
      .select('channel_access_token, is_active')
      .eq('tenant_id', job.tenant_id)
      .maybeSingle()
    if (!cfg?.is_active || !cfg.channel_access_token) return

    const { data: follower } = await supabase
      .from('line_followers')
      .select('line_user_id')
      .eq('tenant_id', job.tenant_id)
      .eq('customer_id', job.customer_id)
      .eq('is_following', true)
      .maybeSingle()
    if (!follower?.line_user_id) return

    const STATUS_LABELS: Record<string, string> = {
      pending: 'รอดำเนินการ',
      diagnosing: 'กำลังตรวจสอบ',
      quoted: 'รออนุมัติใบเสนอราคา',
      ready_to_repair: 'เข้าคิวพร้อมซ่อม',
      in_progress: 'กำลังซ่อม',
      waiting_parts: 'พักงาน — รออะไหล่',
      waiting_insurance: 'พักงาน — รอประกัน',
      on_hold: 'พักงาน',
      quality_check: 'ตรวจ QC',
      waiting_pickup: 'รอลูกค้ารับรถ',
      completed: 'เสร็จสิ้น',
      cancelled: 'ยกเลิก',
    }

    const v = job.vehicle as { license_plate?: string; brand?: string; model?: string } | null
    const reason = options?.holdReason ?? (job.hold_reason as string | null)
    const until = options?.holdUntil ?? (job.hold_until as string | null)

    const lines = [
      `🔔 อัปเดตสถานะงาน ${job.job_number}`,
      `รถ: ${v?.brand ?? ''} ${v?.model ?? ''} (${v?.license_plate ?? '-'})`,
      `สถานะ: ${STATUS_LABELS[job.status as string] || job.status}`,
    ]
    if (reason) lines.push(`สาเหตุ: ${reason}`)
    if (until) lines.push(`คาดว่ากลับมาทำต่อ: ${new Date(until).toLocaleDateString('th-TH')}`)
    lines.push('', `ติดตามรายละเอียด: ${process.env.NEXT_PUBLIC_APP_URL || ''}/c/track/${job.job_number}`)

    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.channel_access_token}`,
      },
      body: JSON.stringify({
        to: follower.line_user_id,
        messages: [{ type: 'text', text: lines.join('\n') }],
      }),
    })
  } catch (e) {
    // Notification failures are non-fatal.
    console.error('[notifyJobStatusViaLine] failed', e)
  }
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
  const jobNumber = await generateSequenceNumber(supabase, 'jobs', 'JOB', userInfo.tenant_id)

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

  const statusNotesMap: Record<string, string> = {
    diagnosing: 'เริ่มตรวจสอบสภาพรถ',
    quoted: 'เสนอราคาลูกค้า',
    ready_to_repair: 'พร้อมเข้าคิวซ่อม',
    in_progress: 'เริ่มดำเนินการซ่อม',
    waiting_parts: 'พักงาน — รออะไหล่',
    waiting_insurance: 'พักงาน — รอประกันอนุมัติ',
    on_hold: 'พักงาน — รอข้อมูลเพิ่มเติม',
    quality_check: 'ส่งตรวจสอบคุณภาพ',
    waiting_pickup: 'ซ่อมเสร็จ - รอลูกค้ารับ',
    completed: 'ลูกค้ารับรถแล้ว - เสร็จสิ้น',
    cancelled: 'ยกเลิกงาน',
  }

  // Add timeline entry
  await supabase.from('job_timeline').insert({
    job_id: id,
    status,
    notes: notes || statusNotesMap[status] || `เปลี่ยนสถานะเป็น ${status}`,
    created_by: userInfo.id,
  })

  // Best-effort LINE notification (non-blocking)
  await notifyJobStatusViaLine(supabase, id)

  revalidatePath('/dashboard/jobs')
  revalidatePath('/dashboard')
  return { success: true }
}

// ============================================================
// Hold / resume actions
// ============================================================

const HOLD_STATUSES = ['waiting_parts', 'waiting_insurance', 'on_hold'] as const
type HoldStatus = (typeof HOLD_STATUSES)[number]

const HOLD_LABELS: Record<HoldStatus, string> = {
  waiting_parts: 'รออะไหล่',
  waiting_insurance: 'รอประกันอนุมัติ',
  on_hold: 'พักงาน',
}

/**
 * Pause a job and remember what status to come back to.
 * - reason: short customer-facing reason ("รออะไหล่ Brake Pad MK-101")
 * - until:  expected resume date (parts ETA, insurance approval target)
 *
 * Stores status_before_hold so resumeJob can restore the previous state
 * (e.g. in_progress) instead of guessing.
 */
export async function holdJob(input: {
  jobId: string
  status: HoldStatus
  reason: string
  until?: string  // 'YYYY-MM-DD'
}) {
  if (!HOLD_STATUSES.includes(input.status)) {
    return { error: 'invalid hold status' }
  }
  if (!input.reason?.trim()) return { error: 'กรุณากรอกเหตุผล' }

  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const { data: job } = await supabase
    .from('jobs')
    .select('id, status, tenant_id, status_before_hold')
    .eq('id', input.jobId)
    .eq('tenant_id', userInfo.tenant_id)
    .single()
  if (!job) return { error: 'ไม่พบงานซ่อม' }

  // Don't overwrite status_before_hold if we're already in a hold state.
  const statusBefore =
    HOLD_STATUSES.includes(job.status as HoldStatus)
      ? job.status_before_hold
      : job.status

  const { error } = await supabase
    .from('jobs')
    .update({
      status: input.status,
      hold_reason: input.reason.trim(),
      hold_until: input.until || null,
      status_before_hold: statusBefore,
    })
    .eq('id', input.jobId)
    .eq('tenant_id', userInfo.tenant_id)
  if (error) return { error: error.message }

  await supabase.from('job_timeline').insert({
    job_id: input.jobId,
    status: input.status,
    notes:
      `${HOLD_LABELS[input.status]} — ${input.reason.trim()}` +
      (input.until ? ` (คาดว่ากลับมาทำต่อ ${input.until})` : ''),
    created_by: userInfo.id,
  })

  await notifyJobStatusViaLine(supabase, input.jobId, {
    holdReason: input.reason.trim(),
    holdUntil: input.until,
  })

  revalidatePath(`/dashboard/jobs/${input.jobId}`)
  revalidatePath('/dashboard/queue')
  return { success: true }
}

/** Resume a held job back to its previous status (or in_progress as fallback). */
export async function resumeJob(jobId: string, note?: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const { data: job } = await supabase
    .from('jobs')
    .select('id, status, status_before_hold')
    .eq('id', jobId)
    .eq('tenant_id', userInfo.tenant_id)
    .single()
  if (!job) return { error: 'ไม่พบงานซ่อม' }

  const next = (job.status_before_hold as string) || 'in_progress'
  const { error } = await supabase
    .from('jobs')
    .update({
      status: next,
      hold_reason: null,
      hold_until: null,
      status_before_hold: null,
    })
    .eq('id', jobId)
    .eq('tenant_id', userInfo.tenant_id)
  if (error) return { error: error.message }

  await supabase.from('job_timeline').insert({
    job_id: jobId,
    status: next,
    notes: note || `กลับมาทำต่อ — สถานะ: ${next}`,
    created_by: userInfo.id,
  })

  await notifyJobStatusViaLine(supabase, jobId)

  revalidatePath(`/dashboard/jobs/${jobId}`)
  revalidatePath('/dashboard/queue')
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
