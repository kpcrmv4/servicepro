'use client';

import { useState, useTransition } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Bell,
  Send,
} from 'lucide-react';
import {
  markInvoicePaid,
  cancelInvoice,
  sendRenewalLineNotification,
} from '@/lib/actions/subscription';

interface Invoice {
  id: string;
  invoice_number: string;
  plan: string;
  billing_cycle: string;
  amount: number;
  period_start: string;
  period_end: string;
  due_date: string;
  status: string;
  payment_method: string | null;
  payment_reference: string | null;
  payment_slip_url: string | null;
  paid_at: string | null;
  notes: string | null;
  notified_via_line_at: string | null;
  reminder_count: number;
  tenant: { id: string; name: string; slug: string; plan: string } | null;
}

interface Props {
  initialInvoices: Invoice[];
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'รอชำระ', color: 'bg-amber-100 text-amber-700', icon: Clock },
  sent: { label: 'แจ้งแล้ว', color: 'bg-blue-100 text-blue-700', icon: Send },
  paid: { label: 'ชำระแล้ว', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  cancelled: { label: 'ยกเลิก', color: 'bg-gray-100 text-gray-600', icon: XCircle },
  overdue: { label: 'เกินกำหนด', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

const methodLabel: Record<string, string> = {
  transfer: 'โอนธนาคาร',
  promptpay: 'PromptPay',
  credit_card: 'บัตรเครดิต',
};

export function InvoicesTable({ initialInvoices }: Props) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [filter, setFilter] = useState<string>('open');
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);

  const filtered = invoices.filter((i) => {
    if (filter === 'open') return ['pending', 'sent', 'overdue'].includes(i.status);
    if (filter === 'all') return true;
    return i.status === filter;
  });

  const handleMarkPaid = (inv: Invoice) => {
    const ref = window.prompt(
      `ยืนยันการชำระสำหรับ ${inv.invoice_number}\nกรอกเลขอ้างอิง (เช่น เลขสลิป):`,
      inv.payment_reference || '',
    );
    if (ref === null) return;
    setBusyId(inv.id);
    setError(null);
    startTransition(async () => {
      const res = await markInvoicePaid({
        invoiceId: inv.id,
        paymentMethod: 'transfer',
        paymentReference: ref || undefined,
      });
      setBusyId(null);
      if ('error' in res && res.error) {
        setError(res.error);
        return;
      }
      setInvoices((prev) =>
        prev.map((i) =>
          i.id === inv.id
            ? { ...i, status: 'paid', paid_at: new Date().toISOString(), payment_reference: ref || null }
            : i,
        ),
      );
    });
  };

  const handleCancel = (inv: Invoice) => {
    const reason = window.prompt(`ยกเลิก ${inv.invoice_number} — ระบุเหตุผล:`);
    if (reason === null) return;
    setBusyId(inv.id);
    setError(null);
    startTransition(async () => {
      const res = await cancelInvoice(inv.id, reason);
      setBusyId(null);
      if ('error' in res && res.error) {
        setError(res.error);
        return;
      }
      setInvoices((prev) =>
        prev.map((i) => (i.id === inv.id ? { ...i, status: 'cancelled', notes: reason } : i)),
      );
    });
  };

  const handleResend = (inv: Invoice) => {
    setBusyId(inv.id);
    setError(null);
    startTransition(async () => {
      const res = await sendRenewalLineNotification(inv.id);
      setBusyId(null);
      if (!res.ok) {
        setError(
          res.reason === 'no_owner_link'
            ? 'ร้านนี้ยังไม่ได้เชื่อมต่อ LINE'
            : res.reason === 'line_push_failed'
              ? `LINE push ล้มเหลว: ${(res as { error?: string }).error || 'unknown'}`
              : res.reason || 'ส่งไม่สำเร็จ',
        );
        return;
      }
      setInvoices((prev) =>
        prev.map((i) =>
          i.id === inv.id
            ? {
                ...i,
                status: i.status === 'pending' ? 'sent' : i.status,
                notified_via_line_at: new Date().toISOString(),
                reminder_count: i.reminder_count + 1,
              }
            : i,
        ),
      );
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          { k: 'open', l: 'ค้างชำระ' },
          { k: 'pending', l: 'รอชำระ' },
          { k: 'sent', l: 'แจ้งแล้ว' },
          { k: 'overdue', l: 'เกินกำหนด' },
          { k: 'paid', l: 'ชำระแล้ว' },
          { k: 'cancelled', l: 'ยกเลิก' },
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

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {slipPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSlipPreview(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slipPreview}
            alt="payment slip"
            className="max-h-full max-w-full rounded-lg"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[960px]">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
              <th className="px-4 py-3 text-left">เลขที่</th>
              <th className="px-4 py-3 text-left">ร้าน</th>
              <th className="px-4 py-3 text-left">แพลน</th>
              <th className="px-4 py-3 text-left">รอบบริการ</th>
              <th className="px-4 py-3 text-right">ยอด</th>
              <th className="px-4 py-3 text-center">สถานะ</th>
              <th className="px-4 py-3 text-center">LINE</th>
              <th className="px-4 py-3 text-center">การกระทำ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  ไม่มีใบแจ้งหนี้ในกลุ่มนี้
                </td>
              </tr>
            )}
            {filtered.map((inv) => {
              const s = statusConfig[inv.status] || { label: inv.status, color: 'bg-gray-100 text-gray-700', icon: Clock };
              const Icon = s.icon;
              const isOpen = ['pending', 'sent', 'overdue'].includes(inv.status);
              const busy = busyId === inv.id && pending;
              return (
                <tr key={inv.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-sm font-medium">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium">{inv.tenant?.name || '-'}</div>
                    <div className="text-xs text-muted-foreground">{inv.tenant?.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-sm capitalize">
                    {inv.plan}{' '}
                    <span className="text-xs text-muted-foreground">({inv.billing_cycle})</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <div>{formatDate(inv.period_start)}</div>
                    <div>→ {formatDate(inv.period_end)}</div>
                    <div className="mt-0.5 text-foreground">ครบกำหนด: {formatDate(inv.due_date)}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold">
                    ฿{Number(inv.amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.color}`}>
                      <Icon className="h-3 w-3" />
                      {s.label}
                    </span>
                    {inv.payment_method && (
                      <div className="mt-1 text-[11px] text-foreground">
                        {methodLabel[inv.payment_method] || inv.payment_method}
                      </div>
                    )}
                    {inv.payment_slip_url && (
                      <button
                        type="button"
                        onClick={() => setSlipPreview(inv.payment_slip_url)}
                        className="mt-1 text-[11px] text-primary underline"
                      >
                        ดูสลิป
                      </button>
                    )}
                    {inv.status === 'paid' && inv.paid_at && (
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {formatDate(inv.paid_at)}
                      </div>
                    )}
                    {inv.notes && (
                      <div className="mt-1 max-w-[180px] truncate text-[11px] text-muted-foreground" title={inv.notes}>
                        {inv.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                    {inv.notified_via_line_at ? (
                      <div>
                        <div className="text-green-600">ส่งแล้ว</div>
                        <div>{inv.reminder_count} ครั้ง</div>
                      </div>
                    ) : (
                      <span className="text-amber-600">ยังไม่ส่ง</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {isOpen && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleMarkPaid(inv)}
                            className="w-full rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            ✓ ยืนยันชำระ
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleResend(inv)}
                            className="flex w-full items-center justify-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                          >
                            <Bell className="h-3 w-3" /> แจ้งซ้ำ
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleCancel(inv)}
                            className="w-full rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            ยกเลิก
                          </button>
                        </>
                      )}
                      {inv.status === 'paid' && inv.payment_reference && (
                        <span className="text-[11px] text-muted-foreground">
                          ref: {inv.payment_reference}
                        </span>
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
