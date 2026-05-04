'use client';

import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

interface Props {
  locale: string;
  messages: Record<string, unknown>;
  children: ReactNode;
}

export function I18nProvider({ locale, messages, children }: Props) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Bangkok">
      {children}
    </NextIntlClientProvider>
  );
}
