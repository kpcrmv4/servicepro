'use client';

import { useState, useTransition } from 'react';
import { AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { respondAdditionalWork } from '@/lib/actions/additional-work';

interface Item {
  id: string;
  description: string;
  estimated_cost: number;
  photo_url: string | null;
  status: string;
}

interface Props {
  token: string;
  items: Item[];
}

const statusBadge: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'รอตอบกลับ', color: 'bg-amber-100 text-amber-700', icon: Clock },
  approved: { label: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejected: { label: 'ปฏิเสธแล้ว', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export function CustomerAdditionalWorkList({ token, items: initial }: Props) {
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const respond = (item: Item, decision: 'approved' | 'rejected') => {
    if (item.status !== 'pending') return;
    if (
      decision === 'rejected' &&
      !confirm('ยืนยันการปฏิเสธงานเพิ่มเติมรายการนี้?')
    )
      return;
    if (
      decision === 'approved' &&
      !confirm(
        `ยืนยันอนุมัติงาน "${item.description}" ราคา ฿${item.estimated_cost.toLocaleString()}?`,
      )
    )
      return;

    setError(null);
    setBusyId(item.id);
    startTransition(async () => {
      const res = await respondAdditionalWork({
        trackingToken: token,
        requestId: item.id,
        decision,
      });
      setBusyId(null);
      if ('error' in res && res.error) {
        setError(res.error);
        return;
      }
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: decision } : i)),
      );
    });
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
      <div className="mb-3 flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          ช่างพบงานเพิ่มเติม — ต้องการอนุมัติ
        </h2>
      </div>
      <p className="mb-3 text-xs text-amber-700/80 dark:text-amber-300/80">
        ระหว่างซ่อม ช่างพบรายการที่ควรซ่อมเพิ่มเติม กรุณาเลือกอนุมัติหรือปฏิเสธทีละรายการ
      </p>

      {error && (
        <div className="mb-2 rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <ul className="space-y-2">
        {items.map((it) => {
          const cfg = statusBadge[it.status] || statusBadge.pending;
          const Icon = cfg.icon;
          const isBusy = busyId === it.id && pending;
          return (
            <li
              key={it.id}
              className="rounded-lg border border-amber-200 bg-white p-3 dark:bg-card"
            >
              <div className="flex items-start gap-3">
                {it.photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={it.photo_url}
                    alt="งานเพิ่มเติม"
                    className="h-16 w-16 shrink-0 rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{it.description}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    ราคาประมาณ ฿{Number(it.estimated_cost).toLocaleString()}
                  </div>
                </div>
                <span
                  className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.color}`}
                >
                  <Icon className="h-3 w-3" />
                  {cfg.label}
                </span>
              </div>
              {it.status === 'pending' && (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => respond(it, 'approved')}
                    className="flex-1 rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {isBusy ? '...' : '✓ อนุมัติ'}
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => respond(it, 'rejected')}
                    className="flex-1 rounded border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    ✗ ไม่ซ่อมตอนนี้
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
