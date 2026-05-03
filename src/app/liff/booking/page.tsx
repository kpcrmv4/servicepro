'use client';

import { useEffect, useState, useTransition } from 'react';
import Script from 'next/script';
import {
  CalendarPlus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User as UserIcon,
} from 'lucide-react';
import { submitPublicBooking } from '@/lib/actions/bookings';
import type { DayAvailability } from '@/lib/actions/booking-config';
import { useBrand, brandStyle } from '@/components/branding/use-brand';

/**
 * LIFF booking page — opened from inside a tenant's LINE OA chat or
 * rich-menu. Reads the tenant slug from `?tenant=<slug>` (mandatory)
 * and uses the LIFF SDK to pre-fill the customer's name + phone (when
 * the LINE channel has shareTargetPicker scope, name is enough).
 *
 * The `liffId` is passed as `?liff=<id>` so the SAME page works for
 * every tenant — each tenant configures their own LIFF endpoint URL
 * with their own liffId in their LINE OA console.
 */

declare global {
  interface Window {
    liff?: {
      init: (config: { liffId: string }) => Promise<void>;
      isLoggedIn: () => boolean;
      login: () => void;
      getProfile: () => Promise<{ userId: string; displayName: string; pictureUrl?: string }>;
      isInClient: () => boolean;
      closeWindow?: () => void;
    };
  }
}

type AvailabilityResponse = {
  config: { online_booking_enabled: boolean } | null;
  days: DayAvailability[];
};

export default function LiffBookingPage() {
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const brand = useBrand(tenantSlug);
  const [liffId, setLiffId] = useState<string | null>(null);
  const [liffReady, setLiffReady] = useState(false);
  const [liffError, setLiffError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ displayName: string } | null>(null);

  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [bookingDisabled, setBookingDisabled] = useState(false);
  const [loadingAvail, setLoadingAvail] = useState(true);

  const [selectedDate, setSelectedDate] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Read params
  useEffect(() => {
    const u = new URL(window.location.href);
    setTenantSlug(u.searchParams.get('tenant'));
    setLiffId(u.searchParams.get('liff'));
  }, []);

  // Load availability
  useEffect(() => {
    if (!tenantSlug) return;
    let cancelled = false;
    (async () => {
      setLoadingAvail(true);
      try {
        const res = await fetch(`/api/bookings/availability?tenant=${tenantSlug}&days=14`);
        if (!res.ok) {
          setAvailability([]);
          return;
        }
        const data = (await res.json()) as AvailabilityResponse;
        if (cancelled) return;
        if (!data.config?.online_booking_enabled) {
          setBookingDisabled(true);
          return;
        }
        setAvailability(data.days);
      } finally {
        if (!cancelled) setLoadingAvail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  // Initialize LIFF after script loads
  const initLiff = async () => {
    if (!liffId || !window.liff) return;
    try {
      await window.liff.init({ liffId });
      setLiffReady(true);
      if (!window.liff.isLoggedIn()) {
        window.liff.login();
        return;
      }
      const p = await window.liff.getProfile();
      setProfile({ displayName: p.displayName });
    } catch (e) {
      setLiffError(e instanceof Error ? e.message : 'LIFF init failed');
    }
  };

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

  if (!tenantSlug) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
          ลิงก์ LIFF ไม่สมบูรณ์ — กรุณาเปิดจากเมนูใน LINE OA ของร้าน
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <CheckCircle2 className="h-16 w-16 text-green-600" />
        <h1 className="text-xl font-bold text-green-700">จองคิวสำเร็จ!</h1>
        <p className="text-center text-sm text-muted-foreground">
          ทางร้านจะติดต่อกลับเพื่อยืนยันโดยเร็วที่สุด
        </p>
        {window?.liff?.isInClient?.() && (
          <button
            type="button"
            onClick={() => window.liff?.closeWindow?.()}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            ปิดหน้าต่าง
          </button>
        )}
      </div>
    );
  }

  if (bookingDisabled) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-amber-600" />
          <h1 className="text-base font-bold text-amber-800">ขณะนี้ปิดรับการจองออนไลน์</h1>
          <p className="text-xs text-amber-700">กรุณาติดต่อทางร้านโดยตรง</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4" style={brandStyle(brand)}>
      {liffId && (
        <Script
          src="https://static.line-scdn.net/liff/edge/2/sdk.js"
          strategy="afterInteractive"
          onReady={() => {
            void initLiff();
          }}
        />
      )}

      <div>
        <h1 className="text-xl font-bold">จองคิวซ่อม</h1>
        <p className="text-xs text-muted-foreground">เลือกวันและเวลาที่สะดวก</p>
      </div>

      {profile && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <UserIcon className="h-4 w-4" />
          เข้าใช้งานในนาม {profile.displayName}
        </div>
      )}
      {liffError && !liffReady && liffId && (
        <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
          ไม่สามารถเชื่อมต่อ LINE Login ได้ กรุณากรอกข้อมูลด้วยตนเอง
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            ชื่อ-นามสกุล <span className="text-red-500">*</span>
          </label>
          <input
            name="customer_name"
            type="text"
            required
            defaultValue={profile?.displayName || ''}
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
                      <span className="text-[10px] text-red-600">{d.closed ? 'ปิด' : 'เต็ม'}</span>
                    ) : (
                      <span className="text-[10px] text-emerald-600">ว่าง {d.available}</span>
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

        <div>
          <label className="mb-1 block text-sm font-medium">หมายเหตุ</label>
          <textarea name="notes" rows={3} placeholder="อธิบายอาการเพิ่มเติม..." className={`${inputCls} resize-none`} />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
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
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary';
