'use server';

import { createClient } from '@/lib/supabase/server';

export async function getServiceReminders(filters?: { status?: string; upcoming?: boolean }) {
  const supabase = await createClient();
  let query = supabase
    .from('service_reminders')
    .select(`
      *,
      vehicle:vehicles(id, license_plate, brand, model),
      customer:customers(id, name, phone, email),
      created_by_user:users!service_reminders_created_by_fkey(id, full_name)
    `)
    .order('trigger_date', { ascending: true });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.upcoming) {
    const now = new Date().toISOString().split('T')[0];
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    query = query.gte('trigger_date', now).lte('trigger_date', thirtyDaysLater).eq('status', 'pending');
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createServiceReminder(data: {
  vehicle_id: string;
  customer_id: string;
  reminder_type: string;
  trigger_date: string;
  trigger_mileage?: number;
  message_template?: string;
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

  const { data: reminder, error } = await supabase
    .from('service_reminders')
    .insert({
      ...data,
      tenant_id: userData.tenant_id,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return reminder;
}

export async function updateServiceReminder(id: string, data: {
  trigger_date?: string;
  trigger_mileage?: number;
  message_template?: string;
  status?: string;
  sent_at?: string;
  sent_via?: string;
}) {
  const supabase = await createClient();
  const { data: reminder, error } = await supabase
    .from('service_reminders')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return reminder;
}

export async function deleteServiceReminder(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('service_reminders')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function autoCreateRemindersForJob(jobId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!userData) throw new Error('User not found');

  const { data: job } = await supabase
    .from('jobs')
    .select(`
      *,
      vehicle:vehicles(id, current_mileage),
      customer:customers(id)
    `)
    .eq('id', jobId)
    .single();

  if (!job) throw new Error('Job not found');

  const reminders = [];

  // Oil change reminder (every 6 months or 10,000 km)
  if (job.type === 'maintenance') {
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    reminders.push({
      tenant_id: userData.tenant_id,
      vehicle_id: job.vehicle_id,
      customer_id: job.customer_id,
      reminder_type: 'เปลี่ยนถ่ายน้ำมันเครื่อง',
      trigger_date: sixMonthsLater.toISOString().split('T')[0],
      trigger_mileage: job.vehicle?.current_mileage ? job.vehicle.current_mileage + 10000 : null,
      message_template: 'สวัสดีครับ/ค่ะ {{customer_name}} รถ {{vehicle}} ของท่านครบกำหนดเปลี่ยนถ่ายน้ำมันเครื่องแล้วครับ',
      created_by: user.id,
    });
  }

  // General service reminder (every 12 months)
  const oneYearLater = new Date();
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  reminders.push({
    tenant_id: userData.tenant_id,
    vehicle_id: job.vehicle_id,
    customer_id: job.customer_id,
    reminder_type: 'ตรวจเช็คระยะประจำปี',
    trigger_date: oneYearLater.toISOString().split('T')[0],
    trigger_mileage: job.vehicle?.current_mileage ? job.vehicle.current_mileage + 20000 : null,
    message_template: 'สวัสดีครับ/ค่ะ {{customer_name}} รถ {{vehicle}} ของท่านครบกำหนดตรวจเช็คระยะประจำปีแล้วครับ',
    created_by: user.id,
  });

  if (reminders.length > 0) {
    const { data, error } = await supabase
      .from('service_reminders')
      .insert(reminders)
      .select();

    if (error) throw error;
    return data;
  }

  return [];
}

export async function getReminderStats() {
  const supabase = await createClient();

  const today = new Date().toISOString().split('T')[0];
  const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { count: overdue } = await supabase
    .from('service_reminders')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
    .lt('trigger_date', today);

  const { count: thisWeek } = await supabase
    .from('service_reminders')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
    .gte('trigger_date', today)
    .lte('trigger_date', sevenDays);

  const { count: thisMonth } = await supabase
    .from('service_reminders')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
    .gte('trigger_date', today)
    .lte('trigger_date', thirtyDays);

  const { count: sent } = await supabase
    .from('service_reminders')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'sent');

  return {
    overdue: overdue || 0,
    thisWeek: thisWeek || 0,
    thisMonth: thisMonth || 0,
    totalSent: sent || 0,
  };
}
