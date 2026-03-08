'use server';

import { createClient } from '@/lib/supabase/server';

export async function getInspections(filters?: { vehicleId?: string; jobId?: string; status?: string }) {
  const supabase = await createClient();
  let query = supabase
    .from('vehicle_inspections')
    .select(`
      *,
      vehicle:vehicles(id, license_plate, brand, model, customer:customers(id, name, phone)),
      inspector:users!vehicle_inspections_inspected_by_fkey(id, full_name),
      job:jobs(id, job_number),
      items:inspection_items(*)
    `)
    .order('created_at', { ascending: false });

  if (filters?.vehicleId) query = query.eq('vehicle_id', filters.vehicleId);
  if (filters?.jobId) query = query.eq('job_id', filters.jobId);
  if (filters?.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getInspection(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('vehicle_inspections')
    .select(`
      *,
      vehicle:vehicles(id, license_plate, brand, model, year, color, current_mileage, customer:customers(id, name, phone, email)),
      inspector:users!vehicle_inspections_inspected_by_fkey(id, full_name, avatar_url),
      job:jobs(id, job_number, status, description),
      items:inspection_items(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getInspectionByShareToken(token: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('vehicle_inspections')
    .select(`
      *,
      vehicle:vehicles(id, license_plate, brand, model, year, color),
      inspector:users!vehicle_inspections_inspected_by_fkey(id, full_name),
      items:inspection_items(*)
    `)
    .eq('share_token', token)
    .single();

  if (error) throw error;

  // Mark as viewed
  if (data && !data.customer_viewed_at) {
    await supabase
      .from('vehicle_inspections')
      .update({ customer_viewed_at: new Date().toISOString() })
      .eq('id', data.id);
  }

  return data;
}

export async function createInspection(data: {
  vehicle_id: string;
  job_id?: string;
  mileage_at_inspection?: number;
  notes?: string;
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

  const { data: inspection, error } = await supabase
    .from('vehicle_inspections')
    .insert({
      tenant_id: userData.tenant_id,
      vehicle_id: data.vehicle_id,
      job_id: data.job_id || null,
      inspected_by: user.id,
      mileage_at_inspection: data.mileage_at_inspection || null,
      notes: data.notes || null,
      status: 'draft',
    })
    .select()
    .single();

  if (error) throw error;
  return inspection;
}

export async function addInspectionItem(data: {
  inspection_id: string;
  category: string;
  item_name: string;
  condition: 'good' | 'fair' | 'poor';
  notes?: string;
  photo_url?: string;
  estimated_cost?: number;
  sort_order?: number;
}) {
  const supabase = await createClient();
  const { data: item, error } = await supabase
    .from('inspection_items')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return item;
}

export async function updateInspectionItem(id: string, data: {
  condition?: 'good' | 'fair' | 'poor';
  notes?: string;
  photo_url?: string;
  estimated_cost?: number;
  customer_approved?: boolean;
}) {
  const supabase = await createClient();
  const { data: item, error } = await supabase
    .from('inspection_items')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return item;
}

export async function deleteInspectionItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('inspection_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateInspectionStatus(id: string, status: string) {
  const supabase = await createClient();
  const updateData: Record<string, unknown> = { status };

  if (status === 'sent') {
    updateData.sent_to_customer_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('vehicle_inspections')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function bulkAddInspectionItems(inspectionId: string, items: Array<{
  category: string;
  item_name: string;
  condition: 'good' | 'fair' | 'poor';
  notes?: string;
  sort_order: number;
}>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inspection_items')
    .insert(items.map(item => ({ ...item, inspection_id: inspectionId })))
    .select();

  if (error) throw error;
  return data;
}

