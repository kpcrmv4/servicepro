'use client';

import { useState, useTransition } from 'react';
import { Save, Loader2, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { type TenantBrand, DEFAULT_BRAND } from '@/lib/branding/types';
import { saveBrand } from '@/lib/actions/branding';
import { uploadGenericPhoto } from '@/lib/actions/upload';

interface Props {
  initialBrand: TenantBrand | null;
}

const PRESET_COLORS = [
  '#7C5BFB', // platform default
  '#FF6B6B', // coral
  '#FF9F43', // orange
  '#FECA57', // yellow
  '#48DBFB', // cyan
  '#1DD1A1', // mint
  '#5F27CD', // purple
  '#EE5A6F', // rose
  '#222F3E', // dark slate
  '#0EA5E9', // sky
];

export function BrandForm({ initialBrand }: Props) {
  const [brand, setBrand] = useState<TenantBrand>(initialBrand || DEFAULT_BRAND);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('bucket', 'job-photos');
    fd.append('folder', 'brand-logos');
    const res = await uploadGenericPhoto(fd);
    setUploading(false);
    if ('error' in res && res.error) {
      setError(res.error);
      return;
    }
    if (res.url) setBrand((b) => ({ ...b, logo_url: res.url ?? null }));
  };

  const submit = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await saveBrand({
        primary_color: brand.primary_color,
        logo_url: brand.logo_url,
        display_name: brand.display_name,
      });
      if ('error' in res && res.error) {
        setError(res.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Editor */}
      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-base font-semibold">สีหลัก</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            ใช้บนปุ่ม CTA, ลิงก์, แถบสถานะ และส่วนเน้นทุกที่
          </p>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={brand.primary_color}
              onChange={(e) =>
                setBrand((b) => ({ ...b, primary_color: e.target.value }))
              }
              className="h-12 w-16 cursor-pointer rounded-xl border border-border bg-card"
            />
            <input
              type="text"
              value={brand.primary_color}
              onChange={(e) =>
                setBrand((b) => ({ ...b, primary_color: e.target.value }))
              }
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setBrand((b) => ({ ...b, primary_color: c }))}
                aria-label={c}
                className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-card transition-transform hover:scale-110 ${
                  brand.primary_color.toLowerCase() === c.toLowerCase()
                    ? 'ring-foreground'
                    : 'ring-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-base font-semibold">โลโก้</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            แสดงบนหน้า Landing, Storefront, ใบแจ้งหนี้ PDF (อัตโนมัติ)
          </p>
          {brand.logo_url ? (
            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
              <Image
                src={brand.logo_url}
                alt="logo"
                width={80}
                height={80}
                unoptimized
                className="h-16 w-16 rounded-lg object-contain"
              />
              <button
                type="button"
                onClick={() => setBrand((b) => ({ ...b, logo_url: null }))}
                className="flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
              >
                <X className="h-3 w-3" />
                ลบ
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground hover:bg-muted/40">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดโลโก้ (รูปสี่เหลี่ยม แนะนำ 512x512)'}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-base font-semibold">ชื่อแสดง</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            ชื่อที่จะแสดงให้ลูกค้าเห็น (ถ้าไม่กรอก จะใช้ชื่อร้านจากการตั้งค่าทั่วไป)
          </p>
          <input
            type="text"
            value={brand.display_name || ''}
            onChange={(e) =>
              setBrand((b) => ({ ...b, display_name: e.target.value || null }))
            }
            placeholder="เช่น AutoFix Bangkok"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </section>

        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {pending ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
          {saved && <span className="text-sm text-emerald-600">บันทึกแล้ว ✓</span>}
        </div>
      </div>

      {/* Live preview */}
      <div className="lg:sticky lg:top-20 self-start">
        <h3 className="mb-3 text-sm font-semibold">ตัวอย่าง (ที่ลูกค้าจะเห็น)</h3>
        <div
          className="space-y-4 rounded-3xl bg-background p-5 shadow-md"
          style={{
            ['--primary' as string]: brand.primary_color,
            ['--primary-foreground' as string]: brand.primary_foreground,
          }}
        >
          {/* Faux header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {brand.logo_url ? (
                <Image
                  src={brand.logo_url}
                  alt="logo"
                  width={32}
                  height={32}
                  unoptimized
                  className="h-8 w-8 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                  {(brand.display_name || 'KP')[0]}
                </div>
              )}
              <span className="text-sm font-bold">
                {brand.display_name || 'ชื่อร้าน'}
              </span>
            </div>
          </div>

          {/* Faux hero card */}
          <div
            className="rounded-2xl p-6 text-white"
            style={{ backgroundColor: brand.primary_color, color: brand.primary_foreground }}
          >
            <h3 className="text-lg font-bold">บริการระดับมืออาชีพ</h3>
            <p className="mt-1 text-sm opacity-90">ดูแลรถคุณเหมือนรถเรา</p>
            <button
              type="button"
              className="mt-3 rounded-full bg-white px-4 py-1.5 text-sm font-semibold"
              style={{ color: brand.primary_color }}
            >
              จองคิวเลย
            </button>
          </div>

          {/* Faux progress */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 text-sm font-semibold">งาน JOB-2026-0042</div>
            <div className="space-y-2">
              {['รับรถ', 'กำลังซ่อม', 'รอลูกค้ารับ'].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-full"
                    style={{
                      backgroundColor: i <= 1 ? brand.primary_color : 'var(--muted)',
                      color: brand.primary_foreground,
                    }}
                  >
                    <div className="flex h-6 w-6 items-center justify-center text-xs font-bold">
                      {i + 1}
                    </div>
                  </div>
                  <span className="text-sm">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Faux button */}
          <button
            type="button"
            className="w-full rounded-full px-4 py-2.5 text-sm font-medium"
            style={{ backgroundColor: brand.primary_color, color: brand.primary_foreground }}
          >
            ดูรายละเอียด
          </button>
        </div>
      </div>
    </div>
  );
}
