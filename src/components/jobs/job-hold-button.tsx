'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PauseCircle, PlayCircle, Package, Shield, X } from 'lucide-react';
import { holdJob, resumeJob } from '@/lib/actions/jobs';
import { CustomerNotifyModal } from '@/components/jobs/customer-notify-modal';
import type { CustomerNotifyEvent } from '@/lib/notifications/customer-line';

interface Props {
  jobId: string;
  currentStatus: string;
  holdReason?: string | null;
  holdUntil?: string | null;
}

const HOLD_TYPES = [
  { value: 'waiting_parts',     label: 'รออะไหล่',  icon: Package, color: 'bg-orange-600 hover:bg-orange-700 text-white' },
  { value: 'waiting_insurance', label: 'รอประกัน',  icon: Shield,  color: 'bg-amber-600 hover:bg-amber-700 text-white' },
  { value: 'on_hold',           label: 'พักงานอื่นๆ', icon: PauseCircle, color: 'bg-slate-600 hover:bg-slate-700 text-white' },
] as const;

const HOLD_STATES = ['waiting_parts', 'waiting_insurance', 'on_hold'];

export function JobHoldButton({ jobId, currentStatus, holdReason, holdUntil }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>('waiting_parts');
  const [reason, setReason] = useState('');
  const [until, setUntil] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notifyEvent, setNotifyEvent] = useState<CustomerNotifyEvent | null>(null);
  const [notifyContext, setNotifyContext] = useState<{
    holdReason?: string;
    holdUntil?: string;
  } | null>(null);

  const isHeld = HOLD_STATES.includes(currentStatus);

  const submit = () => {
    setError(null);
    if (!reason.trim()) {
      setError('กรุณากรอกเหตุผล');
      return;
    }
    startTransition(async () => {
      const res = await holdJob({
        jobId,
        status: type as 'waiting_parts' | 'waiting_insurance' | 'on_hold',
        reason: reason.trim(),
        until: until || undefined,
      });
      if ('error' in res && res.error) {
        setError(res.error);
        return;
      }
      const event = type as CustomerNotifyEvent;
      const ctx = { holdReason: reason.trim(), holdUntil: until || undefined };
      setOpen(false);
      setReason('');
      setUntil('');
      setNotifyContext(ctx);
      setNotifyEvent(event);
    });
  };

  const resume = () => {
    if (!confirm('กลับมาทำงานต่อ?')) return;
    startTransition(async () => {
      const res = await resumeJob(jobId);
      if ('error' in res && res.error) {
        alert(res.error);
        return;
      }
      setNotifyEvent('resumed');
    });
  };

  const closeNotify = () => {
    setNotifyEvent(null);
    setNotifyContext(null);
    router.refresh();
  };

  const notifyModal = notifyEvent ? (
    <CustomerNotifyModal
      jobId={jobId}
      event={notifyEvent}
      context={notifyContext ?? undefined}
      onClose={closeNotify}
    />
  ) : null;

  if (isHeld) {
    return (
      <>
        {notifyModal}
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
        <div className="mb-2 flex items-center gap-2">
          <PauseCircle className="h-4 w-4 text-amber-700" />
          <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            งานพักอยู่ — ยังทำต่อไม่ได้
          </span>
        </div>
        {holdReason && (
          <p className="mb-1 text-sm text-amber-700/90 dark:text-amber-300/90">
            สาเหตุ: <span className="font-medium">{holdReason}</span>
          </p>
        )}
        {holdUntil && (
          <p className="mb-3 text-xs text-amber-700/80 dark:text-amber-300/80">
            คาดว่ากลับมาทำต่อ: {new Date(holdUntil).toLocaleDateString('th-TH')}
          </p>
        )}
        <button
          type="button"
          onClick={resume}
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <PlayCircle className="h-4 w-4" />
          {pending ? 'กำลังกลับมาทำต่อ...' : 'กลับมาทำต่อ'}
        </button>
        </div>
      </>
    );
  }

  // Don't show hold button on terminal states
  if (['completed', 'cancelled', 'pending', 'diagnosing', 'quoted'].includes(currentStatus)) {
    return null;
  }

  return (
    <>
      {notifyModal}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-400 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300"
      >
        <PauseCircle className="h-4 w-4" />
        พักงาน (รออะไหล่/รอประกัน/อื่นๆ)
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-card p-5 shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full p-1 hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-3 text-lg font-bold">พักงาน</h3>
            <div className="grid grid-cols-3 gap-2">
              {HOLD_TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs ${
                      type === t.value ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium">เหตุผล (ลูกค้าจะเห็น) *</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    type === 'waiting_parts'
                      ? 'เช่น รออะไหล่ Brake Pad MK-101 จาก Toyota'
                      : type === 'waiting_insurance'
                        ? 'เช่น ส่งเคลมประกัน รอใบอนุมัติจาก [บริษัท]'
                        : 'เหตุผลที่ต้องพักงาน'
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">คาดว่ากลับมาทำต่อ (ETA)</label>
                <input
                  type="date"
                  value={until}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setUntil(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {error && (
                <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={submit}
                  disabled={pending}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                    HOLD_TYPES.find((t) => t.value === type)?.color || 'bg-primary text-primary-foreground'
                  } disabled:opacity-50`}
                >
                  {pending ? 'กำลังบันทึก...' : 'พักงาน'}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
