import { BrandProvider } from '@/components/branding/brand-provider';
import { getBrandBySlug } from '@/lib/actions/branding';

/**
 * Per-tenant brand wrapper for the entire /shop/<slug>/* tree.
 * Looked up once by slug then injected as scoped CSS variables —
 * every Tailwind utility using bg-primary / text-primary picks
 * up the tenant's color automatically.
 */
export default async function ShopBrandLayout({
  params,
  children,
}: {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  return <BrandProvider brand={brand}>{children}</BrandProvider>;
}
