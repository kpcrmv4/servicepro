'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import {
  pushPlatformLineMessage,
  buildRenewalInvoiceFlex,
  buildRenewalReminderText,
} from '@/lib/line/platform-line';

// ============================================================
// Pricing — single source of truth for renewal amounts.
// Adjust here when plans change.
// ============================================================

const PLAN_PRICING: Record<string, { yearly: number; monthly: number; label: string }> = {
  free: { yearly: 0, monthly: 0, label: 'Free' },
  basic: { yearly: 9900, monthly: 990, label: 'Basic' },
  professional: { yearly: 29900, monthly: 2990, label: 'Professional' },
  premium: { yearly: 59900, monthly: 5990, label: 'Premium' },
};

export async function getPlanPricing(plan: string, cycle: 'monthly' | 'yearly' = 'yearly') {
  const p = PLAN_PRICING[plan] ?? PLAN_PRICING.basic;
  return { amount: cycle === 'yearly' ? p.yearly : p.monthly, label: p.label };
}

// ============================================================
// Auth helpers
// ============================================================

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('users').select('id, role').eq('id', user.id).single();
  if (profile?.role !== 'super_admin') return null;
  return { supabase, userId: profile.id };
}

async function requireOwner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('users').select('id, role, tenant_id').eq('id', user.id).single();
  if (!profile?.tenant_id) return null;
  if (!['owner', 'admin', 'super_admin'].includes(profile.role)) return null;
  return { supabase, userId: profile.id, tenantId: profile.tenant_id, role: profile.role };
}

// ============================================================
// Invoice numbering: SUB-YYYYMM-XXXX (XXXX = sequential per month)
// ============================================================

async function generateInvoiceNumber(supabase: Awaited<ReturnType<typeof createClient>>) {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `SUB-${ym}-`;
  const { count } = await supabase
    .from('subscription_invoices')
    .select('id', { count: 'exact', head: true })
    .like('invoice_number', `${prefix}%`);
  const seq = String((count || 0) + 1).padStart(4, '0');
  return `${prefix}${seq}`;
}

// ============================================================
// Renewal scanner — typically called by Vercel Cron once a day.
// Returns the list of newly created invoices.
//
// Logic:
//   - Tenants on a paid plan whose current_period_end is within
//     `noticeDays` AND have no pending/sent invoice covering that
//     period get a new subscription_invoice row.
//   - Tenants on trial whose trial_ends_at is within `noticeDays`
//     and have no pending/sent invoice get a "post-trial" invoice
//     for their current plan.
// ============================================================

