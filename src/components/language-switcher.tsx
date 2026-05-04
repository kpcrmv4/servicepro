'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Languages } from 'lucide-react';

/**
 * Tiny language switcher — flips a `locale` cookie and reloads.
 * Drop into any header where the user might want EN/TH toggle.
 */
export function LanguageSwitcher() {
  const t = useTranslations('language');
  const locale = useLocale();

  const switchTo = (next: 'th' | 'en') => {
    if (next === locale) return;
    document.cookie = `locale=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-xs">
      <Languages className="h-3 w-3 text-muted-foreground" />
      <button
        type="button"
        onClick={() => switchTo('th')}
        className={`px-2 py-0.5 rounded ${locale === 'th' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'}`}
      >
        {t('th')}
      </button>
      <button
        type="button"
        onClick={() => switchTo('en')}
        className={`px-2 py-0.5 rounded ${locale === 'en' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'}`}
      >
        {t('en')}
      </button>
    </div>
  );
}
