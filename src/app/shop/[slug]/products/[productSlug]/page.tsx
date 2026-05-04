import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getPublicProduct } from '@/lib/actions/shop';
import { AddToCartButton } from '@/components/shop/add-to-cart-button';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  const { slug, productSlug } = await params;
  const data = await getPublicProduct(slug, productSlug);
  if (!data) notFound();
  const { tenant, product } = data;
  const images = (product.images as string[]) || [];

  return (
    <main className="min-h-screen bg-background">
      <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <Link href={`/shop/${tenant.slug}/products`} className="flex items-center gap-1 text-sm">
          <ArrowLeft className="h-4 w-4" />
          กลับ
        </Link>
        <div className="font-semibold">{tenant.name}</div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="aspect-square overflow-hidden rounded-xl bg-muted">
              {images[0] ? (
                <Image
                  src={images[0]}
                  alt={product.name as string}
                  width={600}
                  height={600}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  ไม่มีรูป
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(1).map((url, i) => (
                  <Image
                    key={i}
                    src={url}
                    alt=""
                    width={120}
                    height={120}
                    unoptimized
                    className="aspect-square rounded object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold">{product.name as string}</h1>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                ฿{Number(product.price).toLocaleString()}
              </span>
              {product.compare_at_price &&
                Number(product.compare_at_price) > Number(product.price) && (
                  <span className="text-sm text-muted-foreground line-through">
                    ฿{Number(product.compare_at_price).toLocaleString()}
                  </span>
                )}
            </div>
            {Number(product.stock_quantity) === 0 ? (
              <div className="mt-2 inline-block rounded-full bg-red-100 px-3 py-1 text-sm text-red-700">
                สินค้าหมด
              </div>
            ) : Number(product.stock_quantity) < 5 ? (
              <div className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-700">
                เหลือเพียง {product.stock_quantity} ชิ้น
              </div>
            ) : (
              <div className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-700">
                มีสินค้า {product.stock_quantity} ชิ้น
              </div>
            )}

            {product.description && (
              <div className="mt-6">
                <h2 className="mb-2 text-sm font-semibold">รายละเอียด</h2>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {product.description as string}
                </p>
              </div>
            )}

            <div className="mt-8">
              <AddToCartButton
                tenantSlug={tenant.slug}
                product={{
                  id: product.id as string,
                  name: product.name as string,
                  price: Number(product.price),
                  image: images[0] || null,
                  stock: Number(product.stock_quantity),
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
