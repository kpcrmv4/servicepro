'use client';

import { useState, useTransition } from 'react';
import { Plus, Camera, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { createAdditionalWorkRequest } from '@/lib/actions/additional-work';
import { uploadGenericPhoto } from '@/lib/actions/upload';

interface Item {
  id: string;
  description: string;
  estimated_cost: number;
  photo_url: string | null;
  status: string;
  customer_notified_at: string | null;
  customer_responded_at: string | null;
  created_at: string;
}

interface Props {
  jobId: string;
  jobNumber: string;
  initialItems: Item[];
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'รอลูกค้าตอบ', color: 'bg-amber-100 text-amber-700', icon: Clock },
  approved: { label: 'อนุมัติ', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejected: { label: 'ปฏิเสธ', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export function AdditionalWorkPanel({ jobId, jobNumber, initialItems }: Props) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setDescription('');
    setCost('');
    setPhotoFile(null);
    setError(null);
  };

  const submit = () => {
    setError(null);
    const trimmed = description.trim();
    const costNum = Number(cost) || 0;
    if (!trimmed) {
      setError('กรุณากรอกรายละเอียด');
      return;
    }
    if (costNum < 0) {
      setError('ราคาประมาณต้องไม่ติดลบ');
      return;
    }
    startTransition(async () => {
      let photoUrl: string | undefined;
      if (photoFile) {
        const fd = new FormData();
        fd.append('file', photoFile);
        fd.append('bucket', 'job-photos');
        fd.append('folder', `additional-work/${jobId}`);
        const up = await uploadGenericPhoto(fd);
        if ('error' in up && up.error) {
          setError(up.error);
          return;
        }
        photoUrl = up.url;
      }
      const res = await createAdditionalWorkRequest({
        jobId,
        description: trimmed,
        estimatedCost: costNum,
        photoUrl,
      });
      if ('error' in res && res.error) {
        setError(res.error);
        return;
      }
      const created = (res as { request?: Item }).request;
      if (created) setItems((prev) => [created, ...prev]);
      setOpen(false);
      reset();
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">งานเพิ่มเติม (Additional Work)</h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> แจ้งงานเพิ่ม
        </button>
      </div>

      {items.length === 0 && !open && (
        <p className="text-xs text-muted-foreground">
          ใช้แจ้งลูกค้าเมื่อเจองานเพิ่มเติมระหว่างซ่อม — ลูกค้าจะได้รับ LINE และอนุมัติผ่านลิงก์ติดตาม
        </p>
      )}

      {open && (
        <div className="mb-4 space-y-2 rounded-lg border border-border bg-muted/30 p-3">
          <textarea
            placeholder="รายละเอียดงานเพิ่มเติม เช่น ลูกหมากปีกนกหลวม ต้องเปลี่ยน"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              placeholder="ราคาประมาณ (บาท)"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="flex-1 rounded border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <label className="flex cursor-pointer items-center gap-1 rounded border border-border bg-background px-2 py-1.5 text-xs hover:bg-muted">
              <Camera className="h-3.5 w-3.5" />
              {photoFile ? photoFile.name.slice(0, 12) : 'แนบรูป'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
          {error && (
            <div className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">{error}</div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="flex-1 rounded bg-primary px-2 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {pending ? 'กำลังส่ง...' : 'ส่งให้ลูกค้า'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                reset();
              }}
              className="rounded border border-border px-2 py-1.5 text-xs"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((it) => {
            const cfg = statusConfig[it.status] || statusConfig.pending;
            const Icon = cfg.icon;
            return (
              <li key={it.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-sm">{it.description}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      ฿{Number(it.estimated_cost).toLocaleString()} ·{' '}
                      {new Date(it.created_at).toLocaleString('th-TH')}
                    </div>
                    {it.photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.photo_url}
                        alt="งานเพิ่มเติม"
                        className="mt-2 h-16 w-16 rounded object-cover"
                      />
                    )}
                  </div>
                  <span
                    className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.color}`}
                  >
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {items.length > 0 && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          ลูกค้าตอบกลับผ่านลิงก์: <code>/c/track/{jobNumber}</code>
        </p>
      )}
    </div>
  );
}
