/**
 * Locale resolution. Reads the `locale` cookie, defaulting to Thai.
 *
 * Server-side helper used by RootProvider; client-side users a similar
 * pattern via `document.cookie` to flip locales without a full reload.
 */

import { cookies } from 'next/headers';

export const SUPPORTED_LOCALES = ['th', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'th';

export function isLocale(s: string): s is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(s);
}

export async function getServerLocale(): Promise<Locale> {
  const c = await cookies();
  const v = c.get('locale')?.value;
  return v && isLocale(v) ? v : DEFAULT_LOCALE;
}

export async function loadMessages(locale: Locale) {
  // Static imports keep the bundle predictable.
  if (locale === 'en') return (await import('./messages/en.json')).default;
  return (await import('./messages/th.json')).default;
}
