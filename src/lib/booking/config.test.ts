import { describe, it, expect } from 'vitest';
import {
  parseBookingConfig,
  hoursForDate,
  generateTimeSlots,
  isDateWithinWindow,
  DEFAULT_BOOKING_CONFIG,
} from './config';

describe('booking/config', () => {
  it('falls back to defaults on null input', () => {
    expect(parseBookingConfig(null)).toEqual(DEFAULT_BOOKING_CONFIG);
    expect(parseBookingConfig(undefined)).toEqual(DEFAULT_BOOKING_CONFIG);
    expect(parseBookingConfig('not an object')).toEqual(DEFAULT_BOOKING_CONFIG);
  });

  it('preserves defaults when partial config given', () => {
    const cfg = parseBookingConfig({ online_booking_enabled: true });
    expect(cfg.online_booking_enabled).toBe(true);
    expect(cfg.advance_booking_days).toBe(0);
    expect(cfg.weekday_hours['1']).not.toBeNull();
  });

  it('reports closed when weekday hours are null', () => {
    const cfg = parseBookingConfig({});
    // Sunday default = closed
    const sunday = new Date('2026-01-04'); // a Sunday
    const r = hoursForDate(cfg, sunday);
    expect(r.closed).toBe(true);
  });

  it('honors exception_dates closed flag', () => {
    const cfg = parseBookingConfig({
      exception_dates: [{ date: '2026-12-31', closed: true, note: 'New Year Eve' }],
    });
    const d = new Date('2026-12-31T00:00:00');
    const r = hoursForDate(cfg, d);
    expect(r.closed).toBe(true);
    expect(r.reason).toBe('New Year Eve');
  });

  it('overrides max_bookings via exception_dates', () => {
    const cfg = parseBookingConfig({
      exception_dates: [{ date: '2026-12-25', max_bookings: 3 }],
    });
    const d = new Date('2026-12-25T00:00:00');
    const r = hoursForDate(cfg, d);
    expect(r.closed).toBe(false);
    expect(r.hours?.max_bookings).toBe(3);
  });

  it('generates evenly-spaced time slots', () => {
    const slots = generateTimeSlots({
      open: '09:00',
      close: '12:00',
      max_bookings: 6,
      slot_minutes: 60,
    });
    expect(slots).toEqual(['09:00', '10:00', '11:00']);
  });

  it('returns empty slots when slot_minutes is 0', () => {
    expect(
      generateTimeSlots({
        open: '09:00',
        close: '17:00',
        max_bookings: 8,
        slot_minutes: 0,
      }),
    ).toEqual([]);
  });

  it('rejects dates in the past', () => {
    const cfg = DEFAULT_BOOKING_CONFIG;
    const past = new Date();
    past.setDate(past.getDate() - 1);
    expect(isDateWithinWindow(cfg, past).ok).toBe(false);
  });

  it('blocks same-day when advance_only is set', () => {
    const cfg = parseBookingConfig({ advance_only: true });
    expect(isDateWithinWindow(cfg, new Date()).ok).toBe(false);
  });

  it('rejects beyond max_advance_days', () => {
    const cfg = parseBookingConfig({ max_advance_days: 7 });
    const far = new Date();
    far.setDate(far.getDate() + 30);
    expect(isDateWithinWindow(cfg, far).ok).toBe(false);
  });
});
