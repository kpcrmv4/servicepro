'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import {
  type CartItem,
  readCart,
  updateQty,
  removeFromCart,
  cartTotal,
} from '@/lib/shop/cart';

export default function CartPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readCart(slug));
    setHydrated(true);
    const onUpdate = () => setItems(readCart(slug));
    window.addEventListener('cart:update', onUpdate);
    return () => window.removeEventListener('cart:update', onUpdate);
  }, [slug]);

  const total = cartTotal(items);

  if (!hydrated) return null;

  return (
    <main className="min-h-screen bg-background">
      <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <Link href={`/shop/${slug}/products`} className="flex items-center gap-1 text-sm">
          <ArrowLeft className="h-4 w-4" />
          กลับไปเลือกสินค้า
        </Link>
        <h1 className="font-semibold">ตะกร้าสินค้า</h1>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            ตะกร้าว่าง — ไปเลือกสินค้าเลย
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                  {it.image ? (
                    <Image
                      src={it.image}
                      alt={it.name}
                      width={64}
                      height={64}
                      unoptimized
                      className="h-16 w-16 rounded object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded bg-muted" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{it.name}</div>
                    <div className="text-sm text-muted-foreground">
                      ฿{it.price.toLocaleString()} × {it.qty} ={' '}
                      <span className="font-bold text-foreground">
                        ฿{(it.price * it.qty).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQty(slug, it.id, it.qty - 1)}
                        className="h-7 w-7 rounded border border-border"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm">{it.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(slug, it.id, it.qty + 1)}
                        className="h-7 w-7 rounded border border-border"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(slug, it.id)}
                    className="rounded border border-red-300 p-1.5 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold">ยอดรวม</span>
                <span className="font-bold text-primary">฿{total.toLocaleString()}</span>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/shop/${slug}/checkout`)}
                className="mt-4 w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                ไปหน้าชำระเงิน
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
