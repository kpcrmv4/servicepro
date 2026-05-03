import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { getPublicShop } from '@/lib/actions/shop';

export default async function PublicShopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicShop(slug);
  if (!data) notFound();
  const { tenant, products } = data;

  return (
    <main className="min-h-screen bg-background">
      <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <div className="font-semibold">
          <Link href={`/shop/${tenant.slug}`}>{tenant.name}</Link>
          <span className="ml-2 text-xs text-muted-foreground">— ร้านค้าออนไลน์</span>
        </div>
        <Link
          href={`/shop/${tenant.slug}/cart`}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
        >
          <ShoppingCart className="h-4 w-4" />
          ตะกร้า
        </Link>
      </nav>

      <section className="px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold">สินค้าทั้งหมด</h1>
          <p className="text-sm text-muted-foreground">{products.length} รายการ</p>

          {products.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground">ยังไม่มีสินค้าในร้าน</p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => {
                const img = (p.images as string[] | null)?.[0];
                const onSale = p.compare_at_price && Number(p.compare_at_price) > Number(p.price);
                return (
                  <Link
                    key={p.id as string}
                    href={`/shop/${tenant.slug}/products/${p.slug}`}
                    className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md"
                  >
                    <div className="relative aspect-square bg-muted">
                      {img ? (
                        <Image
                          src={img}
                          alt={p.name as string}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          ไม่มีรูป
                        </div>
                      )}
                      {p.is_featured && (
                        <span className="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] text-white">
                          แนะนำ
                        </span>
                      )}
                      {onSale && (
                        <span className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-[11px] text-white">
                          ลดราคา
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="line-clamp-2 text-sm font-medium group-hover:text-primary">
                        {p.name as string}
                      </h3>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-base font-bold">
                          ฿{Number(p.price).toLocaleString()}
                        </span>
                        {onSale && (
                          <span className="text-xs text-muted-foreground line-through">
                            ฿{Number(p.compare_at_price).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {Number(p.stock_quantity) === 0 && (
                        <div className="mt-1 text-[11px] text-red-600">หมด</div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
