'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { getUserInfo } from '@/lib/actions/auth-helpers';
import {
  type BookingConfig,
  parseBookingConfig,
  hoursForDate,
  generateTimeSlots,
  isDateWithinWindow,
} from '@/lib/booking/config';
import {
  type CustomerLineNotifyConfig,
  parseCustomerNotifyConfig,
} from '@/lib/notifications/customer-line';

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ============================================================
// Booking config
// ============================================================

export async function getBookingConfig(): Promise<BookingConfig | null> {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return null;
  const { data } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', userInfo.tenant_id)
    .single();
  return parseBookingConfig((data?.settings as Record<string, unknown>)?.booking);
}

export async function saveBookingConfig(config: BookingConfig) {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return { error: 'ไม่มีสิทธิ์' };
  if (!['owner', 'admin'].includes(userInfo.role)) return { error: 'ไม่มีสิทธิ์' };

  const { data: tenant } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', userInfo.tenant_id)
    .single();
  const prev = (tenant?.settings as Record<string, unknown>) || {};
  const next = { ...prev, booking: config };

  const { error } = await supabase
    .from('tenants')
    .update({ settings: next })
    .eq('id', userInfo.tenant_id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/settings/booking');
  revalidatePath('/c/booking');
  return { success: true };
}

// ============================================================
// Customer LINE notification config
// ============================================================

export async function getCustomerNotifyConfig(): Promise<CustomerLineNotifyConfig | null> {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return null;
  const { data } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', userInfo.tenant_id)
    .single();
  return parseCustomerNotifyConfig(
    (data?.settings as Record<string, unknown>)?.customer_line_notifications,
  );
}

export async function saveCustomerNotifyConfig(config: CustomerLineNotifyConfig) {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return { error: 'ไม่มีสิทธิ์' };
  if (!['owner', 'admin'].includes(userInfo.role)) return { error: 'ไม่มีสิทธิ์' };

  const { data: tenant } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', userInfo.tenant_id)
    .single();
  const prev = (tenant?.settings as Record<string, unknown>) || {};
  const next = { ...prev, customer_line_notifications: config };

  const { error } = await supabase
    .from('tenants')
    .update({ settings: next })
    .eq('id', userInfo.tenant_id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/settings/customer-notifications');
  return { success: true };
}

// ============================================================
// Public availability — used by /c/booking and LIFF page
// ============================================================

export interface DayAvailability {
  date: string;          // YYYY-MM-DD
  closed: boolean;
  reason?: string;
  totalCapacity: number;
  used: number;
  available: number;
  slots: Array<{
    time: string;        // HH:MM
    used: number;
    available: number;
  }>;
}

/**
 * Public availability — no auth. Looks up a tenant by slug then
 * computes booked counts for the requested date (default = today).
 */
export async function getBookingAvailability(
  tenantSlug: string,
  fromIso: string,
  days = 14,
): Promise<{
  config: BookingConfig | null;
  days: DayAvailability[];
} | { error: string }> {
  const supabase = service();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, settings, subscription_status')
    .eq('slug', tenantSlug)
    .maybeSingle();
  if (!tenant) return { error: 'ไม่พบร้านค้า' };
  if (tenant.subscription_status === 'cancelled' || tenant.subscription_status === 'past_due') {
    return { error: 'ร้านนี้ไม่เปิดให้จองในขณะนี้' };
  }
  const config = parseBookingConfig((tenant.settings as Record<string, unknown>)?.booking);
  if (!config.online_booking_enabled) {
    return { config, days: [] };
  }

  // Build the date range.
  const startDate = new Date(fromIso);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days);

  // Fetch existing bookings + jobs in the range in one go.
  const startIso = startDate.toISOString().slice(0, 10);
  const endIso = endDate.toISOString().slice(0, 10);

  const [{ data: bookings }, { data: jobs }] = await Promise.all([
    supabase
      .from('bookings')
      .select('preferred_date, preferred_time')
      .eq('tenant_id', tenant.id)
      .in('status', ['pending', 'confirmed'])
      .gte('preferred_date', startIso)
      .lt('preferred_date', endIso),
    supabase
      .from('jobs')
      .select('created_at')
      .eq('tenant_id', tenant.id)
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString()),
  ]);

  // Index by date.
  const bookedByDate = new Map<string, Map<string, number>>();
  for (const b of bookings || []) {
    const d = String(b.preferred_date);
    const t = (b.preferred_time as string) || 'all';
    if (!bookedByDate.has(d)) bookedByDate.set(d, new Map());
    const m = bookedByDate.get(d)!;
    m.set(t, (m.get(t) || 0) + 1);
  }
  const jobsByDate = new Map<string, number>();
  for (const j of jobs || []) {
    const d = new Date(j.created_at as string).toISOString().slice(0, 10);
    jobsByDate.set(d, (jobsByDate.get(d) || 0) + 1);
  }

  const out: DayAvailability[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const isoDate = d.toISOString().slice(0, 10);
    const window = isDateWithinWindow(config, d);
    if (!window.ok) {
      out.push({
        date: isoDate,
        closed: true,
        reason: window.reason,
        totalCapacity: 0,
        used: 0,
        available: 0,
        slots: [],
      });
      continue;
    }

    const { closed, hours, reason } = hoursForDate(config, d);
    if (closed || !hours) {
      out.push({
        date: isoDate,
        closed: true,
        reason: reason || 'ปิดทำการ',
        totalCapacity: 0,
        used: 0,
        available: 0,
        slots: [],
      });
      continue;
    }

    const dayBooked = bookedByDate.get(isoDate) || new Map();
    const dayBookedTotal = Array.from(dayBooked.values()).reduce((a, b) => a + b, 0);
    const dayWalkins = hours.include_walkins ? jobsByDate.get(isoDate) || 0 : 0;
    const used = dayBookedTotal + dayWalkins;
    const available = Math.max(0, hours.max_bookings - used);

    const slotKeys = generateTimeSlots(hours);
    const perSlotMax = slotKeys.length > 0
      ? Math.max(1, Math.floor(hours.max_bookings / slotKeys.length))
      : hours.max_bookings;
    const slots = slotKeys.map((time) => {
      const u = dayBooked.get(time) || 0;
      return { time, used: u, available: Math.max(0, perSlotMax - u) };
    });

    out.push({
      date: isoDate,
      closed: false,
      totalCapacity: hours.max_bookings,
      used,
      available,
      slots,
    });
  }

  return { config, days: out };
}
