'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { getUserInfo } from '@/lib/actions/auth-helpers';
import {
  type TenantBrand,
  parseBrand,
  isValidHex,
  pickContrast,
} from '@/lib/branding/types';

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ============================================================
// Owner-facing
// ============================================================

export async function getMyBrand(): Promise<TenantBrand | null> {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return null;
  const { data } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', userInfo.tenant_id)
    .single();
  return parseBrand((data?.settings as Record<string, unknown>)?.brand);
}

export async function saveBrand(input: {
  primary_color?: string;
  logo_url?: string | null;
  display_name?: string | null;
}) {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return { error: 'ไม่มีสิทธิ์' };
  if (!['owner', 'admin'].includes(userInfo.role)) return { error: 'ไม่มีสิทธิ์' };

  if (input.primary_color && !isValidHex(input.primary_color)) {
    return { error: 'รูปแบบสีไม่ถูกต้อง (ต้องเป็น hex เช่น #7C5BFB)' };
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', userInfo.tenant_id)
    .single();
  const prev = (tenant?.settings as Record<string, unknown>) || {};
  const prevBrand = parseBrand(prev.brand);

  const next: TenantBrand = {
    primary_color: input.primary_color ?? prevBrand.primary_color,
    primary_foreground: input.primary_color
      ? pickContrast(input.primary_color)
      : prevBrand.primary_foreground,
    logo_url:
      input.logo_url === undefined ? prevBrand.logo_url : input.logo_url,
    display_name:
      input.display_name === undefined
        ? prevBrand.display_name
        : input.display_name,
  };

  const { error } = await supabase
    .from('tenants')
    .update({ settings: { ...prev, brand: next } })
    .eq('id', userInfo.tenant_id);
  if (error) return { error: error.message };

  // Customer-facing pages cache by tenant slug — bust them all
  revalidatePath('/dashboard/settings/branding');
  return { success: true, brand: next };
}

// ============================================================
// Public — fetch brand by tenant slug (for storefront/booking/track)
// ============================================================

export async function getBrandBySlug(slug: string): Promise<TenantBrand | null> {
  const supabase = service();
  const { data } = await supabase
    .from('tenants')
    .select('settings')
    .eq('slug', slug)
    .maybeSingle();
  if (!data) return null;
  return parseBrand((data.settings as Record<string, unknown>)?.brand);
}

export async function getBrandByCustomDomain(
  domain: string,
): Promise<{ brand: TenantBrand; tenantSlug: string } | null> {
  const supabase = service();
  const { data } = await supabase
    .from('tenants')
    .select('slug, settings')
    .eq('custom_domain', domain.toLowerCase())
    .eq('custom_domain_verified', true)
    .maybeSingle();
  if (!data) return null;
  return {
    brand: parseBrand((data.settings as Record<string, unknown>)?.brand),
    tenantSlug: data.slug as string,
  };
}

// Lookup by job_number → tenant (used by tracking page)
export async function getBrandByJobNumber(
  jobNumber: string,
): Promise<TenantBrand | null> {
  const supabase = service();
  const { data: job } = await supabase
    .from('jobs')
    .select('tenant_id, tenant:tenants(settings)')
    .eq('job_number', jobNumber)
    .maybeSingle();
  if (!job) return null;
  const t = job.tenant as { settings?: Record<string, unknown> } | null;
  return parseBrand(t?.settings?.brand);
}
