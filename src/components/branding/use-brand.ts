'use client';

import { useEffect, useState } from 'react';
import { type TenantBrand, DEFAULT_BRAND } from '@/lib/branding/types';

/**
 * Client-side hook for client components that don't have a server
 * parent layout. Fetches /api/branding/by-slug?slug=<slug> and
 * applies the result as scoped CSS variables on a wrapper div.
 *
 * Usage:
 *   const brand = useBrand(tenantSlug);
 *   return <div style={brandStyle(brand)}>...</div>
 */
export function useBrand(slug: string | null | undefined): TenantBrand | null {
  const [brand, setBrand] = useState<TenantBrand | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/branding/by-slug?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { brand: TenantBrand | null };
        if (!cancelled && data.brand) setBrand(data.brand);
      } catch {
        /* fall back to default */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return brand;
}

export function brandStyle(brand: TenantBrand | null): React.CSSProperties {
  const b = brand ?? DEFAULT_BRAND;
  return {
    ['--primary' as string]: b.primary_color,
    ['--primary-foreground' as string]: b.primary_foreground,
    ['--ring' as string]: b.primary_color,
  };
}
