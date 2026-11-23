import Link from 'next/link';
import { currentUser } from '../lib/session';
import { choose, type Locale } from '../lib/locale';
import { HeaderMenu } from './header-menu';
import { LocaleSwitch } from './locale-switch';

export async function Header({ locale }: { locale: Locale }) {
  const viewer = await currentUser().catch(() => null);
  const root = '/' + locale;
  const links = [
    { href: root + '/freelance', label: choose(locale, 'العمل الحر', 'Freelance') },
    { href: root + '/professionals', label: choose(locale, 'المهنيون', 'Professionals') },
    { href: root + '/home-store', label: choose(locale, 'المتاجر المنزلية', 'Home stores') },
  ];
  const account = {
    href: root + (viewer ? '/account' : '/login'),
    label: viewer
      ? choose(locale, 'حسابي', 'My account')
      : choose(locale, 'تسجيل الدخول', 'Sign in'),
  };
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href={root} className="brand">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          {choose(locale, 'دكّان و حارة', 'Dukkan & Hara')}
        </Link>
        <nav
          className="desktop-nav"
          aria-label={choose(locale, 'مساحات السوق', 'Marketplace workspaces')}
        >
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <form action={root + '/search'} className="header-search" role="search">
          <input
            name="q"
            type="search"
            aria-label={choose(locale, 'ابحث في السوق', 'Search the marketplace')}
            placeholder={choose(locale, 'ابحث في السوق', 'Search the marketplace')}
          />
        </form>
        <LocaleSwitch locale={locale} />
        <Link className="button primary desktop-account" href={account.href}>
          {account.label}
        </Link>
        <HeaderMenu locale={locale} links={[...links, account]} />
      </div>
    </header>
  );
}
