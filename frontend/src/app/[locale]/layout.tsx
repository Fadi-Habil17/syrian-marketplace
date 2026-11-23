import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { StoreProvider } from '../../store/provider';
import { Header } from '../../features/header';
import { choose, localeOf } from '../../lib/locale';
import '../globals.css';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = localeOf((await params).locale);
  return {
    title: {
      default: choose(locale, 'دكّان و حارة', 'Dukkan & Hara'),
      template: choose(locale, '%s | دكّان و حارة', '%s | Dukkan & Hara'),
    },
    description: choose(
      locale,
      'سوق الأعمال المحلية والخدمات والمنتجات المنزلية في سوريا.',
      'Local services, trades and home stores across Syria.',
    ),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = localeOf((await params).locale);
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>
        <StoreProvider>
          <a className="skip" href="#content">
            {choose(locale, 'انتقل إلى المحتوى', 'Skip to content')}
          </a>
          <Header locale={locale} />
          <main id="content" className="container">
            {children}
          </main>
          <footer className="footer">
            <div className="container footer-inner">
              <Link className="brand" href={'/' + locale}>
                {choose(locale, 'دكّان و حارة', 'Dukkan & Hara')}
              </Link>
              <span>
                {choose(
                  locale,
                  'المدفوعات ضمن هذه المنصة محاكاة.',
                  'Payments on this marketplace are simulated.',
                )}
              </span>
            </div>
          </footer>
        </StoreProvider>
      </body>
    </html>
  );
}
