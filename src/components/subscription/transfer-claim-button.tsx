'use client';

import { useState } from 'react';
import { PaymentMethodModal } from './payment-method-modal';

interface PlatformPayment {
  promptpayId: string | null;
  promptpayName: string | null;
  bankName: string | null;
  bankAccount: string | null;
  acceptCreditCard: boolean;
}

interface Props {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  payment: PlatformPayment;
}

export function TransferClaimButton({ invoiceId, invoiceNumber, amount, payment }: Props) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return <span className="text-xs text-green-600">รอตรวจสอบ</span>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-primary px-2 py-1 text-xs text-primary hover:bg-primary/10"
      >
        ชำระเงิน
      </button>
      {open && (
        <PaymentMethodModal
          invoice={{ id: invoiceId, invoice_number: invoiceNumber, amount }}
          payment={payment}
          onClose={() => setOpen(false)}
          onSubmitted={() => {
            setOpen(false);
            setDone(true);
          }}
        />
      )}
    </>
  );
}
