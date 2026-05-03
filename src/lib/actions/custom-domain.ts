'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUserInfo } from '@/lib/actions/auth-helpers';
import {
  addDomain,
  verifyDomain,
  removeDomain,
  getDnsInstructions,
} from '@/lib/vercel/domains';

// ============================================================
// Pricing for the custom_domain add-on (THB/year).
// Bumps here automatically reflect in the renewal invoice + UI.
// ============================================================
export const CUSTOM_DOMAIN_PRICE_YEARLY = 1000;

// Validate a hostname like "www.mygarage.com" or "mygarage.com"
const DOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

function normalizeDomain(d: string): string {
  return d
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
}

async function ensureOwner() {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return { error: 'ไม่มีสิทธิ์' as const };
  if (!['owner', 'admin'].includes(userInfo.role)) return { error: 'ไม่มีสิทธิ์' as const };
  return { supabase, tenantId: userInfo.tenant_id };
}

// ============================================================
// Addon — subscribe / cancel
// ============================================================

export async function getActiveDomainAddon() {
  const ctx = await ensureOwner();
  if ('error' in ctx) return null;
  const { data } = await ctx.supabase
    .from('tenant_addons')
    .select('*')
    .eq('tenant_id', ctx.tenantId)
    .eq('addon_type', 'custom_domain')
    .in('status', ['pending', 'active'])
    .maybeSingle();
  return data;
}

export async function subscribeCustomDomainAddon() {
  const ctx = await ensureOwner();
  if ('error' in ctx) return { error: ctx.error };

  // Already subscribed?
  const existing = await getActiveDomainAddon();
  if (existing) {
    return { error: 'ร้านนี้มี Custom Domain add-on อยู่แล้ว' };
  }

  // Insert as 'pending' — super_admin marks it 'active' after the
  // next subscription invoice is paid (or immediately for promo cases).
  const { data, error } = await ctx.supabase
    .from('tenant_addons')
    .insert({
      tenant_id: ctx.tenantId,
      addon_type: 'custom_domain',
      status: 'pending',
      price: CUSTOM_DOMAIN_PRICE_YEARLY,
      billing_cycle: 'yearly',
    })
    .select()
    .single();
  if (error) return { error: error.message };

  revalidatePath('/dashboard/settings/domain');
  revalidatePath('/dashboard/settings/subscription');
  return { success: true, addon: data };
}

export async function cancelCustomDomainAddon() {
  const ctx = await ensureOwner();
  if ('error' in ctx) return { error: ctx.error };

  // Remove domain from Vercel first if any
  const { data: tenant } = await ctx.supabase
    .from('tenants')
    .select('custom_domain')
    .eq('id', ctx.tenantId)
    .single();
  if (tenant?.custom_domain) {
    await removeDomain(tenant.custom_domain as string).catch(() => null);
  }

  // Clear domain on tenant
  await ctx.supabase
    .from('tenants')
    .update({
      custom_domain: null,
      custom_domain_status: null,
      custom_domain_verified: false,
      custom_domain_added_at: null,
      custom_domain_verified_at: null,
    })
    .eq('id', ctx.tenantId);

  // Cancel addon
  await ctx.supabase
    .from('tenant_addons')
    .update({ status: 'cancelled' })
    .eq('tenant_id', ctx.tenantId)
    .eq('addon_type', 'custom_domain')
    .in('status', ['pending', 'active']);

  revalidatePath('/dashboard/settings/domain');
  return { success: true };
}

// ============================================================
// Custom domain — request / verify
// ============================================================

export interface DomainStatus {
  domain: string | null;
  status: string | null;
  verified: boolean;
  verification?: Array<{ type: string; domain: string; value: string; reason: string }>;
  dns_instructions?: ReturnType<typeof getDnsInstructions>;
  added_at: string | null;
  verified_at: string | null;
}

