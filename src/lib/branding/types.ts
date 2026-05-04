/**
 * Per-tenant branding — stored in tenants.settings.brand.
 *
 * Used by every customer-facing surface (storefront, tracking,
 * LIFF booking, inspection report, PDFs). The owner-side dashboard
 * always uses the platform default purple — branding is for what
 * customers see, not staff.
 */

export interface TenantBrand {
  primary_color: string;     // hex e.g. '#7C5BFB'
  primary_foreground: string; // hex — usually '#ffffff' for white text
  logo_url: string | null;
  display_name: string | null;
}

export const DEFAULT_BRAND: TenantBrand = {
  primary_color: '#7C5BFB',
  primary_foreground: '#ffffff',
  logo_url: null,
  display_name: null,
};

export function parseBrand(raw: unknown): TenantBrand {
  if (!raw || typeof raw !== 'object') return DEFAULT_BRAND;
  const r = raw as Partial<TenantBrand>;
  return {
    primary_color: isValidHex(r.primary_color) ? r.primary_color! : DEFAULT_BRAND.primary_color,
    primary_foreground: isValidHex(r.primary_foreground)
      ? r.primary_foreground!
      : pickContrast(r.primary_color || DEFAULT_BRAND.primary_color),
    logo_url: r.logo_url || null,
    display_name: r.display_name || null,
  };
}

export function isValidHex(s: unknown): s is string {
  return typeof s === 'string' && /^#[0-9a-fA-F]{6}$/.test(s);
}

/** Pick black or white text given a background hex, by perceived luminance. */
export function pickContrast(bg: string): string {
  if (!isValidHex(bg)) return '#ffffff';
  const r = parseInt(bg.slice(1, 3), 16);
  const g = parseInt(bg.slice(3, 5), 16);
  const b = parseInt(bg.slice(5, 7), 16);
  // Rec.709 luma
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 160 ? '#1a1a2e' : '#ffffff';
}
