'use client';

import { useState, useTransition } from 'react';
import { Plus, Camera, X, Building2 } from 'lucide-react';
import {
  createSupplierInvoice,
  recordSupplierPayment,
  cancelSupplierInvoice,
} from '@/lib/actions/accounts-payable';
import { uploadGenericPhoto } from '@/lib/actions/upload';

interface SupplierLite { id: string; name: string }
interface SupplierInvoice {
  id: string;
  invoice_number: string;
  reference: string | null;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  vat: number;
  total: number;
  amount_paid: number;
  status: string;
  notes: string | null;
  document_url: string | null;
  supplier: { id: string; name: string; phone: string | null } | null;
  purchase_order: { id: string; po_number: string } | null;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'รอชำระ', color: 'bg-amber-100 text-amber-700' },
  partial: { label: 'ชำระบางส่วน', color: 'bg-blue-100 text-blue-700' },
  paid: { label: 'ชำระแล้ว', color: 'bg-green-100 text-green-700' },
  overdue: { label: 'เกินกำหนด', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'ยกเลิก', color: 'bg-gray-100 text-gray-600' },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });

interface Props {
  invoices: SupplierInvoice[];
  suppliers: SupplierLite[];
  aging: { totalOutstanding: number; current: number; d30: number; d60: number; d90: number; over: number; count: number } | null;
}

