'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { getUserInfo } from '@/lib/actions/auth-helpers';
import {
  parseBookingConfig,
  hoursForDate,
  isDateWithinWindow,
  generateTimeSlots,
} from '@/lib/booking/config';
import { rateLimit } from '@/lib/security/rate-limit';

const SERVICE_TYPE_LABEL: Record<string, string> = {
  maintenance: 'เช็คระยะ/บำรุงรักษา',
  repair: 'ซ่อมทั่วไป',
  body: 'ซ่อมตัวถัง/สี',
  electrical: 'ระบบไฟฟ้า',
  ac: 'แอร์',
  tire: 'ยาง/ล้อ',
  other: 'อื่นๆ',
};

export interface CreateBookingInput {
  tenantSlug?: string;       // optional — for public form on tenant subdomain
  customerName: string;
  customerPhone: string;
  licensePlate?: string;
  serviceType: string;
  preferredDate: string;     // 'YYYY-MM-DD'
  preferredTime?: string;
  notes?: string;
}

function validate(input: CreateBookingInput): string | null {
  if (!input.customerName?.trim()) return 'กรุณากรอกชื่อ';
  if (!input.customerPhone?.trim()) return 'กรุณากรอกเบอร์โทรศัพท์';
  if (!/^[0-9+\-\s]{6,20}$/.test(input.customerPhone)) return 'รูปแบบเบอร์โทรไม่ถูกต้อง';
  if (!input.serviceType) return 'กรุณาเลือกประเภทบริการ';
  if (!SERVICE_TYPE_LABEL[input.serviceType]) return 'ประเภทบริการไม่ถูกต้อง';
  if (!input.preferredDate) return 'กรุณาเลือกวันที่';
  // Reject dates in the past beyond a 1-day buffer
  const d = new Date(input.preferredDate);
  if (Number.isNaN(d.getTime())) return 'วันที่ไม่ถูกต้อง';
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  if (d < todayMidnight) return 'ไม่สามารถจองคิวย้อนหลังได้';
  return null;
}

/**
 * Public booking action — no login required.
 *
 * Resolves the target tenant by slug (passed from a tenant subdomain).
 * If no slug is given, falls back to the first active tenant — useful for
 * single-tenant deployments. In production with custom domains, the slug
 * should always be supplied by middleware.
 */
