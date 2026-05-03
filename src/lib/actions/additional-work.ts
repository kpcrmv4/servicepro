'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { getUserInfo } from '@/lib/actions/auth-helpers';
import { sendLineMessage } from '@/lib/actions/line';

export interface AdditionalWorkInput {
  jobId: string;
  description: string;
  estimatedCost: number;
  photoUrl?: string;
}

/**
 * A technician/manager creates an additional-work request when they
 * discover something extra during the job. The customer is notified
 * (via LINE if linked) and approves/declines through a public link
 * — see /c/track/[token] which surfaces approval buttons.
 */
export async function createAdditionalWorkRequest(input: AdditionalWorkInput) {
  if (!input.description?.trim()) return { error: 'กรุณากรอกรายละเอียด' };
  if (!input.jobId) return { error: 'jobId required' };
  if (input.estimatedCost < 0) return { error: 'ราคาประมาณต้องเป็นจำนวนบวก' };

  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return { error: 'ไม่มีสิทธิ์' };

  // Verify job belongs to this tenant
  const { data: job } = await supabase
    .from('jobs')
    .select('id, customer_id, vehicle_id, job_number, tenant_id')
    .eq('id', input.jobId)
    .eq('tenant_id', userInfo.tenant_id)
    .single();
  if (!job) return { error: 'ไม่พบงานซ่อม' };

  const { data: req, error } = await supabase
    .from('additional_work_requests')
    .insert({
      tenant_id: userInfo.tenant_id,
      job_id: input.jobId,
      description: input.description.trim(),
      estimated_cost: input.estimatedCost,
      photo_url: input.photoUrl || null,
      status: 'pending',
      created_by: userInfo.id,
    })
    .select()
    .single();
  if (error || !req) return { error: error?.message || 'ไม่สามารถสร้างคำขอได้' };

  // Best-effort: notify customer via LINE if linked
  try {
    if (job.customer_id) {
      const { data: follower } = await supabase
        .from('line_followers')
        .select('line_user_id')
        .eq('tenant_id', userInfo.tenant_id)
        .eq('customer_id', job.customer_id)
        .eq('is_following', true)
        .maybeSingle();
      if (follower?.line_user_id) {
        await sendLineMessage({
          line_user_id: follower.line_user_id as string,
          message_type: 'custom',
          content: {
            message:
              `🔧 ช่างพบปัญหาเพิ่มเติม\n\n` +
              `งาน: ${job.job_number}\n` +
              `รายการ: ${input.description}\n` +
              `ราคาประมาณ: ฿${input.estimatedCost.toLocaleString()}\n\n` +
              `กรุณาอนุมัติ/ปฏิเสธในหน้าติดตามงาน`,
          },
          reference_type: 'additional_work',
          reference_id: req.id as string,
        });
        await supabase
          .from('additional_work_requests')
          .update({ customer_notified_at: new Date().toISOString() })
          .eq('id', req.id);
      }
    }
  } catch (e) {
    console.error('[additional-work] LINE notify failed', e);
  }

  // Job timeline entry
  await supabase.from('job_timeline').insert({
    job_id: input.jobId,
    status: null,
    note: `ช่างพบปัญหาเพิ่มเติม: ${input.description} (ประมาณ ฿${input.estimatedCost.toLocaleString()}) — รอลูกค้าอนุมัติ`,
    created_by: userInfo.id,
  });

  revalidatePath(`/dashboard/jobs/${input.jobId}`);
  return { success: true, request: req };
}

export async function listAdditionalWorkForJob(jobId: string) {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return [];
  const { data } = await supabase
    .from('additional_work_requests')
    .select('*')
    .eq('tenant_id', userInfo.tenant_id)
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function listAdditionalWorkByJobToken(jobNumber: string) {
  // Public read by job_number — the existing tracking convention.
  // Uses service client to bypass RLS, but we strictly filter by the
  // job's job_number first.
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data: job } = await supabase
    .from('jobs')
    .select('id, tenant_id')
    .eq('job_number', jobNumber)
    .maybeSingle();
  if (!job) return [];
  const { data } = await supabase
    .from('additional_work_requests')
    .select('id, description, estimated_cost, photo_url, status, customer_notified_at, customer_responded_at, created_at')
    .eq('tenant_id', job.tenant_id)
    .eq('job_id', job.id)
    .order('created_at', { ascending: false });
  return data || [];
}

/**
 * Public action — customer responds via tracking link (no login).
 * Updates the additional-work request, and on approve appends a
 * job_item to the parent job for billing.
 */
export async function respondAdditionalWork(input: {
  trackingToken: string;     // job_number used as token in /c/track/[token]
  requestId: string;
  decision: 'approved' | 'rejected';
}) {
  if (!['approved', 'rejected'].includes(input.decision)) return { error: 'invalid decision' };
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data: job } = await supabase
    .from('jobs')
    .select('id, tenant_id')
    .eq('job_number', input.trackingToken)
    .maybeSingle();
  if (!job) return { error: 'invalid token' };

  const { data: req } = await supabase
    .from('additional_work_requests')
    .select('*')
    .eq('id', input.requestId)
    .eq('job_id', job.id)
    .eq('tenant_id', job.tenant_id)
    .maybeSingle();
  if (!req) return { error: 'ไม่พบรายการ' };
  if (req.status !== 'pending') return { error: 'รายการนี้ตอบกลับไปแล้ว' };

  const now = new Date().toISOString();
  await supabase
    .from('additional_work_requests')
    .update({ status: input.decision, customer_responded_at: now })
    .eq('id', input.requestId);

  if (input.decision === 'approved') {
    await supabase.from('job_items').insert({
      job_id: job.id,
      tenant_id: job.tenant_id,
      type: 'labor',
      description: req.description,
      quantity: 1,
      unit_price: Number(req.estimated_cost) || 0,
      total: Number(req.estimated_cost) || 0,
    });
  }

  await supabase.from('job_timeline').insert({
    job_id: job.id,
    status: null,
    note:
      input.decision === 'approved'
        ? `ลูกค้าอนุมัติงานเพิ่ม: ${req.description}`
        : `ลูกค้าปฏิเสธงานเพิ่ม: ${req.description}`,
  });

  revalidatePath(`/c/track/${input.trackingToken}`);
  return { success: true };
}
