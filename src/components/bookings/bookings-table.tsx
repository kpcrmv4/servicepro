'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Phone, Car, Clock, Check, X, Wrench } from 'lucide-react';
import { confirmBooking, cancelBooking } from '@/lib/actions/bookings';

interface Booking {
  id: string;
  customer_name: string;
  customer_phone: string;
  license_plate: string | null;
  service_type: string;
  preferred_date: string;
  preferred_time: string | null;
  notes: string | null;
  status: string;
  customer_id: string | null;
  vehicle_id: string | null;
  job_id: string | null;
  created_at: string;
}

const SERVICE_TYPE_LABEL: Record<string, string> = {
  maintenance: 'เช็คระยะ',
  repair: 'ซ่อมทั่วไป',
  body: 'ซ่อมตัวถัง/สี',
  electrical: 'ระบบไฟฟ้า',
  ac: 'แอร์',
  tire: 'ยาง/ล้อ',
  other: 'อื่นๆ',
};

const STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'รอยืนยัน', color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'ยืนยันแล้ว', color: 'bg-blue-100 text-blue-700' },
  arrived: { label: 'ลูกค้ามาถึงแล้ว', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'ยกเลิก', color: 'bg-gray-100 text-gray-600' },
  no_show: { label: 'ไม่มาตามนัด', color: 'bg-red-100 text-red-700' },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });

interface Props {
  initialBookings: Booking[];
  initialStatus: string;
}

export function BookingsTable({ initialBookings, initialStatus }: Props) {
  const [bookings, setBookings] = useState(initialBookings);
  const [filter, setFilter] = useState(initialStatus);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = bookings.filter((b) => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  const confirm = (b: Booking) => {
    setBusyId(b.id);
    setError(null);
    startTransition(async () => {
      const res = await confirmBooking(b.id);
      setBusyId(null);
      if ('error' in res && res.error) {
        setError(res.error);
        return;
      }
      setBookings((prev) =>
        prev.map((x) =>
          x.id === b.id ? { ...x, status: 'confirmed' } : x,
        ),
      );
    });
  };

  const cancel = (b: Booking) => {
    const reason = window.prompt(`ยกเลิกคิว ${b.customer_name} — ระบุเหตุผล:`);
    if (reason === null) return;
    setBusyId(b.id);
    setError(null);
    startTransition(async () => {
      const res = await cancelBooking(b.id, reason);
      setBusyId(null);
      if ('error' in res && res.error) {
        setError(res.error);
        return;
      }
      setBookings((prev) =>
        prev.map((x) => (x.id === b.id ? { ...x, status: 'cancelled' } : x)),
      );
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          { k: 'pending', l: 'รอยืนยัน' },
          { k: 'confirmed', l: 'ยืนยันแล้ว' },
          { k: 'arrived', l: 'มาถึงแล้ว' },
          { k: 'cancelled', l: 'ยกเลิก' },
          { k: 'no_show', l: 'ไม่มา' },
          { k: 'all', l: 'ทั้งหมด' },
        ].map((t) => (
          <button
            key={t.k}
            type="button"
            onClick={() => setFilter(t.k)}
            className={`rounded-full border px-3 py-1 text-xs ${
              filter === t.k
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card hover:bg-muted'
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
              <th className="px-3 py-3 text-left">วัน/เวลา</th>
              <th className="px-3 py-3 text-left">ลูกค้า</th>
              <th className="px-3 py-3 text-left">รถ / บริการ</th>
              <th className="px-3 py-3 text-left">หมายเหตุ</th>
              <th className="px-3 py-3 text-center">สถานะ</th>
              <th className="px-3 py-3 text-center">การกระทำ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  ไม่มีคิวในกลุ่มนี้
                </td>
              </tr>
            )}
            {filtered.map((b) => {
              const s = STATUS[b.status] || { label: b.status, color: 'bg-gray-100 text-gray-600' };
              const isOpen = ['pending', 'confirmed'].includes(b.status);
              return (
                <tr key={b.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-3 text-sm">
                    <div className="font-semibold">{formatDate(b.preferred_date)}</div>
                    {b.preferred_time && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {b.preferred_time}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-sm">
                    <div className="font-medium">{b.customer_name}</div>
                    <a
                      href={`tel:${b.customer_phone}`}
                      className="flex items-center gap-1 text-xs text-primary"
                    >
                      <Phone className="h-3 w-3" />
                      {b.customer_phone}
                    </a>
                    {b.customer_id && (
                      <span className="text-[11px] text-muted-foreground">(ลูกค้าเดิม)</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-sm">
                    {b.license_plate && (
                      <div className="flex items-center gap-1 font-medium">
                        <Car className="h-3.5 w-3.5 text-muted-foreground" />
                        {b.license_plate}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {SERVICE_TYPE_LABEL[b.service_type] || b.service_type}
                    </div>
                  </td>
                  <td className="px-3 py-3 max-w-xs text-xs text-muted-foreground">
                    {b.notes || '-'}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${s.color}`}>
                      {s.label}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {isOpen && (
                        <>
                          {b.status === 'pending' && (
                            <button
                              type="button"
                              disabled={busyId === b.id && pending}
                              onClick={() => confirm(b)}
                              className="flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                            >
                              <Check className="h-3 w-3" /> ยืนยัน
                            </button>
                          )}
                          {b.job_id ? (
                            <Link
                              href={`/dashboard/jobs/${b.job_id}`}
                              className="flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700"
                            >
                              <Wrench className="h-3 w-3" /> เปิดงาน
                            </Link>
                          ) : (
                            <Link
                              href={`/dashboard/reception/new?from_booking=${b.id}`}
                              className="flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700"
                            >
                              <Wrench className="h-3 w-3" /> รับรถ
                            </Link>
                          )}
                          <button
                            type="button"
                            disabled={busyId === b.id && pending}
                            onClick={() => cancel(b)}
                            className="flex items-center gap-1 rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" /> ยกเลิก
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
