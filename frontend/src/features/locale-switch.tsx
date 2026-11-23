'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import type { Locale } from '../lib/locale';

function Switch({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const next = locale === 'ar' ? 'en' : 'ar';
  const href = pathname.replace(/^\/(ar|en)(?=\/|$)/, '/' + next);
  const params = new URLSearchParams(search);
  params.delete('cursor');
  return (
    <Link
      className="button soft language"
      href={href + (params.size ? '?' + params : '')}
      lang={next}
    >
      <span aria-hidden="true">◎</span> {next === 'ar' ? 'العربية' : 'English'}
    </Link>
  );
}
export function LocaleSwitch({ locale }: { locale: Locale }) {
  return (
    <Suspense
      fallback={
        <Link className="button soft language" href={locale === 'ar' ? '/en' : '/ar'}>
          {locale === 'ar' ? 'English' : 'العربية'}
        </Link>
      }
    >
      <Switch locale={locale} />
    </Suspense>
  );
}
