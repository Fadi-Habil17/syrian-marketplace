'use client';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { closeNavigation, toggleNavigation, type RootState } from '../store/store';
import { choose, type Locale } from '../lib/locale';

export function HeaderMenu({
  locale,
  links,
}: {
  locale: Locale;
  links: { href: string; label: string }[];
}) {
  const open = useSelector((state: RootState) => state.ui.navigationOpen);
  const dispatch = useDispatch();
  return (
    <div className="mobile-menu">
      <button
        type="button"
        className="button outline"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => dispatch(toggleNavigation())}
      >
        {choose(locale, 'القائمة', 'Menu')}
      </button>
      {open && (
        <nav id="mobile-navigation">
          {links.map((link) => (
            <Link onClick={() => dispatch(closeNavigation())} key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