export async function scanAndCreateRenewals(noticeDays = 14) {
  // Service client because cron runs without a user session.
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const today = new Date();
  const horizon = new Date(today.getTime() + noticeDays * 24 * 60 * 60 * 1000);
  const horizonIso = horizon.toISOString();

  // 1. Active subscriptions approaching renewal
  const { data: activeTenants } = await supabase
    .from('tenants')
    .select('id, name, plan, billing_cycle, current_period_end, auto_renew, subscription_status')
    .eq('subscription_status', 'active')
    .eq('auto_renew', true)
    .not('current_period_end', 'is', null)
    .lte('current_period_end', horizonIso);

  // 2. Trials approaching expiry
  const { data: trialTenants } = await supabase
    .from('tenants')
    .select('id, name, plan, billing_cycle, trial_ends_at, subscription_status')
    .eq('subscription_status', 'trial')
    .not('trial_ends_at', 'is', null)
    .lte('trial_ends_at', horizonIso);

  const candidates = [
    ...(activeTenants || []).map((t) => ({ ...t, periodAnchor: t.current_period_end as string })),
    ...(trialTenants || []).map((t) => ({ ...t, periodAnchor: t.trial_ends_at as string })),
  ];

  const created: { tenantId: string; invoiceId: string; invoiceNumber: string }[] = [];

  for (const t of candidates) {
    const tenantId = t.id as string;
    const plan = (t.plan as string) || 'basic';
    if (plan === 'free') continue;
    const cycle = ((t.billing_cycle as string) || 'yearly') as 'monthly' | 'yearly';
    const { amount: planAmount } = await getPlanPricing(plan, cycle);
    if (planAmount <= 0) continue;

    // Skip if an open invoice for this tenant already exists
    const { data: existing } = await supabase
      .from('subscription_invoices')
      .select('id')
      .eq('tenant_id', tenantId)
      .in('status', ['pending', 'sent', 'overdue'])
      .limit(1)
      .maybeSingle();
    if (existing) continue;

    // Sum addon prices for this tenant (custom_domain etc).
    // We pull all pending+active addons; pending ones get bundled into
    // this invoice and flipped to active when super_admin marks paid.
    const { data: addons } = await supabase
      .from('tenant_addons')
      .select('id, addon_type, status, price, billing_cycle')
      .eq('tenant_id', tenantId)
      .in('status', ['pending', 'active']);
    const addonRows = addons || [];
    const addonSum = addonRows.reduce((s, a) => s + Number(a.price), 0);
    const amount = planAmount + addonSum;

    const periodStart = new Date(t.periodAnchor);
    const periodEnd = new Date(periodStart);
    if (cycle === 'yearly') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Build invoice number — same approach as authed helper but using
    // the service client (we can't share it). Acceptable: rare collisions
    // resolved by unique index retry.
    const ym = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `SUB-${ym}-`;
    const { count } = await supabase
      .from('subscription_invoices')
      .select('id', { count: 'exact', head: true })
      .like('invoice_number', `${prefix}%`);
    const invoiceNumber = `${prefix}${String((count || 0) + 1 + created.length).padStart(4, '0')}`;

    const breakdown: string[] = [
      `แพลน ${plan}: ฿${planAmount.toLocaleString()}`,
      ...addonRows.map((a) => `${a.addon_type}: ฿${Number(a.price).toLocaleString()}`),
    ];

    const { data: inv, error } = await supabase
      .from('subscription_invoices')
      .insert({
        tenant_id: tenantId,
        invoice_number: invoiceNumber,
        plan,
        billing_cycle: cycle,
        amount,
        currency: 'THB',
        period_start: periodStart.toISOString().slice(0, 10),
        period_end: periodEnd.toISOString().slice(0, 10),
        due_date: periodStart.toISOString().slice(0, 10),
        status: 'pending',
        notes: addonRows.length > 0 ? breakdown.join(' | ') : null,
      })
      .select('id, invoice_number')
      .single();

    if (error || !inv) {
      console.error('[scanAndCreateRenewals] insert failed', tenantId, error);
      continue;
    }
    created.push({ tenantId, invoiceId: inv.id as string, invoiceNumber: inv.invoice_number as string });
  }

  return { created };
}

// ============================================================
// Send LINE notification for a single invoice (or all open ones)
// ============================================================

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export async function sendRenewalLineNotification(invoiceId: string) {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: inv } = await supabase
    .from('subscription_invoices')
    .select('*, tenant:tenants(id, name, slug)')
    .eq('id', invoiceId)
    .single();
  if (!inv) return { ok: false, reason: 'invoice_not_found' as const };
  if (inv.status === 'paid' || inv.status === 'cancelled') {
    return { ok: false, reason: 'already_settled' as const };
  }

  const { data: links } = await supabase
    .from('tenant_owner_line_links')
    .select('line_user_id')
    .eq('tenant_id', inv.tenant_id)
    .eq('is_active', true);

  if (!links || links.length === 0) {
    return { ok: false, reason: 'no_owner_link' as const };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kpservicepro.com';
  const payUrl = `${baseUrl}/dashboard/settings/subscription?invoice=${inv.id}`;
  const tenantName =
    (inv.tenant as { name?: string } | null)?.name || 'ร้านค้าของท่าน';

  const flex = buildRenewalInvoiceFlex({
    shopName: tenantName,
    invoiceNumber: inv.invoice_number,
    plan: inv.plan,
    amount: Number(inv.amount),
    dueDate: formatDate(inv.due_date),
    periodLabel: `${formatDate(inv.period_start)} - ${formatDate(inv.period_end)}`,
    payUrl,
    invoiceId: inv.id,
  });

  let anyOk = false;
  let lastErr: string | null = null;
  for (const l of links) {
    const res = await pushPlatformLineMessage(l.line_user_id as string, [flex]);
    if (res.ok) anyOk = true;
    else lastErr = res.error;
  }

  if (anyOk) {
    await supabase
      .from('subscription_invoices')
      .update({
        status: inv.status === 'pending' ? 'sent' : inv.status,
        notified_via_line_at: new Date().toISOString(),
        reminder_count: (inv.reminder_count || 0) + 1,
        last_reminder_at: new Date().toISOString(),
      })
      .eq('id', inv.id);
    return { ok: true as const };
  }
  return { ok: false as const, reason: 'line_push_failed' as const, error: lastErr };
}

