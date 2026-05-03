'use client';

import { useState, useTransition } from 'react';
import { markInvoiceTransferClaimed } from '@/lib/actions/subscription';

interface Props {
  invoiceId: string;
}

export function TransferClaimButton({ invoiceId }: Props) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [reference, setReference] = useState('');
  const [showInput, setShowInput] = useState(false);

  const submit = () => {
    startTransition(async () => {
      const res = await markInvoiceTransferClaimed(invoiceId, reference || undefined);
      if (!('error' in res)) setDone(true);
    });
  };

  if (done) {
    return <span className="text-xs text-green-600">รอตรวจสอบ</span>;
  }

  if (!showInput) {
    return (
      <button
        type="button"
        onClick={() => setShowInput(true)}
        className="rounded border border-primary px-2 py-1 text-xs text-primary hover:bg-primary/10"
      >
        แจ้งโอนแล้ว
      </button>
    );
  }

  return (
    <div className="flex flex-col items-stretch gap-1">
      <input
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder="เลขอ้างอิง (ถ้ามี)"
        className="rounded border border-border bg-background px-2 py-1 text-xs"
      />
      <div className="flex gap-1">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="flex-1 rounded bg-primary px-2 py-1 text-xs text-primary-foreground"
        >
          {pending ? '...' : 'ส่ง'}
        </button>
        <button
          type="button"
          onClick={() => setShowInput(false)}
          className="rounded border border-border px-2 py-1 text-xs"
        >
          ยกเลิก
        </button>
      </div>
    </div>
  );
}
