'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { choose, type Locale } from '../lib/locale';
import { Icon, type IconName } from './icons';

export function SectionNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const sections: { path: string; label: string; icon: IconName }[] = [
    { path: 'freelance', label: choose(locale, 'العمل الحر', 'Freelance'), icon: 'briefcase' },
    { path: 'professionals', label: choose(locale, 'المهنيون', 'Professionals'), icon: 'tools' },
    { path: 'home-store', label: choose(locale, 'المتاجر المنزلية', 'Home stores'), icon: 'bag' },
  ];
  return (
    <nav
      className="section-nav"
      aria-label={choose(locale, 'أقسام السوق', 'Marketplace categories')}
    >
      <div className="site-container section-nav-inner">
        {sections.map((section) => {
          const href = '/' + locale + '/' + section.path;
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} aria-current={active ? 'page' : undefined}>
              <Icon name={section.icon} />
              <span>{section.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
