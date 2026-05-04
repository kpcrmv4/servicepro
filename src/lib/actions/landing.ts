'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { getUserInfo } from '@/lib/actions/auth-helpers';
import type { LandingPage, Section, SectionType } from '@/lib/landing/types';
import { SECTION_DEFAULTS } from '@/lib/landing/types';

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const PREMIUM_PLANS = ['premium'];

export async function getMyLandingPage(): Promise<LandingPage | null> {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return null;
  const { data } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('tenant_id', userInfo.tenant_id)
    .maybeSingle();
  return data ? hydrate(data) : null;
}

function hydrate(row: Record<string, unknown>): LandingPage {
  return {
    id: row.id as string,
    tenant_id: row.tenant_id as string,
    is_published: !!row.is_published,
    primary_color: (row.primary_color as string) || '#1e40af',
    hero_image_url: (row.hero_image_url as string) || null,
    logo_url: (row.logo_url as string) || null,
    seo_title: (row.seo_title as string) || null,
    seo_description: (row.seo_description as string) || null,
    sections: Array.isArray(row.sections) ? (row.sections as Section[]) : [],
    show_booking_widget: row.show_booking_widget !== false,
  };
}

async function ensurePremium(): Promise<{ tenantId: string; supabase: Awaited<ReturnType<typeof createClient>> } | { error: string }> {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return { error: 'ไม่มีสิทธิ์' };
  if (!['owner', 'admin'].includes(userInfo.role)) return { error: 'ไม่มีสิทธิ์' };
  const { data: tenant } = await supabase
    .from('tenants')
    .select('plan')
    .eq('id', userInfo.tenant_id)
    .single();
  if (!PREMIUM_PLANS.includes(tenant?.plan as string)) {
    return { error: 'ฟีเจอร์นี้รองรับเฉพาะแพลน Premium' };
  }
  return { tenantId: userInfo.tenant_id, supabase };
}

export async function ensureLandingPage(): Promise<{ page: LandingPage } | { error: string }> {
  const ctx = await ensurePremium();
  if ('error' in ctx) return ctx;
  const existing = await getMyLandingPage();
  if (existing) return { page: existing };

  const defaults: Section[] = [
    { id: crypto.randomUUID(), type: 'hero', order: 0, data: SECTION_DEFAULTS.hero() } as Section,
    { id: crypto.randomUUID(), type: 'services', order: 1, data: SECTION_DEFAULTS.services() } as Section,
    { id: crypto.randomUUID(), type: 'about', order: 2, data: SECTION_DEFAULTS.about() } as Section,
    { id: crypto.randomUUID(), type: 'contact', order: 3, data: SECTION_DEFAULTS.contact() } as Section,
  ];

  const { data, error } = await ctx.supabase
    .from('landing_pages')
    .insert({
      tenant_id: ctx.tenantId,
      sections: defaults,
    })
    .select()
    .single();
  if (error || !data) return { error: error?.message || 'ไม่สามารถสร้างหน้า Landing ได้' };
  return { page: hydrate(data) };
}

export async function saveLandingPage(input: {
  is_published?: boolean;
  primary_color?: string;
  hero_image_url?: string | null;
  logo_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  sections?: Section[];
  show_booking_widget?: boolean;
}) {
  const ctx = await ensurePremium();
  if ('error' in ctx) return ctx;
  const { error } = await ctx.supabase
    .from('landing_pages')
    .update({
      ...input,
      sections: input.sections ?? undefined,
    })
    .eq('tenant_id', ctx.tenantId);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/landing');
  return { success: true };
}

export async function addSection(type: SectionType) {
  const ctx = await ensurePremium();
  if ('error' in ctx) return ctx;
  const existing = await getMyLandingPage();
  if (!existing) return { error: 'ยังไม่ได้สร้างหน้า Landing' };
  const newSection: Section = {
    id: crypto.randomUUID(),
    type,
    order: existing.sections.length,
    data: SECTION_DEFAULTS[type](),
  } as Section;
  return saveLandingPage({ sections: [...existing.sections, newSection] });
}

// ============================================================
// Public — render landing page by tenant slug (no auth)
// ============================================================

export async function getPublicLandingPage(slug: string): Promise<{
  page: LandingPage;
  tenant: { name: string; slug: string };
} | null> {
  const supabase = service();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, slug, plan, subscription_status')
    .eq('slug', slug)
    .maybeSingle();
  if (!tenant) return null;
  if (tenant.subscription_status === 'cancelled') return null;
  if (!PREMIUM_PLANS.includes(tenant.plan as string)) return null;

  const { data: page } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('is_published', true)
    .maybeSingle();
  if (!page) return null;
  return {
    page: hydrate(page),
    tenant: { name: tenant.name as string, slug: tenant.slug as string },
  };
}
