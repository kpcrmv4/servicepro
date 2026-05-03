'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import {
  X,
  Copy,
  Check,
  Camera,
  CreditCard,
  Smartphone,
  Building2,
  Loader2,
} from 'lucide-react';
import { markInvoiceTransferClaimed } from '@/lib/actions/subscription';
import { uploadGenericPhoto } from '@/lib/actions/upload';
import { getPromptPayQrUrl } from '@/lib/payment/promptpay';

interface PlatformPayment {
  promptpayId: string | null;
  promptpayName: string | null;
  bankName: string | null;
  bankAccount: string | null;
  acceptCreditCard: boolean;
}

interface InvoiceLite {
  id: string;
  invoice_number: string;
  amount: number;
}

interface Props {
  invoice: InvoiceLite;
  payment: PlatformPayment;
  onClose: () => void;
  onSubmitted: () => void;
}

type Method = 'promptpay' | 'transfer' | 'credit_card';

export function PaymentMethodModal({ invoice, payment, onClose, onSubmitted }: Props) {
  const initial: Method = payment.promptpayId
    ? 'promptpay'
    : payment.bankAccount
      ? 'transfer'
      : 'credit_card';
  const [method, setMethod] = useState<Method>(initial);
  const [reference, setReference] = useState('');
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSlip = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setError('ไฟล์ใหญ่เกิน 5MB');
      return;
    }
    setSlipFile(f);
    setSlipPreview(URL.createObjectURL(f));
    setError(null);
  };

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const submit = () => {
    setError(null);
    if (!slipFile && method !== 'credit_card') {
      setError('กรุณาแนบรูปสลิปการโอนเงิน');
      return;
    }
    if (method === 'credit_card' && !slipFile && !reference) {
      setError('กรุณาแนบรูปสลิปบัตรเครดิต หรือกรอกเลขอ้างอิง');
      return;
    }
    startTransition(async () => {
      let slipUrl: string | undefined;
      if (slipFile) {
        const fd = new FormData();
        fd.append('file', slipFile);
        fd.append('bucket', 'payment-slips');
        fd.append('folder', `subscription/${invoice.id}`);
        const up = await uploadGenericPhoto(fd);
        if ('error' in up && up.error) {
          setError(up.error);
          return;
        }
        slipUrl = up.url;
      }
      const res = await markInvoiceTransferClaimed({
        invoiceId: invoice.id,
        paymentMethod: method,
        paymentReference: reference || undefined,
        paymentSlipUrl: slipUrl,
      });
      if ('error' in res && res.error) {
        setError(res.error);
        return;
      }
      onSubmitted();
    });
  };

  const qrUrl = payment.promptpayId
    ? getPromptPayQrUrl(payment.promptpayId, invoice.amount)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-card p-5 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="mb-1 text-lg font-bold">ชำระเงินใบแจ้งหนี้</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          {invoice.invoice_number} · ยอด ฿{invoice.amount.toLocaleString()}
        </p>

        {/* Method tabs */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {payment.promptpayId && (
            <MethodTab
              active={method === 'promptpay'}
              onClick={() => setMethod('promptpay')}
              icon={Smartphone}
              label="PromptPay"
            />
          )}
          {payment.bankAccount && (
            <MethodTab
              active={method === 'transfer'}
              onClick={() => setMethod('transfer')}
              icon={Building2}
              label="โอนธนาคาร"
            />
          )}
          {payment.acceptCreditCard && (
            <MethodTab
              active={method === 'credit_card'}
              onClick={() => setMethod('credit_card')}
              icon={CreditCard}
              label="บัตรเครดิต"
            />
          )}
        </div>

        {/* Method content */}
        {method === 'promptpay' && qrUrl && (
          <div className="mb-4 space-y-3 rounded-lg border border-border bg-muted/30 p-4 text-center">
            <div className="text-xs text-muted-foreground">สแกนชำระผ่าน PromptPay</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="PromptPay QR"
              className="mx-auto h-56 w-56 rounded-lg border border-border bg-white p-2"
            />
            <div className="text-sm">
              <div className="font-semibold">{payment.promptpayName || 'KPServicePro'}</div>
              <div className="text-muted-foreground">{payment.promptpayId}</div>
              <div className="mt-1 text-lg font-bold text-primary">
                ฿{invoice.amount.toLocaleString()}
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground">
              QR สร้างโดย promptpay.io
            </div>
          </div>
        )}

        {method === 'transfer' && payment.bankAccount && (
          <div className="mb-4 space-y-2 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">ธนาคาร</span>
              <span className="font-medium">{payment.bankName || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">เลขบัญชี</span>
              <button
                type="button"
                onClick={() => copy(payment.bankAccount!, 'acct')}
                className="flex items-center gap-1 font-mono font-semibold hover:text-primary"
              >
                {payment.bankAccount}
                {copied === 'acct' ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">ชื่อบัญชี</span>
              <span className="text-right">{payment.promptpayName || '-'}</span>
            </div>
            <div className="border-t border-border pt-2">
              <div className="flex items-center justify-between font-bold">
                <span>ยอดที่ต้องโอน</span>
                <button
                  type="button"
                  onClick={() => copy(String(invoice.amount), 'amt')}
                  className="flex items-center gap-1 text-primary"
                >
                  ฿{invoice.amount.toLocaleString()}
                  {copied === 'amt' ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {method === 'credit_card' && (
          <div className="mb-4 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <p className="text-muted-foreground">
              หากต้องการชำระด้วยบัตรเครดิต กรุณาติดต่อทีม KPServicePro โดยตรง
              ทีมงานจะแจ้งขั้นตอนการรูดบัตรและให้คุณแนบรูปสลิป/อัปโหลดเลขอ้างอิงไว้ที่นี่
            </p>
          </div>
        )}

        {/* Reference + Slip upload */}
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium">เลขอ้างอิง / Slip ID</label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="เช่น 20260503-XYZ123"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">
              แนบรูปสลิป {method !== 'credit_card' && <span className="text-red-500">*</span>}
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/20 p-3 hover:bg-muted/40">
              <Camera className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {slipFile ? slipFile.name : 'เลือกรูปสลิป (สูงสุด 5MB)'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleSlip}
                className="hidden"
              />
            </label>
            {slipPreview && (
              <div className="mt-2">
                <Image
                  src={slipPreview}
                  alt="slip preview"
                  width={400}
                  height={400}
                  unoptimized
                  className="max-h-48 w-auto rounded-lg border border-border"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? 'กำลังส่ง...' : 'แจ้งชำระเงิน'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MethodTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof CreditCard;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-lg border p-2.5 text-xs ${
        active
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-border bg-card hover:bg-muted'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
