/**
 * Per-tenant booking configuration. Stored as JSON inside
 * tenants.settings.booking; this module owns parsing, defaults,
 * and slot generation.
 */

export interface WeekdayHours {
  open: string;          // 'HH:MM'
  close: string;         // 'HH:MM'
  max_bookings: number;  // daily cap (counts both online + staff-created jobs if include_walkins=true)
  slot_minutes: number;  // 0 = whole-day (no time slots), positive = slot length
  include_walkins?: boolean;
}

export interface ExceptionDate {
  date: string;           // 'YYYY-MM-DD'
  closed?: boolean;
  max_bookings?: number;
  note?: string;
}

export interface BookingConfig {
  online_booking_enabled: boolean;
  weekday_hours: Partial<Record<'0' | '1' | '2' | '3' | '4' | '5' | '6', WeekdayHours | null>>;
  advance_booking_days: number;     // earliest day = today + N (0 = today allowed)
  max_advance_days: number;          // farthest day = today + N
  auto_close_when_full: boolean;
  advance_only: boolean;             // true = same-day NOT allowed regardless of advance_booking_days
  exception_dates: ExceptionDate[];
}

export const DEFAULT_BOOKING_CONFIG: BookingConfig = {
  online_booking_enabled: false,
  weekday_hours: {
    '0': null,
    '1': { open: '09:00', close: '17:00', max_bookings: 8, slot_minutes: 60 },
    '2': { open: '09:00', close: '17:00', max_bookings: 8, slot_minutes: 60 },
    '3': { open: '09:00', close: '17:00', max_bookings: 8, slot_minutes: 60 },
    '4': { open: '09:00', close: '17:00', max_bookings: 8, slot_minutes: 60 },
    '5': { open: '09:00', close: '17:00', max_bookings: 8, slot_minutes: 60 },
    '6': { open: '09:00', close: '15:00', max_bookings: 5, slot_minutes: 60 },
  },
  advance_booking_days: 0,
  max_advance_days: 30,
  auto_close_when_full: true,
  advance_only: false,
  exception_dates: [],
};

export function parseBookingConfig(raw: unknown): BookingConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_BOOKING_CONFIG;
  const r = raw as Partial<BookingConfig>;
  return {
    online_booking_enabled:
      r.online_booking_enabled ?? DEFAULT_BOOKING_CONFIG.online_booking_enabled,
    weekday_hours: { ...DEFAULT_BOOKING_CONFIG.weekday_hours, ...(r.weekday_hours || {}) },
    advance_booking_days: r.advance_booking_days ?? DEFAULT_BOOKING_CONFIG.advance_booking_days,
    max_advance_days: r.max_advance_days ?? DEFAULT_BOOKING_CONFIG.max_advance_days,
    auto_close_when_full:
      r.auto_close_when_full ?? DEFAULT_BOOKING_CONFIG.auto_close_when_full,
    advance_only: r.advance_only ?? DEFAULT_BOOKING_CONFIG.advance_only,
    exception_dates: Array.isArray(r.exception_dates) ? r.exception_dates : [],
  };
}

/** Returns the effective hours for a given date, taking exceptions into account. */
export function hoursForDate(
  config: BookingConfig,
  date: Date,
): { closed: boolean; hours: WeekdayHours | null; reason?: string; exception?: ExceptionDate } {
  const isoDate = date.toISOString().slice(0, 10);
  const exception = config.exception_dates.find((e) => e.date === isoDate);
  const dow = String(date.getDay()) as keyof typeof config.weekday_hours;
  const baseHours = config.weekday_hours[dow] || null;

  if (exception?.closed) {
    return { closed: true, hours: null, reason: exception.note || 'ปิดทำการ', exception };
  }
  if (!baseHours) {
    return { closed: true, hours: null, reason: 'ปิดทำการ' };
  }
  if (exception?.max_bookings != null) {
    return { closed: false, hours: { ...baseHours, max_bookings: exception.max_bookings }, exception };
  }
  return { closed: false, hours: baseHours };
}

/** Generates the candidate time slots for a date (as 'HH:MM' strings). */
export function generateTimeSlots(hours: WeekdayHours): string[] {
  if (!hours.slot_minutes || hours.slot_minutes <= 0) return [];
  const [oh, om] = hours.open.split(':').map(Number);
  const [ch, cm] = hours.close.split(':').map(Number);
  const start = oh * 60 + om;
  const end = ch * 60 + cm;
  if (Number.isNaN(start) || Number.isNaN(end) || start >= end) return [];
  const slots: string[] = [];
  for (let m = start; m + hours.slot_minutes <= end; m += hours.slot_minutes) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

/**
 * Returns whether the given date is within the booking window
 * (advance_booking_days ≤ today_offset ≤ max_advance_days).
 */
export function isDateWithinWindow(
  config: BookingConfig,
  date: Date,
): { ok: boolean; reason?: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const offsetDays = Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (offsetDays < 0) return { ok: false, reason: 'ไม่สามารถจองคิวย้อนหลังได้' };
  if (config.advance_only && offsetDays === 0) {
    return { ok: false, reason: 'ร้านนี้รับเฉพาะการจองล่วงหน้า' };
  }
  if (offsetDays < config.advance_booking_days) {
    return {
      ok: false,
      reason: `ต้องจองล่วงหน้าอย่างน้อย ${config.advance_booking_days} วัน`,
    };
  }
  if (offsetDays > config.max_advance_days) {
    return {
      ok: false,
      reason: `จองล่วงหน้าได้ไม่เกิน ${config.max_advance_days} วัน`,
    };
  }
  return { ok: true };
}
