'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Plus, Edit2, Trash2, X, Camera, Loader2 } from 'lucide-react';
import { saveProduct, deleteProduct } from '@/lib/actions/shop';
import { uploadGenericPhoto } from '@/lib/actions/upload';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  cost_price: number | null;
  stock_quantity: number;
  images: string[] | null;
  is_active: boolean;
  is_featured: boolean;
}

interface Props {
  initialProducts: Product[];
}

export function ProductsTable({ initialProducts }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [pending, startTransition] = useTransition();

  const onSave = (p: Product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      if (idx === -1) return [p, ...prev];
      return prev.map((x) => (x.id === p.id ? p : x));
    });
  };

  const handleDelete = (p: Product) => {
    if (!confirm(`ลบสินค้า "${p.name}"?`)) return;
    startTransition(async () => {
      const res = await deleteProduct(p.id);
      if ('error' in res && res.error) {
        alert(res.error);
        return;
      }
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> เพิ่มสินค้า
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
              <th className="px-3 py-3 text-left">รูป</th>
              <th className="px-3 py-3 text-left">สินค้า</th>
              <th className="px-3 py-3 text-right">ราคา</th>
              <th className="px-3 py-3 text-right">สต็อก</th>
              <th className="px-3 py-3 text-center">สถานะ</th>
              <th className="px-3 py-3 text-center">การกระทำ</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  ยังไม่มีสินค้า — กดเพิ่มเพื่อเริ่ม
                </td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-3 py-3">
                  {p.images?.[0] ? (
                    <Image
                      src={p.images[0]}
                      alt={p.name}
                      width={40}
                      height={40}
                      unoptimized
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted" />
                  )}
                </td>
                <td className="px-3 py-3 text-sm">
                  <div className="font-medium">{p.name}</div>
                  {p.sku && <div className="text-[11px] text-muted-foreground">SKU: {p.sku}</div>}
                </td>
                <td className="px-3 py-3 text-right text-sm font-semibold">
                  ฿{Number(p.price).toLocaleString()}
                </td>
                <td className="px-3 py-3 text-right text-sm">
                  <span
                    className={
                      p.stock_quantity === 0
                        ? 'text-red-700 font-bold'
                        : p.stock_quantity < 5
                          ? 'text-amber-700'
                          : ''
                    }
                  >
                    {p.stock_quantity}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  {p.is_active ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                      วางขาย
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      ปิด
                    </span>
                  )}
                  {p.is_featured && (
                    <div className="mt-1 text-[11px] text-primary">⭐ แนะนำ</div>
                  )}
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="flex justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(p)}
                      className="rounded border border-border p-1 hover:bg-muted"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleDelete(p)}
                      className="rounded border border-red-300 p-1 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductDialog
          product={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(p) => {
            onSave(p);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ProductDialog({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: (p: Product) => void;
}) {
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [price, setPrice] = useState(String(product?.price || ''));
  const [compareAtPrice, setCompareAtPrice] = useState(
    product?.compare_at_price ? String(product.compare_at_price) : '',
  );
  const [costPrice, setCostPrice] = useState(
    product?.cost_price ? String(product.cost_price) : '',
  );
  const [stockQty, setStockQty] = useState(String(product?.stock_quantity || 0));
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('bucket', 'job-photos'); // reuse public bucket
    fd.append('folder', 'shop-products');
    const up = await uploadGenericPhoto(fd);
    setUploading(false);
    if ('error' in up && up.error) {
      setError(up.error);
      return;
    }
    if (up.url) setImages((prev) => [...prev, up.url!]);
  };

  const submit = () => {
    setError(null);
    const priceNum = Number(price);
    if (!name.trim() || priceNum <= 0) {
      setError('กรุณากรอกชื่อและราคาที่ถูกต้อง');
      return;
    }
    startTransition(async () => {
      const res = await saveProduct({
        id: product?.id,
        name,
        description: description || undefined,
        sku: sku || undefined,
        price: priceNum,
        compare_at_price: compareAtPrice ? Number(compareAtPrice) : undefined,
        cost_price: costPrice ? Number(costPrice) : undefined,
        stock_quantity: Number(stockQty) || 0,
        images,
        is_active: isActive,
        is_featured: isFeatured,
      });
      if ('error' in res && res.error) {
        setError(res.error);
        return;
      }
      const saved =
        (res as { product?: Product }).product ||
        ({
          ...(product || {}),
          id: product?.id || crypto.randomUUID(),
          name,
          slug: product?.slug || '',
          description,
          sku,
          price: priceNum,
          compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
          cost_price: costPrice ? Number(costPrice) : null,
          stock_quantity: Number(stockQty) || 0,
          images,
          is_active: isActive,
          is_featured: isFeatured,
        } as Product);
      onSaved(saved);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card p-5 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>
        <h3 className="mb-4 text-lg font-bold">
          {product ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
        </h3>

        <div className="space-y-3">
          <Field label="ชื่อสินค้า *">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Field>
          <Field label="คำอธิบาย">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="SKU">
              <input value={sku} onChange={(e) => setSku(e.target.value)} className={inputCls} />
            </Field>
            <Field label="คงเหลือ">
              <input
                type="number"
                min={0}
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="ราคาขาย *">
              <input
                type="number"
                min={0}
                step={0.01}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="ราคาเปรียบเทียบ">
              <input
                type="number"
                min={0}
                step={0.01}
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="ต้นทุน">
              <input
                type="number"
                min={0}
                step={0.01}
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="รูปภาพ">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {images.map((url, i) => (
                  <div key={i} className="relative">
                    <Image
                      src={url}
                      alt=""
                      width={80}
                      height={80}
                      unoptimized
                      className="h-20 w-20 rounded object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute -right-1 -top-1 rounded-full bg-red-600 p-0.5 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded border-2 border-dashed border-border hover:bg-muted">
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-muted-foreground" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              วางขาย
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              สินค้าแนะนำ
            </label>
          </div>
        </div>

        {error && <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {pending ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-3 py-2 text-sm"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary';
