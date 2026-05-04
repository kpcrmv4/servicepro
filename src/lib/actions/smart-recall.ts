'use server';

import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUserInfo } from '@/lib/actions/auth-helpers';

/**
 * Smart Recall — predictive customer recall.
 *
 * Three rules generate `service_reminders` rows automatically:
 *
 *   1. DVI follow-up: any inspection_item with condition='fair' on a
 *      job that finished 90+ days ago, where the parent inspection
 *      hasn't been turned into a job since.
 *   2. Mileage-based: vehicle.next_service_mileage already <= current
 *      mileage + 1000 km. (mileage column may be tracked elsewhere; for
 *      MVP we look at last job's mileage_at_service vs vehicles.current_mileage.)
 *   3. Inactivity: customer with no jobs in the last 8 months.
 *
 * Each generated reminder gets a unique key (vehicle_id + reminder_type +
 * triggering_record_id) to avoid duplicates within the lookback window.
 */

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const TYPE_DVI_FOLLOWUP = 'dvi_followup';
const TYPE_MILEAGE = 'mileage_due';
const TYPE_INACTIVITY = 'inactivity';

interface RemRow {
  tenant_id: string;
  vehicle_id: string;
  customer_id: string;
  reminder_type: string;
  trigger_date: string;
  trigger_mileage: number | null;
  message_template: string;
  status: 'pending';
}

/**
 * Scan all tenants and create reminders. Designed to be called from the
 * daily cron alongside subscription renewals.
 */
