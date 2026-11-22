import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { isLocale } from '@syrian-marketplace/i18n';
import { StoreProvider } from '../../store/provider';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Syrian Marketplace | السوق السوري',
  description: 'Architecture and repository setup. Business features are planned.',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
