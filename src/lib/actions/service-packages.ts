'use server';

import { createClient } from '@/lib/supabase/server';

export async function getServicePackages(filters?: { category?: string; isActive?: boolean }) {
  const supabase = await createClient();
  let query = supabase
    .from('service_packages')
    .select(`
      *,
      items:service_package_items(*)
    `)
    .order('sort_order')
    .order('name');

  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.isActive !== undefined) query = query.eq('is_active', filters.isActive);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getServicePackage(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('service_packages')
    .select(`
      *,
      items:service_package_items(
        *,
        part:parts(id, name, part_number, selling_price)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createServicePackage(data: {
  name: string;
  description?: string;
  category?: string;
  compatible_brands?: string[];
  compatible_models?: string[];
  estimated_duration_minutes?: number;
  base_price: number;
  is_popular?: boolean;
  items?: Array<{
    type: string;
    part_id?: string;
    description: string;
    quantity: number;
    unit_price: number;
    is_optional?: boolean;
    sort_order?: number;
  }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!userData) throw new Error('User not found');

  const { items, ...packageData } = data;

  const { data: pkg, error } = await supabase
    .from('service_packages')
    .insert({ ...packageData, tenant_id: userData.tenant_id })
    .select()
    .single();

  if (error) throw error;

  if (items && items.length > 0) {
    const { error: itemsError } = await supabase
      .from('service_package_items')
      .insert(items.map((item, idx) => ({
        ...item,
        package_id: pkg.id,
        sort_order: item.sort_order ?? idx,
      })));

    if (itemsError) throw itemsError;
  }

  return pkg;
}

export async function updateServicePackage(id: string, data: {
  name?: string;
  description?: string;
  category?: string;
  compatible_brands?: string[];
  compatible_models?: string[];
  estimated_duration_minutes?: number;
  base_price?: number;
  is_popular?: boolean;
  is_active?: boolean;
  sort_order?: number;
}) {
  const supabase = await createClient();
  const { data: pkg, error } = await supabase
    .from('service_packages')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return pkg;
}

export async function deleteServicePackage(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('service_packages')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getPackageCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('service_packages')
    .select('category')
    .not('category', 'is', null);

  if (error) throw error;

  const categories = [...new Set((data || []).map(d => d.category).filter(Boolean))];
  return categories as string[];
}
