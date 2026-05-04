'use client';

import { useState, useTransition } from 'react';
import {
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import {
  type LandingPage,
  type Section,
  type SectionType,
  SECTION_LABELS,
  SECTION_DEFAULTS,
} from '@/lib/landing/types';
import { saveLandingPage } from '@/lib/actions/landing';

interface Props {
  initialPage: LandingPage;
  tenantSlug: string;
}

export function LandingEditor({ initialPage, tenantSlug }: Props) {
  const [page, setPage] = useState<LandingPage>(initialPage);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const update = (partial: Partial<LandingPage>) =>
    setPage((p) => ({ ...p, ...partial }));

  const updateSection = (id: string, partial: Partial<Section>) =>
    setPage((p) => ({
      ...p,
      sections: p.sections.map((s) =>
        s.id === id ? ({ ...s, ...partial } as Section) : s,
      ),
    }));

  const updateSectionData = (id: string, dataPartial: Record<string, unknown>) =>
    setPage((p) => ({
      ...p,
      sections: p.sections.map((s) =>
        s.id === id
          ? ({ ...s, data: { ...(s.data as Record<string, unknown>), ...dataPartial } } as Section)
          : s,
      ),
    }));

  const removeSection = (id: string) => {
    if (!confirm('ลบ section นี้?')) return;
    setPage((p) => ({ ...p, sections: p.sections.filter((s) => s.id !== id) }));
  };

  const moveSection = (id: string, dir: -1 | 1) => {
    setPage((p) => {
      const sorted = [...p.sections].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((s) => s.id === id);
      if (idx < 0) return p;
      const swap = idx + dir;
      if (swap < 0 || swap >= sorted.length) return p;
      [sorted[idx], sorted[swap]] = [sorted[swap], sorted[idx]];
      return {
        ...p,
        sections: sorted.map((s, i) => ({ ...s, order: i }) as Section),
      };
    });
  };

  const addSection = (type: SectionType) => {
    const newSection: Section = {
      id: crypto.randomUUID(),
      type,
      order: page.sections.length,
      data: SECTION_DEFAULTS[type](),
    } as Section;
    setPage((p) => ({ ...p, sections: [...p.sections, newSection] }));
  };

  const submit = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await saveLandingPage({
        is_published: page.is_published,
        primary_color: page.primary_color,
        hero_image_url: page.hero_image_url,
        logo_url: page.logo_url,
        seo_title: page.seo_title,
        seo_description: page.seo_description,
        sections: page.sections,
        show_booking_widget: page.show_booking_widget,
      });
      if ('error' in res && res.error) {
        setError(res.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const sortedSections = [...page.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Top bar — publish + theme */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={page.is_published}
              onChange={(e) => update({ is_published: e.target.checked })}
              className="h-4 w-4"
            />
            <span className="flex items-center gap-2 text-sm font-medium">
              {page.is_published ? (
                <>
                  <Eye className="h-4 w-4 text-emerald-600" />
                  เผยแพร่แล้ว — เข้าถึงได้ที่
                  <code className="rounded bg-muted px-1 text-xs">/shop/{tenantSlug}</code>
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ยังไม่เผยแพร่
                </>
              )}
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={page.show_booking_widget}
              onChange={(e) => update({ show_booking_widget: e.target.checked })}
            />
            แสดงปุ่มจองคิวบนหน้านี้
          </label>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="สีหลัก">
            <input
              type="color"
              value={page.primary_color}
              onChange={(e) => update({ primary_color: e.target.value })}
              className="h-10 w-full rounded-lg border border-border bg-background"
            />
          </Field>
          <Field label="โลโก้ URL">
            <input
              value={page.logo_url || ''}
              onChange={(e) => update({ logo_url: e.target.value || null })}
              placeholder="https://..."
              className={inputCls}
            />
          </Field>
          <Field label="รูป hero พื้นหลัง URL">
            <input
              value={page.hero_image_url || ''}
              onChange={(e) => update({ hero_image_url: e.target.value || null })}
              placeholder="https://..."
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      {/* SEO */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-2 text-base font-semibold">SEO</h2>
        <div className="space-y-3">
          <Field label="Title (สำหรับ Google)">
            <input
              value={page.seo_title || ''}
              onChange={(e) => update({ seo_title: e.target.value || null })}
              maxLength={70}
              className={inputCls}
            />
          </Field>
          <Field label="คำอธิบาย">
            <textarea
              value={page.seo_description || ''}
              onChange={(e) => update({ seo_description: e.target.value || null })}
              maxLength={160}
              rows={2}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      {/* Sections */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Sections (เรียงจากบนลงล่าง)</h2>
          <div className="flex gap-1">
            {(Object.keys(SECTION_LABELS) as SectionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => addSection(t)}
                className="rounded border border-border px-2 py-1 text-xs hover:bg-muted"
              >
                <Plus className="inline h-3 w-3" /> {SECTION_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <ul className="space-y-3">
          {sortedSections.map((s, idx) => (
            <li key={s.id} className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {idx + 1}. {SECTION_LABELS[s.type]}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveSection(s.id, -1)}
                    className="rounded border border-border p-1 hover:bg-muted disabled:opacity-30"
                    disabled={idx === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(s.id, 1)}
                    className="rounded border border-border p-1 hover:bg-muted disabled:opacity-30"
                    disabled={idx === sortedSections.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSection(s.id)}
                    className="rounded border border-red-300 p-1 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <SectionEditor
                section={s}
                onChange={(d) => updateSectionData(s.id, d)}
              />
            </li>
          ))}
          {sortedSections.length === 0 && (
            <li className="py-4 text-center text-xs text-muted-foreground">
              ยังไม่มี section — กดเพิ่มจากปุ่มด้านบน
            </li>
          )}
        </ul>
      </section>

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {pending ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
        {saved && <span className="text-sm text-emerald-600">บันทึกแล้ว ✓</span>}
      </div>
    </div>
  );
}

function SectionEditor({
  section,
  onChange,
}: {
  section: Section;
  onChange: (data: Record<string, unknown>) => void;
}) {
  // For each section type, render appropriate fields
  switch (section.type) {
    case 'hero':
      return (
        <div className="space-y-2">
          <Field label="Headline">
            <input
              value={section.data.headline}
              onChange={(e) => onChange({ headline: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Subheadline">
            <input
              value={section.data.subheadline || ''}
              onChange={(e) => onChange({ subheadline: e.target.value })}
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="ปุ่ม CTA — ข้อความ">
              <input
                value={section.data.cta_label || ''}
                onChange={(e) => onChange({ cta_label: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="ปุ่ม CTA — ลิงก์">
              <input
                value={section.data.cta_link || ''}
                onChange={(e) => onChange({ cta_link: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="รูปพื้นหลัง URL">
            <input
              value={section.data.image_url || ''}
              onChange={(e) => onChange({ image_url: e.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      );
    case 'about':
      return (
        <div className="space-y-2">
          <Field label="หัวข้อ">
            <input
              value={section.data.title}
              onChange={(e) => onChange({ title: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="เนื้อหา">
            <textarea
              value={section.data.body}
              onChange={(e) => onChange({ body: e.target.value })}
              rows={4}
              className={inputCls}
            />
          </Field>
          <Field label="รูปประกอบ URL">
            <input
              value={section.data.image_url || ''}
              onChange={(e) => onChange({ image_url: e.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      );
    case 'services':
      return (
        <div className="space-y-2">
          <Field label="หัวข้อ">
            <input
              value={section.data.title}
              onChange={(e) => onChange({ title: e.target.value })}
              className={inputCls}
            />
          </Field>
          <ListEditor
            items={section.data.items}
            onChange={(items) => onChange({ items })}
            template={() => ({ name: 'บริการใหม่', description: '', price_label: '' })}
            renderItem={(item, update) => (
              <>
                <input
                  placeholder="ชื่อบริการ"
                  value={item.name}
                  onChange={(e) => update({ name: e.target.value })}
                  className={inputCls}
                />
                <input
                  placeholder="คำอธิบาย"
                  value={item.description || ''}
                  onChange={(e) => update({ description: e.target.value })}
                  className={inputCls}
                />
                <input
                  placeholder="ป้ายราคา"
                  value={item.price_label || ''}
                  onChange={(e) => update({ price_label: e.target.value })}
                  className={inputCls}
                />
              </>
            )}
          />
        </div>
      );
    case 'gallery':
      return (
        <div className="space-y-2">
          <Field label="หัวข้อ">
            <input
              value={section.data.title}
              onChange={(e) => onChange({ title: e.target.value })}
              className={inputCls}
            />
          </Field>
          <ListEditor
            items={section.data.images}
            onChange={(images) => onChange({ images })}
            template={() => ({ url: '', caption: '' })}
            renderItem={(item, update) => (
              <>
                <input
                  placeholder="รูป URL"
                  value={item.url}
                  onChange={(e) => update({ url: e.target.value })}
                  className={inputCls}
                />
                <input
                  placeholder="คำบรรยาย"
                  value={item.caption || ''}
                  onChange={(e) => update({ caption: e.target.value })}
                  className={inputCls}
                />
              </>
            )}
          />
        </div>
      );
    case 'reviews':
      return (
        <div className="space-y-2">
          <Field label="หัวข้อ">
            <input
              value={section.data.title}
              onChange={(e) => onChange({ title: e.target.value })}
              className={inputCls}
            />
          </Field>
          <ListEditor
            items={section.data.items}
            onChange={(items) => onChange({ items })}
            template={() => ({ author: '', text: '', rating: 5 })}
            renderItem={(item, update) => (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="ชื่อลูกค้า"
                    value={item.author}
                    onChange={(e) => update({ author: e.target.value })}
                    className={inputCls}
                  />
                  <input
                    type="number"
                    min={1}
                    max={5}
                    placeholder="ดาว 1-5"
                    value={item.rating || 5}
                    onChange={(e) => update({ rating: Number(e.target.value) })}
                    className={inputCls}
                  />
                </div>
                <textarea
                  placeholder="ข้อความรีวิว"
                  value={item.text}
                  onChange={(e) => update({ text: e.target.value })}
                  rows={2}
                  className={inputCls}
                />
              </>
            )}
          />
        </div>
      );
    case 'contact':
      return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Field label="โทรศัพท์">
            <input
              value={section.data.phone || ''}
              onChange={(e) => onChange({ phone: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="อีเมล">
            <input
              value={section.data.email || ''}
              onChange={(e) => onChange({ email: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="ที่อยู่">
            <input
              value={section.data.address || ''}
              onChange={(e) => onChange({ address: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="เวลาเปิด">
            <input
              value={section.data.hours || ''}
              onChange={(e) => onChange({ hours: e.target.value })}
              placeholder="จ-ส 09:00-18:00"
              className={inputCls}
            />
          </Field>
          <Field label="Google Maps embed URL">
            <input
              value={section.data.map_url || ''}
              onChange={(e) => onChange({ map_url: e.target.value })}
              placeholder="https://www.google.com/maps/embed?..."
              className={inputCls}
            />
          </Field>
        </div>
      );
    case 'faq':
      return (
        <ListEditor
          items={section.data.items}
          onChange={(items) => onChange({ items })}
          template={() => ({ question: '', answer: '' })}
          renderItem={(item, update) => (
            <>
              <input
                placeholder="คำถาม"
                value={item.question}
                onChange={(e) => update({ question: e.target.value })}
                className={inputCls}
              />
              <textarea
                placeholder="คำตอบ"
                value={item.answer}
                onChange={(e) => update({ answer: e.target.value })}
                rows={2}
                className={inputCls}
              />
            </>
          )}
        />
      );
    case 'cta':
      return (
        <div className="space-y-2">
          <Field label="Headline">
            <input
              value={section.data.headline}
              onChange={(e) => onChange({ headline: e.target.value })}
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="ปุ่ม — ข้อความ">
              <input
                value={section.data.button_label}
                onChange={(e) => onChange({ button_label: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="ปุ่ม — ลิงก์">
              <input
                value={section.data.button_link}
                onChange={(e) => onChange({ button_link: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>
        </div>
      );
  }
}

function ListEditor<T extends Record<string, unknown>>({
  items,
  onChange,
  template,
  renderItem,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  template: () => T;
  renderItem: (item: T, update: (partial: Partial<T>) => void) => React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="space-y-1.5 rounded border border-border bg-background p-2">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== idx))}
              className="text-xs text-red-600 hover:underline"
            >
              ลบ
            </button>
          </div>
          {renderItem(item, (partial) =>
            onChange(items.map((it, i) => (i === idx ? { ...it, ...partial } : it))),
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, template()])}
        className="rounded border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
      >
        + เพิ่มรายการ
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary';