// Reminder pulses — for any open invoice with due_date within X days.
export async function sendDueReminders(daysBeforeDue: number[] = [30, 7, 1, -1]) {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const today = new Date();
  const todayMs = today.getTime();
  const sent: string[] = [];

  const { data: invoices } = await supabase
    .from('subscription_invoices')
    .select('*, tenant:tenants(id, name)')
    .in('status', ['pending', 'sent', 'overdue']);

  if (!invoices) return { sent };

  for (const inv of invoices) {
    const dueMs = new Date(inv.due_date).getTime();
    const daysLeft = Math.ceil((dueMs - todayMs) / (24 * 60 * 60 * 1000));
    if (!daysBeforeDue.includes(daysLeft)) continue;

    // Don't double-send within 12 hours
    if (inv.last_reminder_at) {
      const last = new Date(inv.last_reminder_at).getTime();
      if (todayMs - last < 12 * 60 * 60 * 1000) continue;
    }

    const { data: links } = await supabase
      .from('tenant_owner_line_links')
      .select('line_user_id')
      .eq('tenant_id', inv.tenant_id)
      .eq('is_active', true);
    if (!links || links.length === 0) continue;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kpservicepro.com';
    const payUrl = `${baseUrl}/dashboard/settings/subscription?invoice=${inv.id}`;
    const reminder = buildRenewalReminderText({
      shopName: (inv.tenant as { name?: string } | null)?.name || 'ร้านของท่าน',
      daysLeft,
      amount: Number(inv.amount),
      payUrl,
    });

    let anyOk = false;
    for (const l of links) {
      const res = await pushPlatformLineMessage(l.line_user_id as string, [reminder]);
      if (res.ok) anyOk = true;
    }
    if (anyOk) {
      const newStatus = daysLeft < 0 ? 'overdue' : inv.status;
      await supabase
        .from('subscription_invoices')
        .update({
          status: newStatus,
          reminder_count: (inv.reminder_count || 0) + 1,
          last_reminder_at: new Date().toISOString(),
        })
        .eq('id', inv.id);
      sent.push(inv.id);
    }
  }
  return { sent };
}

// ============================================================
// Owner-facing actions
// ============================================================

export async function listOwnSubscriptionInvoices() {
  const ctx = await requireOwner();
  if (!ctx) return [];
  const { data } = await ctx.supabase
    .from('subscription_invoices')
    .select('*')
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false });
  return data || [];
}

// Owner marks "I've transferred" — flips invoice into a pending-review
// state with payment method, reference and slip image. Super_admin
// then verifies and marks paid.
export async function markInvoiceTransferClaimed(input: {
  invoiceId: string;
  paymentMethod: 'transfer' | 'promptpay' | 'credit_card';
  paymentReference?: string;
  paymentSlipUrl?: string;
}) {
  const ctx = await requireOwner();
  if (!ctx) return { error: 'ไม่มีสิทธิ์' };
  if (!['transfer', 'promptpay', 'credit_card'].includes(input.paymentMethod)) {
    return { error: 'ช่องทางชำระเงินไม่ถูกต้อง' };
  }

  const { data: inv } = await ctx.supabase
    .from('subscription_invoices')
    .select('id, tenant_id, status')
    .eq('id', input.invoiceId)
    .single();
  if (!inv || inv.tenant_id !== ctx.tenantId) return { error: 'ไม่พบใบแจ้งหนี้' };
  if (inv.status === 'paid' || inv.status === 'cancelled') {
    return { error: 'ใบแจ้งหนี้นี้ปิดแล้ว' };
  }

  const methodLabel: Record<string, string> = {
    transfer: 'โอนผ่านธนาคาร',
    promptpay: 'PromptPay',
    credit_card: 'บัตรเครดิต (รูดที่ร้าน)',
  };

  await ctx.supabase
    .from('subscription_invoices')
    .update({
      payment_method: input.paymentMethod,
      payment_reference: input.paymentReference || `owner-claimed-${input.paymentMethod}`,
      payment_slip_url: input.paymentSlipUrl || null,
      notes: `ลูกค้าแจ้งชำระแล้ว (${methodLabel[input.paymentMethod]}) — รอ super_admin ตรวจสอบ`,
    })
    .eq('id', input.invoiceId);
  revalidatePath('/dashboard/settings/subscription');
  return { success: true };
}

