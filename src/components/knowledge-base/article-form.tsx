'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2 } from 'lucide-react';
import { saveKbArticle } from '@/lib/actions/knowledge-base';

interface CategoryLite { id: string; name: string }

interface Props {
  categories: CategoryLite[];
  initial?: {
    id: string;
    title: string;
    category_id: string | null;
    car_make: string | null;
    car_model: string | null;
    year_from: number | null;
    year_to: number | null;
    summary: string | null;
    body_text: string;
    video_url: string | null;
    tags: string[];
    is_published: boolean;
  };
}

export function KbArticleForm({ categories, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const tagsRaw = String(fd.get('tags') || '').trim();
    const tags = tagsRaw ? tagsRaw.split(/[,\s]+/).filter(Boolean) : [];
    const yearFromRaw = String(fd.get('year_from') || '').trim();
    const yearToRaw = String(fd.get('year_to') || '').trim();

    startTransition(async () => {
      const res = await saveKbArticle({
        id: initial?.id,
        title: String(fd.get('title') || ''),
        categoryId: String(fd.get('category_id') || '') || undefined,
        carMake: String(fd.get('car_make') || '') || undefined,
        carModel: String(fd.get('car_model') || '') || undefined,
        yearFrom: yearFromRaw ? Number(yearFromRaw) : undefined,
        yearTo: yearToRaw ? Number(yearToRaw) : undefined,
        summary: String(fd.get('summary') || '') || undefined,
        bodyText: String(fd.get('body_text') || ''),
        videoUrl: String(fd.get('video_url') || '') || undefined,
        tags,
        isPublished: fd.get('is_published') === 'on',
      });
      if ('error' in res && res.error) {
        setError(res.error);
        return;
      }
      const slug = (res.article as { slug: string }).slug;
      router.push(`/dashboard/knowledge-base/${slug}`);
    });
  };

  return (
    <form onSubmit={submit} className="max-w-4xl space-y-4 rounded-xl border border-border bg-card p-6">
      <Field label="ชื่อบทความ *">
        <input
          name="title"
          required
          defaultValue={initial?.title || ''}
          placeholder="เช่น ขั้นตอนเปลี่ยนผ้าเบรคหน้า Civic 2018"
          className={inputCls}
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field label="หมวด">
          <select
            name="category_id"
            defaultValue={initial?.category_id || ''}
            className={inputCls}
          >
            <option value="">ไม่ระบุ</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="ยี่ห้อรถ">
          <input
            name="car_make"
            defaultValue={initial?.car_make || ''}
            placeholder="Toyota / Honda"
            className={inputCls}
          />
        </Field>
        <Field label="รุ่น">
          <input
            name="car_model"
            defaultValue={initial?.car_model || ''}
            placeholder="Vios / Civic"
            className={inputCls}
          />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="ปีเริ่มต้น">
          <input
            type="number"
            name="year_from"
            min={1980}
            max={2100}
            defaultValue={initial?.year_from || ''}
            className={inputCls}
          />
        </Field>
        <Field label="ปีสุดท้าย">
          <input
            type="number"
            name="year_to"
            min={1980}
            max={2100}
            defaultValue={initial?.year_to || ''}
            className={inputCls}
          />
        </Field>
      </div>
      <Field label="สรุปสั้นๆ">
        <textarea
          name="summary"
          rows={2}
          defaultValue={initial?.summary || ''}
          placeholder="คำอธิบายสั้นๆ 1-2 ประโยค"
          className={inputCls}
        />
      </Field>
      <Field label="เนื้อหา (รองรับ Markdown) *">
        <textarea
          name="body_text"
          required
          rows={14}
          defaultValue={initial?.body_text || ''}
          placeholder={`## ขั้นตอน\n1. ยกรถ ใส่ขาตั้ง\n2. ถอดล้อ\n...\n\n## สเปคที่ใช้บ่อย\n- น็อต Caliper: 28 Nm\n- ปริมาณน้ำมันเบรค: 1L`}
          className={`${inputCls} font-mono`}
        />
      </Field>
      <Field label="ลิงก์วิดีโอ (YouTube ฯลฯ)">
        <input
          name="video_url"
          type="url"
          defaultValue={initial?.video_url || ''}
          placeholder="https://www.youtube.com/watch?v=..."
          className={inputCls}
        />
      </Field>
      <Field label="แท็ก (คั่นด้วย , หรือ space)">
        <input
          name="tags"
          defaultValue={(initial?.tags || []).join(', ')}
          placeholder="brake, civic, อะไหล่"
          className={inputCls}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_published"
          defaultChecked={initial?.is_published ?? true}
        />
        เผยแพร่ให้ทีมเห็น
      </label>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {pending ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium">{label}</label>
      {children}
    </div>
  );
}
