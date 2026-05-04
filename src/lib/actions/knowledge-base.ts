'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUserInfo } from '@/lib/actions/auth-helpers';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80) || `article-${Date.now()}`;
}

export interface KbArticleInput {
  id?: string;
  title: string;
  categoryId?: string;
  carMake?: string;
  carModel?: string;
  yearFrom?: number;
  yearTo?: number;
  summary?: string;
  bodyText: string;
  videoUrl?: string;
  tags?: string[];
  isPublished?: boolean;
}

export async function listKbArticles(filter?: {
  q?: string;
  carMake?: string;
  carModel?: string;
  categoryId?: string;
}) {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return [];

  let q = supabase
    .from('knowledge_base_articles')
    .select('id, title, slug, car_make, car_model, year_from, year_to, summary, view_count, tags, is_published, updated_at, category:knowledge_base_categories(id, name, slug)')
    .eq('tenant_id', userInfo.tenant_id)
    .eq('is_published', true)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (filter?.q) {
    // Simple ILIKE search over title/summary; full-text idx is set up
    // for more advanced queries later.
    q = q.or(`title.ilike.%${filter.q}%,summary.ilike.%${filter.q}%`);
  }
  if (filter?.carMake) q = q.eq('car_make', filter.carMake);
  if (filter?.carModel) q = q.eq('car_model', filter.carModel);
  if (filter?.categoryId) q = q.eq('category_id', filter.categoryId);

  const { data } = await q;
  return data || [];
}

export async function getKbArticleBySlug(slug: string) {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return null;

  const { data } = await supabase
    .from('knowledge_base_articles')
    .select('*, category:knowledge_base_categories(id, name, slug), author:users!knowledge_base_articles_created_by_fkey(id, full_name)')
    .eq('tenant_id', userInfo.tenant_id)
    .eq('slug', slug)
    .single();

  if (data) {
    // Fire-and-forget view count increment
    await supabase
      .from('knowledge_base_articles')
      .update({ view_count: Number(data.view_count) + 1 })
      .eq('id', data.id);
  }
  return data;
}

export async function listKbCategories() {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return [];
  const { data } = await supabase
    .from('knowledge_base_categories')
    .select('*')
    .eq('tenant_id', userInfo.tenant_id)
    .order('sort_order')
    .order('name');
  return data || [];
}

export async function createKbCategory(name: string, parentId?: string) {
  if (!name?.trim()) return { error: 'กรุณากรอกชื่อหมวด' };
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return { error: 'ไม่มีสิทธิ์' };
  const slug = slugify(name);
  const { data, error } = await supabase
    .from('knowledge_base_categories')
    .insert({
      tenant_id: userInfo.tenant_id,
      name: name.trim(),
      slug,
      parent_id: parentId || null,
    })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath('/dashboard/knowledge-base');
  return { success: true, category: data };
}

export async function saveKbArticle(input: KbArticleInput) {
  if (!input.title?.trim()) return { error: 'กรุณากรอกชื่อบทความ' };
  if (!input.bodyText?.trim()) return { error: 'กรุณากรอกเนื้อหา' };

  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return { error: 'ไม่มีสิทธิ์' };

  if (input.id) {
    const { data, error } = await supabase
      .from('knowledge_base_articles')
      .update({
        title: input.title.trim(),
        category_id: input.categoryId || null,
        car_make: input.carMake?.trim() || null,
        car_model: input.carModel?.trim() || null,
        year_from: input.yearFrom || null,
        year_to: input.yearTo || null,
        summary: input.summary?.trim() || null,
        body_text: input.bodyText,
        video_url: input.videoUrl?.trim() || null,
        tags: input.tags || [],
        is_published: input.isPublished ?? true,
      })
      .eq('id', input.id)
      .eq('tenant_id', userInfo.tenant_id)
      .select()
      .single();
    if (error) return { error: error.message };
    revalidatePath('/dashboard/knowledge-base');
    return { success: true, article: data };
  }

  // Slug uniqueness — append timestamp on conflict
  let slug = slugify(input.title);
  const { data: existing } = await supabase
    .from('knowledge_base_articles')
    .select('id')
    .eq('tenant_id', userInfo.tenant_id)
    .eq('slug', slug)
    .maybeSingle();
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const { data, error } = await supabase
    .from('knowledge_base_articles')
    .insert({
      tenant_id: userInfo.tenant_id,
      title: input.title.trim(),
      slug,
      category_id: input.categoryId || null,
      car_make: input.carMake?.trim() || null,
      car_model: input.carModel?.trim() || null,
      year_from: input.yearFrom || null,
      year_to: input.yearTo || null,
      summary: input.summary?.trim() || null,
      body_text: input.bodyText,
      video_url: input.videoUrl?.trim() || null,
      tags: input.tags || [],
      is_published: input.isPublished ?? true,
      created_by: userInfo.id,
    })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath('/dashboard/knowledge-base');
  return { success: true, article: data };
}

export async function deleteKbArticle(id: string) {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return { error: 'ไม่มีสิทธิ์' };
  const { error } = await supabase
    .from('knowledge_base_articles')
    .delete()
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/knowledge-base');
  return { success: true };
}