// ============================================================
// Owner LINE link management
// ============================================================

export async function createOwnerLineLinkToken() {
  const ctx = await requireOwner();
  if (!ctx) return { error: 'ไม่มีสิทธิ์' };

  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  // Either insert a placeholder row (with empty line_user_id) or
  // update an existing inactive one. We use upsert by (tenant_id,user_id).
  const { error } = await ctx.supabase
    .from('tenant_owner_line_links')
    .upsert(
      {
        tenant_id: ctx.tenantId,
        user_id: ctx.userId,
        line_user_id: `pending:${token}`,
        link_token: token,
        link_token_expires_at: expiresAt,
        is_active: false,
      },
      { onConflict: 'tenant_id,user_id' },
    );
  if (error) return { error: error.message };

  const basicId = process.env.PLATFORM_LINE_BASIC_ID;
  const oaUrl = basicId ? `https://line.me/R/ti/p/${basicId}` : null;
  return { token, expiresAt, oaUrl };
}

export async function getOwnerLineLink() {
  const ctx = await requireOwner();
  if (!ctx) return null;
  const { data } = await ctx.supabase
    .from('tenant_owner_line_links')
    .select('id, line_user_id, display_name, picture_url, is_active, linked_at')
    .eq('tenant_id', ctx.tenantId)
    .eq('user_id', ctx.userId)
    .maybeSingle();
  if (!data) return null;
  if (!data.is_active) return null;
  return data;
}

export async function unlinkOwnerLine() {
  const ctx = await requireOwner();
  if (!ctx) return { error: 'ไม่มีสิทธิ์' };
  const { error } = await ctx.supabase
    .from('tenant_owner_line_links')
    .update({ is_active: false, unlinked_at: new Date().toISOString() })
    .eq('tenant_id', ctx.tenantId)
    .eq('user_id', ctx.userId);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/settings/subscription');
  return { success: true };
}

// ============================================================
// Super-admin actions
// ============================================================

export async function listAllSubscriptionInvoices(filter?: { status?: string; tenantId?: string }) {
  const ctx = await requireSuperAdmin();
  if (!ctx) return [];
  let q = ctx.supabase
    .from('subscription_invoices')
    .select('*, tenant:tenants(id, name, slug, plan)')
    .order('created_at', { ascending: false });
  if (filter?.status) q = q.eq('status', filter.status);
  if (filter?.tenantId) q = q.eq('tenant_id', filter.tenantId);
  const { data } = await q;
  return data || [];
}

export async function createManualRenewalInvoice(input: {
  tenantId: string;
  plan: string;
  cycle?: 'monthly' | 'yearly';
  periodStart?: string;
  amount?: number;
  notes?: string;
}) {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { error: 'ไม่มีสิทธิ์' };

  const { data: tenant } = await ctx.supabase
    .from('tenants')
    .select('id, plan, billing_cycle, current_period_end, trial_ends_at')
    .eq('id', input.tenantId)
    .single();
  if (!tenant) return { error: 'ไม่พบร้าน' };

  const cycle = input.cycle ?? ((tenant.billing_cycle as string) || 'yearly') as 'monthly' | 'yearly';
  const plan = input.plan ?? (tenant.plan as string) ?? 'basic';
  const pricing = await getPlanPricing(plan, cycle);
  const amount = input.amount ?? pricing.amount;

  const periodStart = input.periodStart
    ? new Date(input.periodStart)
    : new Date(
        (tenant.current_period_end as string | null) ||
          (tenant.trial_ends_at as string | null) ||
          new Date(),
      );
  const periodEnd = new Date(periodStart);
  if (cycle === 'yearly') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  else periodEnd.setMonth(periodEnd.getMonth() + 1);

  const invoiceNumber = await generateInvoiceNumber(ctx.supabase);
  const { data: inv, error } = await ctx.supabase
    .from('subscription_invoices')
    .insert({
      tenant_id: input.tenantId,
      invoice_number: invoiceNumber,
      plan,
      billing_cycle: cycle,
      amount,
      period_start: periodStart.toISOString().slice(0, 10),
      period_end: periodEnd.toISOString().slice(0, 10),
      due_date: periodStart.toISOString().slice(0, 10),
      status: 'pending',
      notes: input.notes || null,
    })
    .select()
    .single();
  if (error || !inv) return { error: error?.message || 'ไม่สามารถสร้างใบแจ้งหนี้ได้' };
  revalidatePath('/super-admin');
  revalidatePath('/super-admin/subscriptions');
  return { success: true, invoice: inv };
}

