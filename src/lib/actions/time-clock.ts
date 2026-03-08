'use server';

import { createClient } from '@/lib/supabase/server';

export async function clockIn(data?: { job_id?: string; notes?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!userData) throw new Error('User not found');

  // Check if already clocked in
  const { data: lastEntry } = await supabase
    .from('time_clock_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (lastEntry && (lastEntry.clock_type === 'clock_in' || lastEntry.clock_type === 'break_end')) {
    throw new Error('Already clocked in');
  }

  const { data: entry, error } = await supabase
    .from('time_clock_entries')
    .insert({
      tenant_id: userData.tenant_id,
      user_id: user.id,
      clock_type: 'clock_in',
      job_id: data?.job_id || null,
      notes: data?.notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  return entry;
}

export async function clockOut(data?: { notes?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!userData) throw new Error('User not found');

  const { data: entry, error } = await supabase
    .from('time_clock_entries')
    .insert({
      tenant_id: userData.tenant_id,
      user_id: user.id,
      clock_type: 'clock_out',
      notes: data?.notes || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Calculate and update daily summary
  await updateDailySummary(user.id, userData.tenant_id);

  return entry;
}

export async function startBreak(data?: { notes?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!userData) throw new Error('User not found');

  const { data: entry, error } = await supabase
    .from('time_clock_entries')
    .insert({
      tenant_id: userData.tenant_id,
      user_id: user.id,
      clock_type: 'break_start',
      notes: data?.notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  return entry;
}

export async function endBreak(data?: { notes?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!userData) throw new Error('User not found');

  const { data: entry, error } = await supabase
    .from('time_clock_entries')
    .insert({
      tenant_id: userData.tenant_id,
      user_id: user.id,
      clock_type: 'break_end',
      notes: data?.notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  return entry;
}

export async function getCurrentClockStatus() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: lastEntry } = await supabase
    .from('time_clock_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  // Get today's entries
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: todayEntries } = await supabase
    .from('time_clock_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('timestamp', today.toISOString())
    .order('timestamp', { ascending: true });

  // Get today's summary
  const dateStr = today.toISOString().split('T')[0];
  const { data: summary } = await supabase
    .from('time_clock_summaries')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', dateStr)
    .single();

  return {
    lastEntry,
    todayEntries: todayEntries || [],
    summary,
    isClockedIn: lastEntry && (lastEntry.clock_type === 'clock_in' || lastEntry.clock_type === 'break_end'),
    isOnBreak: lastEntry && lastEntry.clock_type === 'break_start',
  };
}

export async function getTimeClockEntries(filters?: { userId?: string; dateFrom?: string; dateTo?: string }) {
  const supabase = await createClient();
  let query = supabase
    .from('time_clock_entries')
    .select(`
      *,
      user:users(id, full_name, avatar_url),
      job:jobs(id, job_number)
    `)
    .order('timestamp', { ascending: false });

  if (filters?.userId) query = query.eq('user_id', filters.userId);
  if (filters?.dateFrom) query = query.gte('timestamp', filters.dateFrom);
  if (filters?.dateTo) query = query.lte('timestamp', filters.dateTo);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getTimeClockSummaries(filters?: { userId?: string; dateFrom?: string; dateTo?: string }) {
  const supabase = await createClient();
  let query = supabase
    .from('time_clock_summaries')
    .select(`
      *,
      user:users(id, full_name, avatar_url, role)
    `)
    .order('date', { ascending: false });

  if (filters?.userId) query = query.eq('user_id', filters.userId);
  if (filters?.dateFrom) query = query.gte('date', filters.dateFrom);
  if (filters?.dateTo) query = query.lte('date', filters.dateTo);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function updateDailySummary(userId: string, tenantId: string) {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateStr = today.toISOString().split('T')[0];

  const { data: entries } = await supabase
    .from('time_clock_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', today.toISOString())
    .order('timestamp', { ascending: true });

  if (!entries || entries.length === 0) return;

  let totalMs = 0;
  let breakMs = 0;
  let clockInTime: Date | null = null;
  let breakStartTime: Date | null = null;

  for (const entry of entries) {
    const ts = new Date(entry.timestamp);
    switch (entry.clock_type) {
      case 'clock_in':
        clockInTime = ts;
        break;
      case 'clock_out':
        if (clockInTime) {
          totalMs += ts.getTime() - clockInTime.getTime();
          clockInTime = null;
        }
        break;
      case 'break_start':
        breakStartTime = ts;
        break;
      case 'break_end':
        if (breakStartTime) {
          breakMs += ts.getTime() - breakStartTime.getTime();
          breakStartTime = null;
        }
        break;
    }
  }

  // If still clocked in, count until now
  if (clockInTime) {
    totalMs += Date.now() - clockInTime.getTime();
  }

  const totalHours = Math.round((totalMs / 3600000) * 100) / 100;
  const breakHours = Math.round((breakMs / 3600000) * 100) / 100;
  const productiveHours = Math.round((totalHours - breakHours) * 100) / 100;
  const overtimeHours = Math.max(0, Math.round((productiveHours - 8) * 100) / 100);

  // Get jobs completed today
  const { count: jobsCompleted } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('assigned_to', userId)
    .eq('status', 'completed')
    .gte('actual_completion', today.toISOString());

  // Upsert summary
  const { error } = await supabase
    .from('time_clock_summaries')
    .upsert({
      tenant_id: tenantId,
      user_id: userId,
      date: dateStr,
      total_hours: totalHours,
      break_hours: breakHours,
      productive_hours: productiveHours,
      jobs_completed: jobsCompleted || 0,
      overtime_hours: overtimeHours,
    }, { onConflict: 'tenant_id,user_id,date' });

  if (error) console.error('Failed to update daily summary:', error);
}