export function ApPanel({ invoices: initial, suppliers, aging }: Props) {
  const [invoices, setInvoices] = useState(initial);
  const [showCreate, setShowCreate] = useState(false);
  const [payInvoice, setPayInvoice] = useState<SupplierInvoice | null>(null);
  const [filter, setFilter] = useState<string>('open');

  const filtered = invoices.filter((i) => {
    if (filter === 'open') return ['pending', 'partial', 'overdue'].includes(i.status);
    if (filter === 'all') return true;
    return i.status === filter;
  });

  return (
    <div className="space-y-4">
      {aging && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <AgingCard label="ยังไม่ครบกำหนด" value={aging.current} color="text-foreground" />
          <AgingCard label="1-30 วัน" value={aging.d30} color="text-amber-600" />
          <AgingCard label="31-60 วัน" value={aging.d60} color="text-orange-600" />
          <AgingCard label="61-90 วัน" value={aging.d90} color="text-red-600" />
          <AgingCard label=">90 วัน" value={aging.over} color="text-red-700" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {[
          { k: 'open', l: 'ค้างชำระ' },
          { k: 'pending', l: 'รอชำระ' },
          { k: 'partial', l: 'ชำระบางส่วน' },
          { k: 'overdue', l: 'เกินกำหนด' },
          { k: 'paid', l: 'ชำระแล้ว' },
          { k: 'all', l: 'ทั้งหมด' },
        ].map((t) => (
          <button
            key={t.k}
            type="button"
            onClick={() => setFilter(t.k)}
            className={`rounded-full border px-3 py-1 text-xs ${
              filter === t.k ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-muted'
            }`}
          >
            {t.l}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="ml-auto flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> เพิ่มใบแจ้งหนี้
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
              <th className="px-3 py-3 text-left">เลขที่</th>
              <th className="px-3 py-3 text-left">Supplier</th>
              <th className="px-3 py-3 text-left">วันที่</th>
              <th className="px-3 py-3 text-right">รวม</th>
              <th className="px-3 py-3 text-right">คงเหลือ</th>
              <th className="px-3 py-3 text-center">สถานะ</th>
              <th className="px-3 py-3 text-center">การกระทำ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  ไม่มีใบแจ้งหนี้
                </td>
              </tr>
            )}
            {filtered.map((inv) => {
              const s = statusConfig[inv.status] || { label: inv.status, color: 'bg-gray-100 text-gray-600' };
              const remaining = Number(inv.total) - Number(inv.amount_paid);
              const isOpen = ['pending', 'partial', 'overdue'].includes(inv.status);
              return (
                <tr key={inv.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-3 text-sm font-medium">
                    {inv.invoice_number}
                    {inv.purchase_order && (
                      <div className="text-[11px] text-muted-foreground">PO: {inv.purchase_order.po_number}</div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-sm">
                    <div className="font-medium">{inv.supplier?.name || '-'}</div>
                    {inv.supplier?.phone && (
                      <div className="text-[11px] text-muted-foreground">{inv.supplier.phone}</div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    <div>ออก: {formatDate(inv.invoice_date)}</div>
                    <div>ครบ: {formatDate(inv.due_date)}</div>
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-semibold">
                    ฿{Number(inv.total).toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-right text-sm">
                    {remaining > 0 ? (
                      <span className="font-semibold text-red-700">฿{remaining.toLocaleString()}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.color}`}>
                      {s.label}
                    </span>
                    {inv.document_url && (
                      <a
                        href={inv.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block text-[11px] text-primary underline"
                      >
                        ดูใบกำกับ
                      </a>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {isOpen && (
                      <button
                        type="button"
                        onClick={() => setPayInvoice(inv)}
                        className="rounded border border-primary px-2 py-1 text-xs text-primary hover:bg-primary/10"
                      >
                        บันทึกการจ่าย
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateApDialog
          suppliers={suppliers}
          onClose={() => setShowCreate(false)}
          onCreated={(inv) => {
            setInvoices((prev) => [inv, ...prev]);
            setShowCreate(false);
          }}
        />
      )}

      {payInvoice && (
        <PayApDialog
          invoice={payInvoice}
          onClose={() => setPayInvoice(null)}
          onPaid={(updated) => {
            setInvoices((prev) =>
              prev.map((i) => (i.id === payInvoice.id ? { ...i, ...updated } : i)),
            );
            setPayInvoice(null);
          }}
        />
      )}
    </div>
  );
}

function AgingCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`mt-1 font-bold ${color}`}>฿{value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
    </div>
  );
}

function CreateApDialog({
  suppliers,
  onClose,
  onCreated,
}: {
  suppliers: SupplierLite[];
  onClose: () => void;
  onCreated: (inv: SupplierInvoice) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const subtotal = Number(fd.get('subtotal')) || 0;
    const vat = Number(fd.get('vat')) || 0;
    const total = Number(fd.get('total')) || subtotal + vat;
    startTransition(async () => {
      let documentUrl: string | undefined;
      if (docFile) {
        const upFd = new FormData();
        upFd.append('file', docFile);
        upFd.append('bucket', 'payment-slips');
        upFd.append('folder', 'ap-documents');
        const up = await uploadGenericPhoto(upFd);
        if ('error' in up && up.error) {
          setError(up.error);
          return;
        }
        documentUrl = up.url;
      }
      const res = await createSupplierInvoice({
        supplierId: String(fd.get('supplier_id') || ''),
        invoiceNumber: String(fd.get('invoice_number') || ''),
        reference: String(fd.get('reference') || '') || undefined,
        invoiceDate: String(fd.get('invoice_date') || ''),
        dueDate: String(fd.get('due_date') || ''),
        subtotal,
        vat,
        total,
        notes: String(fd.get('notes') || '') || undefined,
        documentUrl,
      });
      if ('error' in res && res.error) {
        setError(res.error);
        return;
      }
      onCreated(res.invoice as SupplierInvoice);
    });
  };

  return (
    <Modal title="เพิ่มใบแจ้งหนี้จาก Supplier" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Supplier *">
          <select name="supplier_id" required className={inputClass}>
            <option value="">เลือก Supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="เลขที่ใบกำกับ *">
            <input name="invoice_number" required className={inputClass} />
          </Field>
          <Field label="อ้างอิงภายใน">
            <input name="reference" className={inputClass} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="วันที่ใบกำกับ *">
            <input type="date" name="invoice_date" required className={inputClass} />
          </Field>
          <Field label="วันครบกำหนด *">
            <input type="date" name="due_date" required className={inputClass} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="ยอดก่อน VAT">
            <input type="number" step="0.01" name="subtotal" className={inputClass} />
          </Field>
          <Field label="VAT">
            <input type="number" step="0.01" name="vat" className={inputClass} />
          </Field>
          <Field label="รวม *">
            <input type="number" step="0.01" name="total" required className={inputClass} />
          </Field>
        </div>
        <Field label="หมายเหตุ">
          <textarea name="notes" rows={2} className={inputClass} />
        </Field>
        <Field label="แนบรูปใบกำกับ (ถ้ามี)">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/20 p-2 hover:bg-muted/40">
            <Camera className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{docFile ? docFile.name : 'เลือกรูป'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setDocFile(e.target.files?.[0] || null)}
            />
          </label>
        </Field>
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {pending ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-sm">
            ยกเลิก
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PayApDialog({
  invoice,
  onClose,
  onPaid,
}: {
  invoice: SupplierInvoice;
  onClose: () => void;
  onPaid: (updated: Partial<SupplierInvoice>) => void;
}) {
  const remaining = Number(invoice.total) - Number(invoice.amount_paid);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const amount = Number(fd.get('amount')) || 0;
    if (amount <= 0) {
      setError('จำนวนเงินต้องมากกว่า 0');
      return;
    }
    if (amount > remaining + 0.01) {
      setError(`จำนวนเกินยอดคงเหลือ (฿${remaining.toLocaleString()})`);
      return;
    }
    startTransition(async () => {
      let slipUrl: string | undefined;
      if (slipFile) {
        const upFd = new FormData();
        upFd.append('file', slipFile);
        upFd.append('bucket', 'payment-slips');
        upFd.append('folder', `ap-payments/${invoice.id}`);
        const up = await uploadGenericPhoto(upFd);
        if ('error' in up && up.error) {
          setError(up.error);
          return;
        }
        slipUrl = up.url;
      }
      const res = await recordSupplierPayment({
        supplierInvoiceId: invoice.id,
        amount,
        paymentMethod: (String(fd.get('payment_method') || 'transfer')) as 'cash' | 'transfer' | 'credit_card' | 'promptpay',
        paidAt: String(fd.get('paid_at') || ''),
        reference: String(fd.get('reference') || '') || undefined,
        paymentSlipUrl: slipUrl,
      });
      if ('error' in res && res.error) {
        setError(res.error);
        return;
      }
      const newPaid = Number(invoice.amount_paid) + amount;
      const newStatus = remaining - amount <= 0.01 ? 'paid' : 'partial';
      onPaid({ amount_paid: newPaid, status: newStatus });
    });
  };

  return (
    <Modal title={`บันทึกการจ่าย — ${invoice.invoice_number}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <div className="flex justify-between">
            <span>ยอดรวม</span>
            <span>฿{Number(invoice.total).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>ชำระแล้ว</span>
            <span>฿{Number(invoice.amount_paid).toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-red-700">
            <span>คงเหลือ</span>
            <span>฿{remaining.toLocaleString()}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="วันที่จ่าย">
            <input type="date" name="paid_at" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
          </Field>
          <Field label="จำนวน *">
            <input
              type="number"
              step="0.01"
              name="amount"
              required
              defaultValue={remaining.toFixed(2)}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="วิธีชำระ">
          <select name="payment_method" defaultValue="transfer" className={inputClass}>
            <option value="cash">เงินสด</option>
            <option value="transfer">โอนธนาคาร</option>
            <option value="promptpay">PromptPay</option>
            <option value="credit_card">บัตรเครดิต</option>
          </select>
        </Field>
        <Field label="เลขอ้างอิง">
          <input name="reference" className={inputClass} placeholder="เลขสลิป / เช็ค" />
        </Field>
        <Field label="แนบสลิป">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/20 p-2 hover:bg-muted/40">
            <Camera className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{slipFile ? slipFile.name : 'เลือกรูป'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setSlipFile(e.target.files?.[0] || null)} />
          </label>
        </Field>
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {pending ? 'กำลังบันทึก...' : 'ยืนยันจ่าย'}
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-sm">
            ยกเลิก
          </button>
        </div>
      </form>
    </Modal>
  );
}

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium">{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-5 shadow-xl">
        <button type="button" onClick={onClose} className="absolute right-3 top-3 rounded-full p-1 hover:bg-muted">
          <X className="h-5 w-5" />
        </button>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <Building2 className="h-5 w-5 text-primary" />
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}
