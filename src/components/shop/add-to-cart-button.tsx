'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Check } from 'lucide-react';
import { addToCart } from '@/lib/shop/cart';

interface Props {
  tenantSlug: string;
  product: {
    id: string;
    name: string;
    price: number;
    image: string | null;
    stock: number;
  };
}

export function AddToCartButton({ tenantSlug, product }: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart(tenantSlug, { ...product, qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const goCart = () => {
    addToCart(tenantSlug, { ...product, qty });
    router.push(`/shop/${tenantSlug}/cart`);
  };

  if (product.stock === 0) {
    return (
      <button
        type="button"
        disabled
        className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"
      >
        สินค้าหมด
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm">จำนวน:</span>
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="h-8 w-8 rounded-lg border border-border hover:bg-muted"
        >
          −
        </button>
        <span className="w-12 text-center font-semibold">{qty}</span>
        <button
          type="button"
          onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
          className="h-8 w-8 rounded-lg border border-border hover:bg-muted"
        >
          +
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAdd}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary bg-card px-4 py-3 text-sm font-medium text-primary hover:bg-primary/5"
        >
          {added ? (
            <>
              <Check className="h-4 w-4" />
              เพิ่มแล้ว
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              ใส่ตะกร้า
            </>
          )}
        </button>
        <button
          type="button"
          onClick={goCart}
          className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          ซื้อเลย
        </button>
      </div>
    </div>
  );
}
