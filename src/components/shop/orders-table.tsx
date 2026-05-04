'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, Phone } from 'lucide-react';
import { updateOrderStatus } from '@/lib/actions/shop';

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_method: string | null;
  payment_status: string;
  total: number;
  items: Array<{ name: string; quantity: number; total: number }>;
  shipping_address: { full_address?: string } | null;
  notes: string | null;
  created_at: string;
  customer: { name: string; phone: string } | null;
}

const STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'รอชำระ', color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'ยืนยันแล้ว', color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'กำลังจัด', color: 'bg-purple-100 text-purple-700' },
  shipped: { label: 'จัดส่งแล้ว', color: 'bg-cyan-100 text-cyan-700' },
  delivered: { label: 'ส่งถึงปลายทาง', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'ยกเลิก', color: 'bg-gray-100 text-gray-600' },
  refunded: { label: 'คืนเงิน', color: 'bg-red-100 text-red-700' },
};

const NEXT_STATUS: Record<string, { value: string; label: string }[]> = {
  pending: [
    { value: 'confirmed', label: 'ยืนยันรับชำระ' },
    { value: 'cancelled', label: 'ยกเลิก' },
  ],
  confirmed: [
    { value: 'processing', label: 'เริ่มจัดสินค้า' },
    { value: 'cancelled', label: 'ยกเลิก' },
  ],
  processing: [{ value: 'shipped', label: 'จัดส่งแล้ว' }],
  shipped: [{ value: 'delivered', label: 'ลูกค้ารับสินค้าแล้ว' }],
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

interface Props {
  initialOrders: Order[];
  initialStatus: string;
}

export function OrdersTable({ initialOrders, initialStatus }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState(initialStatus);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    if (filter === 'all') return true;
    return o.status === filter;
  });

  const updateStatus = (o: Order, status: string) => {
    if (!confirm(`เปลี่ยนสถานะเป็น "${STATUS[status]?.label || status}"?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await updateOrderStatus(
        o.id,
        status as 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded',
      );
      if ('error' in res && res.error) {
        setError(res.error);
        return;
      }
      setOrders((prev) =>
        prev.map((x) =>
          x.id === o.id
            ? {
                ...x,
                status,
                payment_status: status === 'shipped' || status === 'delivered' ? 'paid' : x.payment_status,
              }
            : x,
        ),
      );
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'all'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1 text-xs ${
              filter === s
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card hover:bg-muted'
            }`}
          >
            {s === 'all' ? 'ทั้งหมด' : STATUS[s]?.label || s}
          </button>
        ))}
      </div>

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
              <th className="px-3 py-3 text-left">เลขที่</th>
              <th className="px-3 py-3 text-left">ลูกค้า</th>
              <th className="px-3 py-3 text-left">สินค้า</th>
              <th className="px-3 py-3 text-right">ยอดรวม</th>
              <th className="px-3 py-3 text-center">สถานะ</th>
              <th className="px-3 py-3 text-center">การกระทำ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  ไม่มีคำสั่งซื้อในกลุ่มนี้
                </td>
              </tr>
            )}
            {filtered.map((o) => {
              const s = STATUS[o.status] || { label: o.status, color: 'bg-gray-100 text-gray-600' };
              const nexts = NEXT_STATUS[o.status] || [];
              return (
                <tr key={o.id} className="border-b border-border last:border-0 align-top">
                  <td className="px-3 py-3 text-sm">
                    <div className="font-mono font-semibold">{o.order_number}</div>
                    <div className="text-[11px] text-muted-foreground">{formatDate(o.created_at)}</div>
                  </td>
                  <td className="px-3 py-3 text-sm">
                    <div className="font-medium">{o.customer?.name || '-'}</div>
                    {o.customer?.phone && (
                      <a
                        href={`tel:${o.customer.phone}`}
                        className="flex items-center gap-1 text-[11px] text-primary"
                      >
                        <Phone className="h-3 w-3" />
                        {o.customer.phone}
                      </a>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {o.items.map((i, idx) => (
                      <div key={idx}>
                        {i.name} × {i.quantity}
                      </div>
                    ))}
                    {o.shipping_address?.full_address && (
                      <div className="mt-1 italic text-muted-foreground">
                        ส่ง: {o.shipping_address.full_address}
                      </div>
                    )}
                    {o.notes && (
                      <div className="mt-1 text-muted-foreground">📝 {o.notes}</div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-bold">
                    ฿{Number(o.total).toLocaleString()}
                    <div className="text-[11px] font-normal text-muted-foreground">
                      {o.payment_method || '-'}
                      {o.payment_status === 'paid' && (
                        <CheckCircle2 className="ml-1 inline h-3 w-3 text-emerald-600" />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${s.color}`}>
                      {s.label}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex flex-col items-stretch gap-1">
                      {nexts.map((n) => (
                        <button
                          key={n.value}
                          type="button"
                          disabled={pending}
                          onClick={() => updateStatus(o, n.value)}
                          className="rounded border border-border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                        >
                          {n.label}
                        </button>
                      ))}
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
