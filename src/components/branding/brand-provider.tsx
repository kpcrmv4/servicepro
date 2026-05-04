import type { CSSProperties, ReactNode } from 'react';
import { type TenantBrand, DEFAULT_BRAND } from '@/lib/branding/types';

interface Props {
  brand: TenantBrand | null;
  children: ReactNode;
  className?: string;
}

/**
 * Scoped brand wrapper — injects --primary / --primary-foreground /
 * --ring CSS variables so every Tailwind utility that uses them
 * (bg-primary, text-primary, ring-ring, etc) automatically uses the
 * tenant's chosen color.
 *
 * Server Component on purpose — no hydration cost.
 */
export function BrandProvider({ brand, children, className = '' }: Props) {
  const b = brand ?? DEFAULT_BRAND;
  const style = {
    '--primary': b.primary_color,
    '--primary-foreground': b.primary_foreground,
    '--ring': b.primary_color,
  } as CSSProperties;

  return (
    <div style={style} className={className}>
      {children}
    </div>
  );
}