export async function scanSmartRecall(opts?: {
  dviFairLookbackDays?: number;
  inactivityMonths?: number;
}) {
  const dviLookback = opts?.dviFairLookbackDays ?? 90;
  const inactivityMonths = opts?.inactivityMonths ?? 8;
  const supabase = service();

  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);

  const cutoffFair = new Date(today.getTime() - dviLookback * 24 * 60 * 60 * 1000)
    .toISOString();
  const cutoffInactive = new Date(today);
  cutoffInactive.setMonth(cutoffInactive.getMonth() - inactivityMonths);
  const cutoffInactiveIso = cutoffInactive.toISOString();

  const newRows: RemRow[] = [];

  // ---- Rule 1: DVI fair items not followed up ----
  const { data: items } = await supabase
    .from('inspection_items')
    .select(`
      id, item_name, estimated_cost, condition, customer_approved,
      inspection:vehicle_inspections!inner(
        id, vehicle_id, customer_id, tenant_id, created_job_id, created_at,
        vehicle:vehicles(id, customer_id)
      )
    `)
    .eq('condition', 'fair')
    .eq('customer_approved', false)
    .lt('inspection.created_at', cutoffFair)
    .limit(500);

  if (items) {
    for (const it of items) {
      // Supabase returns nested foreign-key joins as either an object or
      // an array depending on the relationship; we flatten to a single
      // record for ergonomic access.
      const inspRaw = it.inspection as unknown;
      const insp = (Array.isArray(inspRaw) ? inspRaw[0] : inspRaw) as
        | Record<string, unknown>
        | null;
      if (!insp) continue;
      if (insp.created_job_id) continue;
      const tenantId = insp.tenant_id as string;
      const vehicleId = insp.vehicle_id as string;
      const vehicleRaw = insp.vehicle as unknown;
      const vehicle = (Array.isArray(vehicleRaw) ? vehicleRaw[0] : vehicleRaw) as
        | Record<string, unknown>
        | null;
      const customerId =
        (insp.customer_id as string) ||
        ((vehicle?.customer_id as string) ?? '');
      if (!tenantId || !vehicleId || !customerId) continue;

      // Skip if already exists
      const { data: existing } = await supabase
        .from('service_reminders')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('vehicle_id', vehicleId)
        .eq('reminder_type', TYPE_DVI_FOLLOWUP)
        .like('message_template', `%[item:${it.id}]%`)
        .maybeSingle();
      if (existing) continue;

      newRows.push({
        tenant_id: tenantId,
        vehicle_id: vehicleId,
        customer_id: customerId,
        reminder_type: TYPE_DVI_FOLLOWUP,
        trigger_date: todayIso,
        trigger_mileage: null,
        message_template:
          `จากการตรวจสภาพครั้งล่าสุด พบรายการ "${it.item_name}" (สีเหลือง) ` +
          `ราคาประมาณ ฿${Number(it.estimated_cost || 0).toLocaleString()} ` +
          `ซึ่งยังไม่ได้ดำเนินการ ตอนนี้น่าจะถึงเวลาเปลี่ยนแล้ว ` +
          `[item:${it.id}]`,
        status: 'pending',
      });
    }
  }

  // ---- Rule 2: Mileage-based — placeholder (skip if columns absent)
  // Uses vehicles.current_mileage and vehicles.next_service_mileage if
  // your schema has them. We probe gracefully.
  try {
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, customer_id, tenant_id, current_mileage, next_service_mileage, license_plate')
      .not('next_service_mileage', 'is', null)
      .not('current_mileage', 'is', null);
    if (vehicles) {
      for (const v of vehicles) {
        const cur = Number(v.current_mileage);
        const due = Number(v.next_service_mileage);
        if (!Number.isFinite(cur) || !Number.isFinite(due)) continue;
        if (cur + 1000 < due) continue; // not due yet
        const { data: existing } = await supabase
          .from('service_reminders')
          .select('id')
          .eq('tenant_id', v.tenant_id as string)
          .eq('vehicle_id', v.id as string)
          .eq('reminder_type', TYPE_MILEAGE)
          .gte('created_at', cutoffInactiveIso)
          .maybeSingle();
        if (existing) continue;
        newRows.push({
          tenant_id: v.tenant_id as string,
          vehicle_id: v.id as string,
          customer_id: v.customer_id as string,
          reminder_type: TYPE_MILEAGE,
          trigger_date: todayIso,
          trigger_mileage: due,
          message_template:
            `รถทะเบียน ${v.license_plate || ''} ใกล้ครบกำหนดเช็คระยะ ` +
            `(ปัจจุบัน ${cur.toLocaleString()} km / ครบกำหนดที่ ${due.toLocaleString()} km) ` +
            `จองคิวล่วงหน้าได้เลยครับ`,
          status: 'pending',
        });
      }
    }
  } catch {
    // schema might not have these columns yet — skip silently
  }

  // ---- Rule 3: Inactivity — customers with no recent jobs ----
  const { data: inactive } = await supabase
    .from('customers')
    .select(`
      id, tenant_id, name,
      vehicles(id),
      jobs(id, created_at)
    `)
    .limit(2000);
  if (inactive) {
    for (const c of inactive) {
      const jobs = (c.jobs as Array<{ created_at: string }> | null) ?? [];
      const vehicles = (c.vehicles as Array<{ id: string }> | null) ?? [];
      if (vehicles.length === 0) continue;
      const lastJob = jobs.length > 0
        ? new Date(jobs.reduce((max, j) => (j.created_at > max ? j.created_at : max), jobs[0].created_at))
        : null;
      if (!lastJob) continue;
      if (lastJob.getTime() > cutoffInactive.getTime()) continue;

      const vehicleId = vehicles[0].id;
      const { data: existing } = await supabase
        .from('service_reminders')
        .select('id')
        .eq('tenant_id', c.tenant_id as string)
        .eq('vehicle_id', vehicleId)
        .eq('reminder_type', TYPE_INACTIVITY)
        .gte('created_at', cutoffInactiveIso)
        .maybeSingle();
      if (existing) continue;

      newRows.push({
        tenant_id: c.tenant_id as string,
        vehicle_id: vehicleId,
        customer_id: c.id as string,
        reminder_type: TYPE_INACTIVITY,
        trigger_date: todayIso,
        trigger_mileage: null,
        message_template:
          `คุณ${c.name || ''} ไม่ได้แวะมาที่ร้านนานเกิน ${inactivityMonths} เดือนแล้ว ` +
          `อยากให้รถได้รับการดูแลก่อนเดินทาง ลดค่าแรง 10% เมื่อจองคิวภายในสัปดาห์นี้`,
        status: 'pending',
      });
    }
  }

  if (newRows.length === 0) return { created: 0 };

  // De-dup batch within the same scan
  const dedup = new Map<string, RemRow>();
  for (const r of newRows) {
    const k = `${r.tenant_id}|${r.vehicle_id}|${r.reminder_type}`;
    if (!dedup.has(k)) dedup.set(k, r);
  }

  const { error } = await supabase.from('service_reminders').insert(Array.from(dedup.values()));
  if (error) {
    console.error('[smart-recall] insert failed', error);
    return { created: 0, error: error.message };
  }
  return { created: dedup.size };
}