export async function getDomainStatus(): Promise<DomainStatus | null> {
  const ctx = await ensureOwner();
  if ('error' in ctx) return null;
  const { data } = await ctx.supabase
    .from('tenants')
    .select('custom_domain, custom_domain_status, custom_domain_verified, custom_domain_added_at, custom_domain_verified_at')
    .eq('id', ctx.tenantId)
    .single();
  if (!data) return null;
  return {
    domain: (data.custom_domain as string) || null,
    status: (data.custom_domain_status as string) || null,
    verified: !!data.custom_domain_verified,
    added_at: (data.custom_domain_added_at as string) || null,
    verified_at: (data.custom_domain_verified_at as string) || null,
    dns_instructions: data.custom_domain
      ? getDnsInstructions(data.custom_domain as string)
      : undefined,
  };
}

export async function requestCustomDomain(rawDomain: string) {
  const ctx = await ensureOwner();
  if ('error' in ctx) return { error: ctx.error };

  // Must have active or pending addon
  const addon = await getActiveDomainAddon();
  if (!addon) {
    return {
      error:
        'ต้องสมัคร Custom Domain add-on ก่อน (1,000฿/ปี — ไม่รวมค่าโดเมน)',
    };
  }

  const domain = normalizeDomain(rawDomain);
  if (!DOMAIN_RE.test(domain)) {
    return { error: 'รูปแบบโดเมนไม่ถูกต้อง (เช่น www.mygarage.com)' };
  }

  // Check unique per tenant — UNIQUE constraint will also catch this
  const { data: collide } = await ctx.supabase
    .from('tenants')
    .select('id')
    .eq('custom_domain', domain)
    .neq('id', ctx.tenantId)
    .maybeSingle();
  if (collide) return { error: 'โดเมนนี้ถูกใช้กับร้านอื่นแล้ว' };

  // Add to Vercel
  const result = await addDomain(domain);
  if (!result.ok) return { error: result.error || 'ไม่สามารถเพิ่มโดเมนได้' };

  // Save on tenant
  const { error } = await ctx.supabase
    .from('tenants')
    .update({
      custom_domain: domain,
      custom_domain_status: result.verified ? 'active' : 'verifying',
      custom_domain_verified: !!result.verified,
      custom_domain_added_at: new Date().toISOString(),
      custom_domain_verified_at: result.verified ? new Date().toISOString() : null,
    })
    .eq('id', ctx.tenantId);
  if (error) return { error: error.message };

  revalidatePath('/dashboard/settings/domain');
  return {
    success: true,
    verified: !!result.verified,
    verification: result.verification,
    dns: getDnsInstructions(domain),
  };
}

export async function verifyMyDomain() {
  const ctx = await ensureOwner();
  if ('error' in ctx) return { error: ctx.error };

  const { data: tenant } = await ctx.supabase
    .from('tenants')
    .select('custom_domain')
    .eq('id', ctx.tenantId)
    .single();
  if (!tenant?.custom_domain) return { error: 'ยังไม่ได้เพิ่มโดเมน' };

  const result = await verifyDomain(tenant.custom_domain as string);
  if (!result.ok) return { error: result.error || 'ตรวจสอบไม่สำเร็จ' };

  await ctx.supabase
    .from('tenants')
    .update({
      custom_domain_status: result.verified ? 'active' : 'verifying',
      custom_domain_verified: result.verified,
      custom_domain_verified_at: result.verified ? new Date().toISOString() : null,
    })
    .eq('id', ctx.tenantId);

  revalidatePath('/dashboard/settings/domain');
  return {
    success: true,
    verified: result.verified,
    verification: result.verification,
  };
}

export async function removeCustomDomain() {
  const ctx = await ensureOwner();
  if ('error' in ctx) return { error: ctx.error };

  const { data: tenant } = await ctx.supabase
    .from('tenants')
    .select('custom_domain')
    .eq('id', ctx.tenantId)
    .single();
  if (tenant?.custom_domain) {
    await removeDomain(tenant.custom_domain as string).catch(() => null);
  }

  await ctx.supabase
    .from('tenants')
    .update({
      custom_domain: null,
      custom_domain_status: null,
      custom_domain_verified: false,
      custom_domain_added_at: null,
      custom_domain_verified_at: null,
    })
    .eq('id', ctx.tenantId);

  revalidatePath('/dashboard/settings/domain');
  return { success: true };
}
