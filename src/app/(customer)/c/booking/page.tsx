'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarPlus, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { submitPublicBooking } from '@/lib/actions/bookings';
import type { DayAvailability } from '@/lib/actions/booking-config';

type AvailabilityResponse = {
  config: { online_booking_enabled: boolean } | null;
  days: DayAvailability[];
};

export default function BookingPage() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [tenantSlug, setTenantSlug] = useState('');
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loadingAvail, setLoadingAvail] = useState(true);
  const [bookingDisabled, setBookingDisabled] = useState(false);

  const [selectedDate, setSelectedDate] = useState('');

  // Resolve tenant slug from URL ?tenant=, env, or single-tenant fallback.
  useEffect(() => {
    const url = new URL(window.location.href);
    const slug = url.searchParams.get('tenant') || '';
    setTenantSlug(slug);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingAvail(true);
      try {
        const params = new URLSearchParams();
        if (tenantSlug) params.set('tenant', tenantSlug);
        params.set('days', '14');
        const res = await fetch(`/api/bookings/availability?${params}`);
        if (!res.ok) {
          // 404 or other — fall back to manual mode
          setBookingDisabled(false);
          setAvailability([]);
          return;
        }
        const data = (await res.json()) as AvailabilityResponse;
        if (cancelled) return;
        if (!data.config?.online_booking_enabled) {
          setBookingDisabled(true);
          setAvailability([]);
          return;
        }
        setAvailability(data.days);
        setBookingDisabled(false);
      } catch {
        // Ignore — let user submit and let server validate.
      } finally {
        if (!cancelled) setLoadingAvail(false);
      }
    }
    if (tenantSlug !== null) load();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  const selectedDay = availability.find((d) => d.date === selectedDate);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      tenantSlug: tenantSlug || undefined,
      customerName: String(fd.get('customer_name') || ''),
      customerPhone: String(fd.get('customer_phone') || ''),
      licensePlate: String(fd.get('license_plate') || ''),
      serviceType: String(fd.get('service_type') || ''),
      preferredDate: String(fd.get('preferred_date') || ''),
      preferredTime: String(fd.get('preferred_time') || ''),
      notes: String(fd.get('notes') || ''),
    };
    startTransition(async () => {
      const res = await submitPublicBooking(payload);
      if ('error' in res && res.error) {
        setError(res.error);
        return;
      }
      setDone(true);
    });
  };

  if (done) {
    return (
      <div className="space-y-5 p-4">
        <div className="flex items-center gap-3">
          <Link
            href="/c"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-bold">จองคิวซ่อม</h1>
        </div>
        <div className="flex flex-col items-center gap-4 rounded-xl border border-green-200 bg-green-50 p-8 text-center dark:border-green-900 dark:bg-green-950">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
          <div>
            <h2 className="text-xl font-bold text-green-700">จองคิวสำเร็จ!</h2>
            <p className="mt-1 text-sm text-green-700/80">ทางร้านจะติดต่อกลับเพื่อยืนยันโดยเร็วที่สุด</p>
          </div>
          <Link
            href="/c"
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  if (bookingDisabled) {
    return (
      <div className="space-y-5 p-4">
        <div className="flex items-center gap-3">
          <Link
            href="/c"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-bold">จองคิวซ่อม</h1>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900 dark:bg-amber-950">
          <AlertCircle className="h-10 w-10 text-amber-600" />
          <div>
            <h2 className="text-base font-bold text-amber-800">ขณะนี้ปิดรับการจองออนไลน์</h2>
            <p className="mt-1 text-xs text-amber-700">กรุณาติดต่อทางร้านโดยตรง</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center gap-3">
        <Link
          href="/c"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold">จองคิวซ่อม</h1>
          <p className="text-xs text-muted-foreground">เลือกวันและเวลาที่สะดวก</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            ชื่อ-นามสกุล <span className="text-red-500">*</span>
          </label>
          <input
            name="customer_name"
            type="text"
            required
            placeholder="กรอกชื่อ-นามสกุล"
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            เบอร์โทรศัพท์ <span className="text-red-500">*</span>
          </label>
          <input
            name="customer_phone"
            type="tel"
            required
            inputMode="tel"
            placeholder="0xx-xxx-xxxx"
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">ทะเบียนรถ</label>
          <input
            name="license_plate"
            type="text"
            placeholder="เช่น 1กข-1234"
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            ประเภทบริการ <span className="text-red-500">*</span>
          </label>
          <select name="service_type" required defaultValue="" className={inputCls}>
            <option value="" disabled>
              เลือกประเภทบริการ
            </option>
            <option value="maintenance">เช็คระยะ/บำรุงรักษา</option>
            <option value="repair">ซ่อมทั่วไป</option>
            <option value="body">ซ่อมตัวถัง/สี</option>
            <option value="electrical">ระบบไฟฟ้า</option>
            <option value="ac">แอร์</option>
            <option value="tire">ยาง/ล้อ</option>
            <option value="other">อื่นๆ</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            วันที่ต้องการ <span className="text-red-500">*</span>
          </label>
          {loadingAvail ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> กำลังโหลดวันว่าง...
            </div>
          ) : availability.length === 0 ? (
            <input
              type="date"
              name="preferred_date"
              required
              min={new Date().toISOString().slice(0, 10)}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={inputCls}
            />
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {availability.map((d) => {
                const isSelected = selectedDate === d.date;
                const date = new Date(d.date);
                const dow = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'][date.getDay()];
                const day = date.getDate();
                const monthLabel = date.toLocaleString('th-TH', { month: 'short' });
                const isFull = !d.closed && d.available <= 0;
                const disabled = d.closed || isFull;
                return (
                  <button
                    key={d.date}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedDate(d.date)}
                    className={`flex min-w-[64px] shrink-0 flex-col items-center rounded-lg border p-2 text-xs ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : disabled
                          ? 'border-border bg-muted/40 text-muted-foreground'
                          : 'border-border bg-card hover:border-primary'
                    }`}
                  >
                    <span className="text-[11px]">{dow}</span>
                    <span className="text-base font-bold">{day}</span>
                    <span className="text-[10px]">{monthLabel}</span>
                    {disabled ? (
                      <span className="text-[10px] text-red-600">
                        {d.closed ? 'ปิด' : 'เต็ม'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-600">
                        ว่าง {d.available}
                      </span>
                    )}
                  </button>
                );
              })}
              <input type="hidden" name="preferred_date" value={selectedDate} required />
            </div>
          )}
        </div>

        {selectedDay && !selectedDay.closed && selectedDay.slots.length > 0 && (
          <div>
            <label className="mb-1 block text-sm font-medium">
              เวลาที่สะดวก <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {selectedDay.slots.map((s) => {
                const disabled = s.available <= 0;
                return (
                  <label
                    key={s.time}
                    className={`flex cursor-pointer items-center justify-center rounded-lg border p-2 text-sm ${
                      disabled
                        ? 'cursor-not-allowed border-border bg-muted/40 text-muted-foreground'
                        : 'border-border bg-card hover:border-primary'
                    }`}
                  >
                    <input
                      type="radio"
                      name="preferred_time"
                      value={s.time}
                      disabled={disabled}
                      required
                      className="hidden"
                    />
                    <div className="text-center">
                      <div>{s.time}</div>
                      {disabled && <div className="text-[10px] text-red-600">เต็ม</div>}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {selectedDay && !selectedDay.closed && selectedDay.slots.length === 0 && (
          <div>
            <label className="mb-1 block text-sm font-medium">เวลาที่สะดวก</label>
            <input
              type="text"
              name="preferred_time"
              placeholder="ทั้งวัน (ระบุเพิ่มเติมในหมายเหตุ)"
              className={inputCls}
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">อาการ/รายละเอียดเพิ่มเติม</label>
          <textarea
            name="notes"
            rows={3}
            placeholder="อธิบายอาการหรือสิ่งที่ต้องการซ่อม..."
            className={`${inputCls} resize-none`}
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending || (!selectedDate && availability.length > 0)}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          <span className="flex items-center justify-center gap-2">
            <CalendarPlus className="h-4 w-4" />
            {pending ? 'กำลังส่ง...' : 'ยืนยันจองคิว'}
          </span>
        </button>
      </form>

      <div className="rounded-xl bg-muted/50 p-4">
        <p className="text-xs text-muted-foreground">
          หมายเหตุ: การจองคิวนี้เป็นการนัดหมายเบื้องต้น ทางร้านจะติดต่อกลับเพื่อยืนยันอีกครั้ง
        </p>
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary';