/**
 * Send pending reminders via the tenant's LINE OA. Per-tenant: each
 * tenant uses their own line_oa_configs.channel_access_token.
 */
export async function sendPendingReminders(maxPerRun = 100) {
  const supabase = service();
  const { data: pending } = await supabase
    .from('service_reminders')
    .select(`
      id, tenant_id, vehicle_id, customer_id, reminder_type, message_template,
      vehicle:vehicles(license_plate, brand, model),
      customer:customers(name)
    `)
    .eq('status', 'pending')
    .lte('trigger_date', new Date().toISOString().slice(0, 10))
    .limit(maxPerRun);

  if (!pending || pending.length === 0) return { sent: 0 };

  let sent = 0;
  for (const r of pending) {
    const tenantId = r.tenant_id as string;
    const customerId = r.customer_id as string;

    // Find LINE follower for this customer
    const { data: follower } = await supabase
      .from('line_followers')
      .select('line_user_id')
      .eq('tenant_id', tenantId)
      .eq('customer_id', customerId)
      .eq('is_following', true)
      .maybeSingle();

    if (!follower) {
      // No LINE — mark sent_via=none so we don't retry indefinitely
      await supabase
        .from('service_reminders')
        .update({
          status: 'cancelled',
          sent_at: new Date().toISOString(),
          sent_via: 'none',
        })
        .eq('id', r.id);
      continue;
    }

    // Get tenant's LINE config
    const { data: cfg } = await supabase
      .from('line_oa_configs')
      .select('channel_access_token, is_active')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (!cfg?.is_active || !cfg.channel_access_token) {
      // Tenant LINE OA not configured; skip but keep pending (in case
      // they configure it later)
      continue;
    }

    const vehicle = r.vehicle as { license_plate?: string; brand?: string; model?: string } | null;
    const customer = r.customer as { name?: string } | null;
    const text =
      `🔔 แจ้งเตือนจากอู่\n\n` +
      `${customer?.name ? customer.name + ' ' : ''}` +
      `${vehicle ? `(รถ ${vehicle.license_plate ?? ''})` : ''}\n\n` +
      r.message_template?.replace(/\[item:[a-f0-9-]+\]/g, '').trim();

    try {
      const res = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cfg.channel_access_token}`,
        },
        body: JSON.stringify({
          to: follower.line_user_id,
          messages: [{ type: 'text', text }],
        }),
      });
      if (res.ok) {
        await supabase
          .from('service_reminders')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            sent_via: 'line',
          })
          .eq('id', r.id);
        sent++;
      } else {
        const errText = await res.text();
        console.error('[smart-recall] LINE push failed', errText);
      }
    } catch (e) {
      console.error('[smart-recall] LINE push exception', e);
    }
  }

  return { sent };
}

// ============================================================
// Tenant-side helpers
// ============================================================

export async function listSmartRecallReminders(filters?: { status?: string; type?: string }) {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return [];

  let q = supabase
    .from('service_reminders')
    .select(`
      *,
      vehicle:vehicles(id, license_plate, brand, model),
      customer:customers(id, name, phone)
    `)
    .eq('tenant_id', userInfo.tenant_id)
    .order('created_at', { ascending: false })
    .limit(200);

  if (filters?.status) q = q.eq('status', filters.status);
  if (filters?.type) q = q.eq('reminder_type', filters.type);
  const { data } = await q;
  return data || [];
}

export async function cancelReminder(id: string) {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return { error: 'ไม่มีสิทธิ์' };
  const { error } = await supabase
    .from('service_reminders')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/reminders');
  return { success: true };
}
