'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserInfo } from '@/lib/actions/auth-helpers';
import {
  type CustomerNotifyEvent,
  parseCustomerNotifyConfig,
  renderTemplate,
} from '@/lib/notifications/customer-line';

interface JobNotifyContext {
  holdReason?: string | null;
  holdUntil?: string | null;
}

interface JobLite {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  job_number: string;
  status: string;
  hold_reason: string | null;
  hold_until: string | null;
  customer: { id: string; name: string | null } | null;
  vehicle: { license_plate: string | null; brand: string | null; model: string | null } | null;
}

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
  waiting_pickup: 'พร้อมให้รับรถ',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
};

async function loadJobLite(jobId: string): Promise<JobLite | null> {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return null;
  const { data } = await supabase
    .from('jobs')
    .select(
      `
      id, tenant_id, customer_id, job_number, status, hold_reason, hold_until,
      customer:customers(id, name),
      vehicle:vehicles(license_plate, brand, model)
    `,
    )
    .eq('id', jobId)
    .eq('tenant_id', userInfo.tenant_id)
    .maybeSingle();
  if (!data) return null;
  const customerRaw = data.customer as unknown;
  const vehicleRaw = data.vehicle as unknown;
  const customer = (Array.isArray(customerRaw) ? customerRaw[0] : customerRaw) as
    | { id: string; name: string | null }
    | null;
  const vehicle = (Array.isArray(vehicleRaw) ? vehicleRaw[0] : vehicleRaw) as
    | { license_plate: string | null; brand: string | null; model: string | null }
    | null;
  return { ...data, customer, vehicle } as JobLite;
}

function buildVars(job: JobLite, ctx?: JobNotifyContext): Record<string, string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const v = job.vehicle;
  const vehicleStr = v ? `${v.brand ?? ''} ${v.model ?? ''}`.trim() : '';
  return {
    job_number: job.job_number ?? '',
    customer_name: job.customer?.name ?? '',
    vehicle: vehicleStr || '-',
    plate: v?.license_plate ?? '-',
    status_label: STATUS_LABELS[job.status] ?? job.status,
    hold_reason: ctx?.holdReason ?? job.hold_reason ?? '',
    eta: ctx?.holdUntil
      ? new Date(ctx.holdUntil).toLocaleDateString('th-TH')
      : job.hold_until
        ? new Date(job.hold_until).toLocaleDateString('th-TH')
        : '',
    tracking_url: baseUrl ? `${baseUrl}/c/track/${job.job_number}` : `/c/track/${job.job_number}`,
  };
}

/**
 * Returns what would happen if we tried to notify the customer for this
 * event right now: enabled? auto? rendered preview? whether the channel
 * is even available (LINE configured + customer linked).
 */
export async function getCustomerNotifyPreview(
  jobId: string,
  event: CustomerNotifyEvent,
  ctx?: JobNotifyContext,
) {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) {
    return { enabled: false, auto: false, preview: null, canSend: false, reason: 'unauthorized' as const };
  }

  const job = await loadJobLite(jobId);
  if (!job) {
    return { enabled: false, auto: false, preview: null, canSend: false, reason: 'job_not_found' as const };
  }

  // Read tenant config
  const { data: tenant } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', userInfo.tenant_id)
    .single();
  const cfg = parseCustomerNotifyConfig(
    (tenant?.settings as Record<string, unknown>)?.customer_line_notifications,
  );

  if (cfg.default_mode === 'off') {
    return { enabled: false, auto: false, preview: null, canSend: false, reason: 'globally_off' as const };
  }
  const eventCfg = cfg.events[event];
  if (!eventCfg || !eventCfg.enabled) {
    return { enabled: false, auto: false, preview: null, canSend: false, reason: 'event_disabled' as const };
  }

  // Check whether the channel can actually deliver the message
  let canSend = false;
  let reason: 'no_customer' | 'no_line_config' | 'no_follower' | undefined;
  if (!job.customer_id) {
    reason = 'no_customer';
  } else {
    const { data: lineCfg } = await supabase
      .from('line_oa_configs')
      .select('channel_access_token, is_active')
      .eq('tenant_id', userInfo.tenant_id)
      .maybeSingle();
    if (!lineCfg?.is_active || !lineCfg.channel_access_token) {
      reason = 'no_line_config';
    } else {
      const { data: follower } = await supabase
        .from('line_followers')
        .select('line_user_id')
        .eq('tenant_id', userInfo.tenant_id)
        .eq('customer_id', job.customer_id)
        .eq('is_following', true)
        .maybeSingle();
      if (!follower?.line_user_id) reason = 'no_follower';
      else canSend = true;
    }
  }

  // Decide auto vs ask: per-event auto wins, otherwise default_mode='auto'
  const auto = eventCfg.auto || cfg.default_mode === 'auto';
  const preview = renderTemplate(eventCfg.template, buildVars(job, ctx));

  return {
    enabled: true as const,
    auto,
    preview,
    canSend,
    reason,
  };
}