export async function submitPublicBooking(input: CreateBookingInput) {
  const v = validate(input);
  if (v) return { error: v };

  // Per-phone rate limit: 5 submissions per hour. Stops drive-by spam
  // without blocking legitimate edits/retries.
  const rl = await rateLimit(
    'booking:phone',
    `${input.tenantSlug ?? 'default'}:${input.customerPhone}`,
    5,
    '1h',
  );
  if (!rl.ok) {
    return {
      error: `ส่งคำขอบ่อยเกินไป กรุณาลองใหม่ในอีก ${rl.retryAfter ?? 60} วินาที`,
    };
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Resolve tenant + load booking config in one query
  let tenantId: string | null = null;
  let tenantSettings: Record<string, unknown> | null = null;
  if (input.tenantSlug) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, settings, subscription_status')
      .eq('slug', input.tenantSlug)
      .maybeSingle();
    if (!tenant) return { error: 'ไม่พบร้านค้านี้' };
    if (tenant.subscription_status === 'cancelled') {
      return { error: 'ร้านนี้ปิดให้บริการชั่วคราว' };
    }
    tenantId = tenant.id as string;
    tenantSettings = (tenant.settings as Record<string, unknown>) || {};
  } else {
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, settings')
      .eq('subscription_status', 'active')
      .limit(1);
    if (!tenants || tenants.length === 0) {
      return { error: 'ไม่สามารถเชื่อมต่อกับร้านค้าได้' };
    }
    tenantId = tenants[0].id as string;
    tenantSettings = (tenants[0].settings as Record<string, unknown>) || {};
  }

  // Validate against shop's booking config
  const config = parseBookingConfig(tenantSettings.booking);
  if (!config.online_booking_enabled) {
    return { error: 'ร้านนี้ปิดรับการจองออนไลน์' };
  }

  const targetDate = new Date(input.preferredDate);
  const window = isDateWithinWindow(config, targetDate);
  if (!window.ok) return { error: window.reason || 'วันที่ไม่อยู่ในช่วงที่จองได้' };

  const dayInfo = hoursForDate(config, targetDate);
  if (dayInfo.closed || !dayInfo.hours) {
    return { error: dayInfo.reason || 'วันที่เลือกไม่เปิดให้จอง' };
  }

  // Validate time slot if shop uses slot-based booking
  const hours = dayInfo.hours;
  if (hours.slot_minutes > 0) {
    if (!input.preferredTime) {
      return { error: 'กรุณาเลือกเวลา' };
    }
    const allowed = generateTimeSlots(hours);
    if (!allowed.includes(input.preferredTime)) {
      return { error: 'เวลาที่เลือกไม่ตรงกับช่วงเวลาที่ร้านเปิด' };
    }
  }

  // Capacity check (counts pending+confirmed bookings; optionally walk-in jobs)
  const { count: dayBookings } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .in('status', ['pending', 'confirmed'])
    .eq('preferred_date', input.preferredDate);

  let walkins = 0;
  if (hours.include_walkins) {
    const startOfDay = `${input.preferredDate}T00:00:00.000Z`;
    const endOfDay = `${input.preferredDate}T23:59:59.999Z`;
    const { count } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);
    walkins = count || 0;
  }
  const totalUsed = (dayBookings || 0) + walkins;
  if (config.auto_close_when_full && totalUsed >= hours.max_bookings) {
    return { error: 'วันนี้คิวเต็มแล้ว กรุณาเลือกวันอื่น' };
  }

  // Per-slot capacity check
  if (hours.slot_minutes > 0 && input.preferredTime) {
    const slotCount = generateTimeSlots(hours).length || 1;
    const perSlotMax = Math.max(1, Math.floor(hours.max_bookings / slotCount));
    const { count: slotBookings } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .in('status', ['pending', 'confirmed'])
      .eq('preferred_date', input.preferredDate)
      .eq('preferred_time', input.preferredTime);
    if ((slotBookings || 0) >= perSlotMax) {
      return { error: 'ช่วงเวลานี้คิวเต็มแล้ว กรุณาเลือกเวลาอื่น' };
    }
  }

  // Try to match an existing customer by phone within the tenant
  let customerId: string | null = null;
  let vehicleId: string | null = null;
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('phone', input.customerPhone)
    .maybeSingle();
  if (existingCustomer) {
    customerId = existingCustomer.id as string;
    if (input.licensePlate) {
      const { data: existingVehicle } = await supabase
        .from('vehicles')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('customer_id', customerId)
        .eq('license_plate', input.licensePlate)
        .maybeSingle();
      if (existingVehicle) vehicleId = existingVehicle.id as string;
    }
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      tenant_id: tenantId,
      customer_id: customerId,
      vehicle_id: vehicleId,
      customer_name: input.customerName.trim(),
      customer_phone: input.customerPhone.trim(),
      license_plate: input.licensePlate?.trim() || null,
      service_type: input.serviceType,
      preferred_date: input.preferredDate,
      preferred_time: input.preferredTime || null,
      notes: input.notes?.trim() || null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error || !booking) {
    return { error: error?.message || 'ไม่สามารถส่งคำขอจองได้' };
  }

  revalidatePath('/dashboard/queue');
  return { success: true, bookingId: booking.id as string };
}

// ============================================================
// Staff-side booking management
// ============================================================

export async function listBookings(filter?: { status?: string; from?: string; to?: string }) {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return [];

  let q = supabase
    .from('bookings')
    .select('*')
    .eq('tenant_id', userInfo.tenant_id)
    .order('preferred_date', { ascending: true })
    .order('preferred_time', { ascending: true });

  if (filter?.status) q = q.eq('status', filter.status);
  if (filter?.from) q = q.gte('preferred_date', filter.from);
  if (filter?.to) q = q.lte('preferred_date', filter.to);

  const { data } = await q;
  return data || [];
}

export async function confirmBooking(bookingId: string) {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return { error: 'ไม่มีสิทธิ์' };

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', bookingId)
    .eq('tenant_id', userInfo.tenant_id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/queue');
  return { success: true };
}

export async function cancelBooking(bookingId: string, reason?: string) {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return { error: 'ไม่มีสิทธิ์' };

  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_reason: reason || null,
    })
    .eq('id', bookingId)
    .eq('tenant_id', userInfo.tenant_id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/queue');
  return { success: true };
}
