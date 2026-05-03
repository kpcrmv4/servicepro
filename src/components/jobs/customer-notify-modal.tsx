'use client';

import { useEffect, useState, useTransition } from 'react';
import { Send, X, MessageCircle, Loader2 } from 'lucide-react';
import {
  getCustomerNotifyPreview,
  sendCustomerLineForEvent,
} from '@/lib/actions/customer-notify';
import type { CustomerNotifyEvent } from '@/lib/notifications/customer-line';

interface Props {
  jobId: string;
  event: CustomerNotifyEvent;
  context?: { holdReason?: string | null; holdUntil?: string | null };
  onClose: () => void;
}

const REASON_LABELS: Record<string, string> = {
  no_customer: 'งานนี้ยังไม่ได้ผูกข้อมูลลูกค้า',
  no_line_config: 'ร้านยังไม่ได้ตั้งค่า LINE OA',
  no_follower: 'ลูกค้ายังไม่ได้แอด LINE OA ของร้าน',
  event_disabled: 'ปิดการแจ้งเตือนเหตุการณ์นี้ในตั้งค่า',
  globally_off: 'ปิดการแจ้งเตือนลูกค้าทั้งหมด',
};

export function CustomerNotifyModal({ jobId, event, context, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [auto, setAuto] = useState(false);
  const [canSend, setCanSend] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load preview once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await getCustomerNotifyPreview(jobId, event, context ?? undefined);
      if (cancelled) return;
      setEnabled(r.enabled);
      setAuto(r.auto);
      setCanSend(r.canSend);
      setReason(r.reason ?? null);
      if (r.preview) setMessage(r.preview);
      setLoading(false);

      // Auto-mode: fire and forget, then close
      if (r.enabled && r.auto && r.canSend && r.preview) {
        const send = async () => {
          await sendCustomerLineForEvent(jobId, event, {
            messageOverride: r.preview!,
            ctx: context ?? undefined,
          });
          if (!cancelled) onClose();
        };
        void send();
      }
      // Disabled or can't send: just close silently
      if (!r.enabled || !r.canSend) {
        if (!cancelled) {
          setTimeout(onClose, r.enabled ? 1500 : 0);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, event]);

  const send = () => {
    if (!message.trim()) {
      setError('ข้อความว่าง');
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await sendCustomerLineForEvent(jobId, event, {
        messageOverride: message,
        ctx: context ?? undefined,
      });
      if (r.ok) {
        setSent(true);
        setTimeout(onClose, 1000);
      } else {
        setError(REASON_LABELS[r.reason || ''] || `ส่งไม่สำเร็จ: ${r.reason}`);
      }
    });
  };

  // Don't render anything when in auto-send mode (it runs in the background)
  if (auto && canSend && enabled) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-card p-5 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <MessageCircle className="h-5 w-5 text-emerald-600" />
          ส่งแจ้งเตือนลูกค้าผ่าน LINE
        </h3>

        {loading && (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            กำลังโหลดเทมเพลต...
          </div>
        )}

        {!loading && !enabled && (
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            {REASON_LABELS[reason || ''] || 'ไม่ส่งแจ้งเตือนสำหรับเหตุการณ์นี้'}
          </div>
        )}

        {!loading && enabled && !canSend && (
          <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            {REASON_LABELS[reason || ''] || 'ไม่สามารถส่งได้ในตอนนี้'}
          </div>
        )}

        {!loading && enabled && canSend && (
          <>
            <p className="mb-2 text-xs text-muted-foreground">
              ตรวจ/แก้ไขข้อความก่อนกดส่ง
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={9}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {error && (
              <div className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
            )}
            {sent && (
              <div className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                ✓ ส่งแล้ว
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={send}
                disabled={pending || sent}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                ส่ง
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-3 py-2 text-sm"
              >
                ข้ามครั้งนี้
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
