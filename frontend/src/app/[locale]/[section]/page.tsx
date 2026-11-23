import Link from 'next/link';
import { Catalog, sectionOf, sectionTitle } from '../../../features/catalog';
import { LoginPanel } from '../../../features/account/access';
import { CommandForm } from '../../../features/command-form';
import { Heading } from '../../../features/ui';
import { actionLabel } from '../../../lib/labels';
import { choose, localeOf, queryOf, type RouteProps } from '../../../lib/locale';

const forms = {
  register: 'register',
  'verify-email': 'verifyEmail',
  'forgot-password': 'forgotPassword',
  'reset-password': 'resetPassword',
} as const;

export async function generateMetadata({ params }: RouteProps) {
  const { locale: language, section } = await params;
  const locale = localeOf(language);
  if (section === 'login') return { title: choose(locale, 'تسجيل الدخول', 'Sign in') };
  if (section === 'search') return { title: choose(locale, 'البحث', 'Search') };
  if (Object.hasOwn(forms, section))
    return { title: actionLabel(locale, forms[section as keyof typeof forms]) };
  return { title: sectionTitle(locale, sectionOf(section)) };
}

export default async function SectionPage({ params, searchParams }: RouteProps) {
  const { locale: language, section } = await params;
  const locale = localeOf(language);
  const query = queryOf(await searchParams);
  if (section === 'login') return <LoginPanel locale={locale} next={query.next} />;
  if (Object.hasOwn(forms, section)) {
    const name = forms[section as keyof typeof forms];
    return (
      <section className="auth-panel">
        <Heading>{actionLabel(locale, name)}</Heading>
        {name === 'register' && (
          <p>
            {choose(
              locale,
              'ستحتاج إلى تأكيد بريدك الإلكتروني قبل تسجيل الدخول.',
              'Verify your email before signing in.',
            )}
          </p>
        )}
        <CommandForm
          locale={locale}
          name={name}
          initial={name === 'register' ? { locale } : {}}
          go={name === 'verifyEmail' || name === 'resetPassword' ? 'login' : undefined}
          open
        />
        <nav className="inline-links">
          <Link href={'/' + locale + '/login'}>{choose(locale, 'تسجيل الدخول', 'Sign in')}</Link>
          {name === 'register' && (
            <Link href={'/' + locale + '/verify-email'}>{actionLabel(locale, 'verifyEmail')}</Link>
          )}
          {name === 'forgotPassword' && (
            <Link href={'/' + locale + '/reset-password'}>
              {actionLabel(locale, 'resetPassword')}
            </Link>
          )}
        </nav>
      </section>
    );
  }
  const searchTerm = query.q;
  if (section === 'search')
    return (
      <>
        <Heading>{choose(locale, 'ابحث في السوق', 'Search the marketplace')}</Heading>
        <form method="get" className="search-bar">
          <label>
            {choose(locale, 'كلمة البحث', 'Search term')}
            <input name="q" type="search" defaultValue={searchTerm} required />
          </label>
          <button className="button primary">{choose(locale, 'بحث', 'Search')}</button>
        </form>
        {searchTerm && (
          <div className="stack">
            {(['freelance', 'professionals', 'home-store'] as const).map((item) => (
              <section key={item}>
                <Catalog locale={locale} section={item} query={{ q: searchTerm, limit: '6' }} />
                <Link
                  href={'/' + locale + '/' + item + '?' + new URLSearchParams({ q: searchTerm })}
                >
                  {choose(locale, 'افتح النتائج', 'Open results')}
                </Link>
              </section>
            ))}
          </div>
        )}
      </>
    );
  return <Catalog locale={locale} section={sectionOf(section)} query={query} />;
}
