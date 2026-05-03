'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarPlus, CheckCircle2 } from 'lucide-react';
import { submitPublicBooking } from '@/lib/actions/bookings';

export default function BookingPage() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
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
      <div className="p-4 space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/c" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted">
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

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/c" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold">จองคิวซ่อม</h1>
          <p className="text-xs text-muted-foreground">เลือกวันและเวลาที่สะดวก</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
          <input
            name="customer_name"
            type="text"
            required
            placeholder="กรอกชื่อ-นามสกุล"
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
          <input
            name="customer_phone"
            type="tel"
            required
            inputMode="tel"
            placeholder="0xx-xxx-xxxx"
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">ทะเบียนรถ</label>
          <input
            name="license_plate"
            type="text"
            placeholder="เช่น 1กข-1234"
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">ประเภทบริการ <span className="text-red-500">*</span></label>
          <select
            name="service_type"
            required
            defaultValue=""
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="" disabled>เลือกประเภทบริการ</option>
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
          <label className="block text-sm font-medium mb-1">วันที่ต้องการ <span className="text-red-500">*</span></label>
          <input
            name="preferred_date"
            type="date"
            required
            min={new Date().toISOString().slice(0, 10)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">เวลาที่สะดวก</label>
          <select
            name="preferred_time"
            defaultValue=""
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">ไม่ระบุ</option>
            <option value="08:00">08:00 - 09:00</option>
            <option value="09:00">09:00 - 10:00</option>
            <option value="10:00">10:00 - 11:00</option>
            <option value="11:00">11:00 - 12:00</option>
            <option value="13:00">13:00 - 14:00</option>
            <option value="14:00">14:00 - 15:00</option>
            <option value="15:00">15:00 - 16:00</option>
            <option value="16:00">16:00 - 17:00</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">อาการ/รายละเอียดเพิ่มเติม</label>
          <textarea
            name="notes"
            rows={3}
            placeholder="อธิบายอาการหรือสิ่งที่ต้องการซ่อม..."
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
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
