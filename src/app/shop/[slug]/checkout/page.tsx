'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import {
  type CartItem,
  readCart,
  cartTotal,
  clearCart,
} from '@/lib/shop/cart';
import { createPublicOrder } from '@/lib/actions/shop';

export default function CheckoutPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    setItems(readCart(slug));
    setHydrated(true);
  }, [slug]);

  const total = cartTotal(items);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createPublicOrder({
        tenantSlug: slug,
        items: items.map((i) => ({ productId: i.id, quantity: i.qty })),
        customerName: String(fd.get('name') || ''),
        customerPhone: String(fd.get('phone') || ''),
        customerEmail: String(fd.get('email') || '') || undefined,
        shippingAddress: String(fd.get('address') || '') || undefined,
        paymentMethod: (fd.get('payment_method') as 'transfer' | 'promptpay' | 'cash_on_delivery') || 'transfer',
        notes: String(fd.get('notes') || '') || undefined,
      });
      if ('error' in res && res.error) {
        setError(res.error);
        return;
      }
      const ok = res as { orderId: string; orderNumber: string };
      clearCart(slug);
      setOrderNumber(ok.orderNumber);
      // Auto-redirect to order tracking after a short delay
      setTimeout(() => {
        router.push(`/shop/${slug}/orders/${ok.orderNumber}`);
      }, 2500);
    });
  };

  if (!hydrated) return null;

  if (orderNumber) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <CheckCircle2 className="h-16 w-16 text-green-600" />
        <h1 className="text-xl font-bold text-green-700">สั่งซื้อสำเร็จ!</h1>
        <p className="text-center text-sm">
          เลขที่คำสั่งซื้อ: <span className="font-mono font-bold">{orderNumber}</span>
        </p>
        <p className="text-xs text-muted-foreground">กำลังพาไปยังหน้าติดตามคำสั่งซื้อ...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">ตะกร้าว่าง</p>
        <Link
          href={`/shop/${slug}/products`}
          className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          ไปเลือกสินค้า
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <nav className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card px-6 py-3">
        <Link href={`/shop/${slug}/cart`} className="flex items-center gap-1 text-sm">
          <ArrowLeft className="h-4 w-4" />
          กลับไปตะกร้า
        </Link>
        <h1 className="ml-auto font-semibold">ชำระเงิน</h1>
      </nav>

      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">สรุปคำสั่งซื้อ</h2>
          <ul className="space-y-1 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between">
                <span>
                  {i.name} × {i.qty}
                </span>
                <span>฿{(i.price * i.qty).toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-border pt-2 text-base font-bold">
            <span>รวม</span>
            <span className="text-primary">฿{total.toLocaleString()}</span>
          </div>
        </section>

        <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">ข้อมูลผู้รับ</h2>
          <Field label="ชื่อ-นามสกุล *">
            <input name="name" required className={inputCls} />
          </Field>
          <Field label="เบอร์โทรศัพท์ *">
            <input name="phone" type="tel" required className={inputCls} />
          </Field>
          <Field label="อีเมล">
            <input name="email" type="email" className={inputCls} />
          </Field>
          <Field label="ที่อยู่จัดส่ง">
            <textarea name="address" rows={3} className={inputCls} />
          </Field>

          <Field label="วิธีชำระเงิน">
            <select name="payment_method" defaultValue="transfer" className={inputCls}>
              <option value="promptpay">PromptPay (สแกน QR)</option>
              <option value="transfer">โอนเงินธนาคาร</option>
              <option value="cash_on_delivery">เก็บเงินปลายทาง</option>
            </select>
          </Field>

          <Field label="หมายเหตุ">
            <textarea name="notes" rows={2} className={inputCls} />
          </Field>

          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            ยืนยันคำสั่งซื้อ
          </button>
        </form>
      </div>
    </main>
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
