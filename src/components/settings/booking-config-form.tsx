'use client';

import { useState, useTransition } from 'react';
import { Save, Plus, Trash2, Loader2 } from 'lucide-react';
import {
  type BookingConfig,
  type WeekdayHours,
  type ExceptionDate,
  DEFAULT_BOOKING_CONFIG,
} from '@/lib/booking/config';
import { saveBookingConfig } from '@/lib/actions/booking-config';

const WEEKDAYS = [
  { num: '0', label: 'อาทิตย์' },
  { num: '1', label: 'จันทร์' },
  { num: '2', label: 'อังคาร' },
  { num: '3', label: 'พุธ' },
  { num: '4', label: 'พฤหัสบดี' },
  { num: '5', label: 'ศุกร์' },
  { num: '6', label: 'เสาร์' },
] as const;

interface Props {
  initialConfig: BookingConfig | null;
}

export function BookingConfigForm({ initialConfig }: Props) {
  const [config, setConfig] = useState<BookingConfig>(initialConfig || DEFAULT_BOOKING_CONFIG);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const updateDay = (dow: string, partial: Partial<WeekdayHours> | null) => {
    setConfig((c) => {
      const existing = c.weekday_hours[dow as keyof typeof c.weekday_hours];
      if (partial === null) {
        return { ...c, weekday_hours: { ...c.weekday_hours, [dow]: null } };
      }
      const base: WeekdayHours = existing || {
        open: '09:00',
        close: '17:00',
        max_bookings: 8,
        slot_minutes: 60,
      };
      return {
        ...c,
        weekday_hours: { ...c.weekday_hours, [dow]: { ...base, ...partial } },
      };
    });
  };

  const addException = () => {
    setConfig((c) => ({
      ...c,
      exception_dates: [
        ...c.exception_dates,
        { date: new Date().toISOString().slice(0, 10), closed: true, note: '' },
      ],
    }));
  };

  const updateException = (idx: number, partial: Partial<ExceptionDate>) => {
    setConfig((c) => ({
      ...c,
      exception_dates: c.exception_dates.map((e, i) => (i === idx ? { ...e, ...partial } : e)),
    }));
  };

  const removeException = (idx: number) => {
    setConfig((c) => ({
      ...c,
      exception_dates: c.exception_dates.filter((_, i) => i !== idx),
    }));
  };

  const submit = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await saveBookingConfig(config);
      if ('error' in res && res.error) {
        setError(res.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={config.online_booking_enabled}
            onChange={(e) =>
              setConfig({ ...config, online_booking_enabled: e.target.checked })
            }
            className="mt-1 h-4 w-4"
          />
          <div>
            <div className="font-medium">เปิดรับการจองออนไลน์</div>
            <div className="text-xs text-muted-foreground">
              ปิดสวิตช์นี้เพื่อปิดฟอร์มจองทั้งหมดชั่วคราว
            </div>
          </div>
        </label>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-base font-semibold">วัน/เวลาเปิดทำการ</h2>
        <div className="space-y-2">
          {WEEKDAYS.map((d) => {
            const hours = config.weekday_hours[d.num as keyof typeof config.weekday_hours];
            const open = !!hours;
            return (
              <div key={d.num} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={open}
                      onChange={(e) => updateDay(d.num, e.target.checked ? {} : null)}
                      className="h-4 w-4"
                    />
                    <span className="w-20 font-medium">{d.label}</span>
                    {!open && (
                      <span className="text-xs text-muted-foreground">ปิดทำการ</span>
                    )}
                  </div>
                </div>
                {open && hours && (
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <label className="text-[11px] text-muted-foreground">เปิด</label>
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => updateDay(d.num, { open: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">ปิด</label>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => updateDay(d.num, { close: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">คิวสูงสุด/วัน</label>
                      <input
                        type="number"
                        min={1}
                        value={hours.max_bookings}
                        onChange={(e) =>
                          updateDay(d.num, { max_bookings: Number(e.target.value) || 1 })
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">
                        ความยาว/ช่วง (นาที, 0=ทั้งวัน)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={15}
                        value={hours.slot_minutes}
                        onChange={(e) =>
                          updateDay(d.num, { slot_minutes: Number(e.target.value) || 0 })
                        }
                        className={inputCls}
                      />
                    </div>
                    <label className="col-span-full flex items-center gap-2 pt-1 text-xs">
                      <input
                        type="checkbox"
                        checked={!!hours.include_walkins}
                        onChange={(e) =>
                          updateDay(d.num, { include_walkins: e.target.checked })
                        }
                      />
                      นับงาน Walk-in (สร้างหน้าร้าน) เข้าโควตาด้วย
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium">จองล่วงหน้าอย่างน้อย (วัน)</label>
          <input
            type="number"
            min={0}
            value={config.advance_booking_days}
            onChange={(e) =>
              setConfig({ ...config, advance_booking_days: Number(e.target.value) || 0 })
            }
            className={inputCls}
          />
          <div className="mt-1 text-[11px] text-muted-foreground">
            0 = อนุญาตให้จองวันเดียวกันได้
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">จองล่วงหน้าได้สูงสุด (วัน)</label>
          <input
            type="number"
            min={1}
            value={config.max_advance_days}
            onChange={(e) =>
              setConfig({ ...config, max_advance_days: Number(e.target.value) || 30 })
            }
            className={inputCls}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.auto_close_when_full}
            onChange={(e) => setConfig({ ...config, auto_close_when_full: e.target.checked })}
          />
          ปิดรับจองอัตโนมัติเมื่อคิวเต็ม
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.advance_only}
            onChange={(e) => setConfig({ ...config, advance_only: e.target.checked })}
          />
          รับเฉพาะการจองล่วงหน้า (ไม่รับวันเดียวกัน)
        </label>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">วันพิเศษ / ปิดทำการ</h2>
          <button
            type="button"
            onClick={addException}
            className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" />
            เพิ่ม
          </button>
        </div>
        {config.exception_dates.length === 0 && (
          <p className="text-xs text-muted-foreground">
            (ไม่มี — ใช้ตารางมาตรฐานในแต่ละวันของสัปดาห์)
          </p>
        )}
        <ul className="space-y-2">
          {config.exception_dates.map((ex, idx) => (
            <li key={idx} className="flex flex-wrap items-center gap-2 rounded border border-border p-2">
              <input
                type="date"
                value={ex.date}
                onChange={(e) => updateException(idx, { date: e.target.value })}
                className={`${inputCls} w-auto`}
              />
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={!!ex.closed}
                  onChange={(e) => updateException(idx, { closed: e.target.checked })}
                />
                ปิดทำการ
              </label>
              {!ex.closed && (
                <input
                  type="number"
                  min={0}
                  placeholder="คิวสูงสุด"
                  value={ex.max_bookings ?? ''}
                  onChange={(e) =>
                    updateException(idx, {
                      max_bookings: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className={`${inputCls} w-28`}
                />
              )}
              <input
                type="text"
                placeholder="หมายเหตุ"
                value={ex.note || ''}
                onChange={(e) => updateException(idx, { note: e.target.value })}
                className={`${inputCls} flex-1 min-w-[140px]`}
              />
              <button
                type="button"
                onClick={() => removeException(idx)}
                className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {pending ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
        {saved && <span className="text-sm text-green-600">บันทึกแล้ว ✓</span>}
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary';