export async function markInvoicePaid(input: {
  invoiceId: string;
  paymentMethod?: string;
  paymentReference?: string;
  paidAmount?: number;
  paidAt?: string;
}) {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { error: 'ไม่มีสิทธิ์' };

  const { data: inv } = await ctx.supabase
    .from('subscription_invoices')
    .select('*')
    .eq('id', input.invoiceId)
    .single();
  if (!inv) return { error: 'ไม่พบใบแจ้งหนี้' };
  if (inv.status === 'paid') return { error: 'ใบแจ้งหนี้นี้ชำระแล้ว' };

  const paidAt = input.paidAt || new Date().toISOString();

  // 1. Mark invoice paid
  const { error: invErr } = await ctx.supabase
    .from('subscription_invoices')
    .update({
      status: 'paid',
      payment_method: input.paymentMethod || inv.payment_method || 'transfer',
      payment_reference: input.paymentReference || inv.payment_reference,
      paid_amount: input.paidAmount ?? Number(inv.amount),
      paid_at: paidAt,
    })
    .eq('id', input.invoiceId);
  if (invErr) return { error: invErr.message };

  // 2. Activate tenant subscription for the new period
  const { error: tErr } = await ctx.supabase
    .from('tenants')
    .update({
      subscription_status: 'active',
      plan: inv.plan,
      billing_cycle: inv.billing_cycle,
      current_period_start: inv.period_start,
      current_period_end: inv.period_end,
      trial_ends_at: null,
    })
    .eq('id', inv.tenant_id);
  if (tErr) return { error: tErr.message };

  // 3. Audit
  await ctx.supabase.from('subscription_history').insert({
    tenant_id: inv.tenant_id,
    plan: inv.plan,
    status: 'active',
    started_at: inv.period_start,
    ended_at: inv.period_end,
    amount: Number(inv.amount),
    payment_reference: input.paymentReference || inv.payment_reference,
  });

  // 3b. Activate pending addons for this tenant — match the invoice
  // period so the addon expires alongside the subscription.
  await ctx.supabase
    .from('tenant_addons')
    .update({
      status: 'active',
      period_start: inv.period_start,
      period_end: inv.period_end,
    })
    .eq('tenant_id', inv.tenant_id)
    .eq('status', 'pending');

  // 4. Notify owner via LINE if linked (best effort, non-blocking)
  try {
    const { data: links } = await ctx.supabase
      .from('tenant_owner_line_links')
      .select('line_user_id')
      .eq('tenant_id', inv.tenant_id)
      .eq('is_active', true);
    if (links && links.length > 0) {
      for (const l of links) {
        await pushPlatformLineMessage(l.line_user_id as string, [
          {
            type: 'text',
            text:
              `✅ ยืนยันการชำระเงินแล้ว\n\n` +
              `เลขที่: ${inv.invoice_number}\n` +
              `แพลน: ${inv.plan}\n` +
              `รอบบริการ: ${inv.period_start} - ${inv.period_end}\n` +
              `ยอด: ฿${Number(inv.amount).toLocaleString()}\n\n` +
              `ขอบคุณที่ใช้บริการ KPServicePro!`,
          },
        ]);
      }
    }
  } catch (e) {
    console.error('[markInvoicePaid] LINE notify failed', e);
  }

  revalidatePath('/super-admin');
  revalidatePath('/super-admin/subscriptions');
  revalidatePath('/dashboard/settings/subscription');
  return { success: true };
}

export async function cancelInvoice(invoiceId: string, reason?: string) {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { error: 'ไม่มีสิทธิ์' };
  const { error } = await ctx.supabase
    .from('subscription_invoices')
    .update({ status: 'cancelled', notes: reason || null })
    .eq('id', invoiceId);
  if (error) return { error: error.message };
  revalidatePath('/super-admin/subscriptions');
  return { success: true };
}
