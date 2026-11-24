import Link from 'next/link';
import { currentUser } from '../lib/session';
import { choose, type Locale } from '../lib/locale';
import { HeaderMenu } from './header-menu';
import { SectionNav } from './section-nav';
import type { IconName } from './icons';

export async function Header({ locale }: { locale: Locale }) {
  const viewer = await currentUser().catch(() => null);
  const root = '/' + locale;
  const words = viewer?.displayName.trim().split(/\s+/).filter(Boolean) ?? [];
  const letters = (word: string) => Array.from(word.normalize('NFC').replace(/\p{M}/gu, ''));
  const initials = (
    words.length > 1
      ? (letters(words[0]!)[0] ?? '') + (letters(words.at(-1)!)[0] ?? '')
      : letters(words[0] ?? '')
          .slice(0, 2)
          .join('')
  ).toLocaleUpperCase(locale);
  const account = {
    href: root + (viewer ? '/account' : '/login'),
    label: viewer
      ? choose(locale, 'حسابي', 'My account')
      : choose(locale, 'تسجيل الدخول', 'Sign in'),
    icon: 'user' as IconName,
  };
  const links = [
    { href: root, label: choose(locale, 'الرئيسية', 'Home'), icon: 'home' as IconName },
    {
      href: root + '/discover',
      label: choose(locale, 'اكتشف القريب منك', 'Discover nearby'),
      icon: 'compass' as IconName,
    },
    {
      href: root + '/freelance',
      label: choose(locale, 'العمل الحر', 'Freelance'),
      icon: 'briefcase' as IconName,
    },
    {
      href: root + '/professionals',
      label: choose(locale, 'المهنيون', 'Professionals'),
      icon: 'tools' as IconName,
    },
    {
      href: root + '/home-store',
      label: choose(locale, 'المتاجر المنزلية', 'Home stores'),
      icon: 'bag' as IconName,
    },
    account,
  ];
  return (
    <>
      <header className="site-header">
        <div className="site-container header-inner">
          <Link href={root} className="brand">
            <span className="brand-mark" aria-hidden="true">
              <span />
            </span>
            <span className="brand-name">{choose(locale, 'دكّان و حارة', 'Dukkan & Hara')}</span>
          </Link>
          <form action={root + '/search'} className="header-search" role="search">
            <input
              name="q"
              type="search"
              aria-label={choose(locale, 'ابحث في السوق', 'Search the marketplace')}
              placeholder={choose(
                locale,
                'عن شو عم تدوّر اليوم؟',
                'What are you looking for today?',
              )}
            />
          </form>
          {viewer ? (
            <Link
              className="account-avatar"
              href={account.href}
              aria-label={account.label + ': ' + viewer.displayName}
              title={viewer.displayName}
            >
              <bdi aria-hidden="true">{initials || '?'}</bdi>
            </Link>
          ) : (
            <Link className="button primary header-account" href={account.href}>
              {account.label}
            </Link>
          )}
          <HeaderMenu locale={locale} links={links} />
        </div>
      </header>
      <SectionNav locale={locale} />
    </>
  );
}