/**
 * Actually push a LINE message to the customer. Use either a manually
 * edited message (from the confirmation modal) or the rendered template.
 */
export async function sendCustomerLineForEvent(
  jobId: string,
  event: CustomerNotifyEvent,
  options?: { messageOverride?: string; ctx?: JobNotifyContext },
): Promise<{ ok: boolean; reason?: string }> {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return { ok: false, reason: 'unauthorized' };

  const job = await loadJobLite(jobId);
  if (!job?.customer_id) return { ok: false, reason: 'no_customer' };

  const { data: lineCfg } = await supabase
    .from('line_oa_configs')
    .select('channel_access_token, is_active')
    .eq('tenant_id', userInfo.tenant_id)
    .maybeSingle();
  if (!lineCfg?.is_active || !lineCfg.channel_access_token) {
    return { ok: false, reason: 'no_line_config' };
  }

  const { data: follower } = await supabase
    .from('line_followers')
    .select('line_user_id')
    .eq('tenant_id', userInfo.tenant_id)
    .eq('customer_id', job.customer_id)
    .eq('is_following', true)
    .maybeSingle();
  if (!follower?.line_user_id) return { ok: false, reason: 'no_follower' };

  // Resolve final text
  let text = options?.messageOverride;
  if (!text) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', userInfo.tenant_id)
      .single();
    const cfg = parseCustomerNotifyConfig(
      (tenant?.settings as Record<string, unknown>)?.customer_line_notifications,
    );
    const eventCfg = cfg.events[event];
    if (!eventCfg?.enabled) return { ok: false, reason: 'event_disabled' };
    text = renderTemplate(eventCfg.template, buildVars(job, options?.ctx));
  }
  if (!text?.trim()) return { ok: false, reason: 'empty_message' };

  // Log to line_messages first so we have an audit trail even on failure
  const { data: log } = await supabase
    .from('line_messages')
    .insert({
      tenant_id: userInfo.tenant_id,
      line_user_id: follower.line_user_id,
      direction: 'outgoing',
      message_type: 'job_status',
      content: { event, text },
      reference_type: 'job',
      reference_id: job.id,
      status: 'pending',
    })
    .select()
    .single();

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lineCfg.channel_access_token}`,
      },
      body: JSON.stringify({
        to: follower.line_user_id,
        messages: [{ type: 'text', text }],
      }),
    });
    if (res.ok) {
      if (log) {
        await supabase
          .from('line_messages')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', log.id);
      }
      return { ok: true };
    }
    const errBody = await res.text();
    if (log) {
      await supabase
        .from('line_messages')
        .update({ status: 'failed', error_message: errBody })
        .eq('id', log.id);
    }
    return { ok: false, reason: 'line_error' };
  } catch (e) {
    if (log) {
      await supabase
        .from('line_messages')
        .update({ status: 'failed', error_message: String(e) })
        .eq('id', log.id);
    }
    return { ok: false, reason: 'fetch_error' };
  }
}
