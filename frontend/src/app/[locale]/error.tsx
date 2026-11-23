'use client';
import { usePathname } from 'next/navigation';
import { choose } from '../../lib/locale';

export default function ErrorBoundary({ reset }: { reset: () => void }) {
  const locale = usePathname().startsWith('/ar') ? 'ar' : 'en';
  return (
    <section className="empty" role="alert">
      <h1>{choose(locale, 'تعذّر تحميل الصفحة', 'We couldn’t load this page')}</h1>
      <button className="button primary" onClick={reset}>
        {choose(locale, 'حاول مجدداً', 'Try again')}
      </button>
    </section>
  );
}
