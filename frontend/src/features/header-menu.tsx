'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { closeNavigation, toggleNavigation, type RootState } from '../store/store';
import { choose, type Locale } from '../lib/locale';
import { AppearanceControl } from './appearance';
import { LocaleSwitch } from './locale-switch';
import { Icon, type IconName } from './icons';

export function HeaderMenu({
  locale,
  links,
}: {
  locale: Locale;
  links: { href: string; label: string; icon: IconName }[];
}) {
  const open = useSelector((state: RootState) => state.ui.navigationOpen);
  const dispatch = useDispatch();
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    dispatch(closeNavigation());
  }, [pathname, dispatch]);
  useEffect(() => {
    const panel = dialog.current;
    if (!panel) return;
    if (!open) {
      if (panel.open) panel.close();
      return;
    }
    panel.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
      if (panel.open) panel.close();
    };
  }, [open]);
  const close = () => dispatch(closeNavigation());
  return (
    <div className="sidebar-menu">
      <button
        type="button"
        className="sidebar-trigger"
        aria-label={choose(locale, 'فتح القائمة', 'Open menu')}
        aria-expanded={open}
        aria-controls="site-sidebar"
        aria-haspopup="dialog"
        onClick={() => dispatch(toggleNavigation())}
      >
        <Icon name="menu" />
      </button>
      <dialog
        ref={dialog}
        id="site-sidebar"
        className="site-sidebar"
        aria-labelledby="sidebar-title"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            close();
        }}
      >
        <div className="sidebar-heading">
          <Link className="brand" href={'/' + locale} onClick={close}>
            <span className="brand-mark" aria-hidden="true">
              <span />
            </span>
            {choose(locale, 'دكّان و حارة', 'Dukkan & Hara')}
          </Link>
          <button
            type="button"
            className="icon-button"
            aria-label={choose(locale, 'إغلاق القائمة', 'Close menu')}
            onClick={close}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="sidebar-intro">
          <span className="eyebrow">
            {choose(locale, 'أهلاً في الحارة', 'WELCOME TO THE NEIGHBOURHOOD')}
          </span>
          <h2 id="sidebar-title">
            {choose(locale, 'كل اللي بدّك ياه، أقرب.', 'Good things, closer to you.')}
          </h2>
          <p>
            {choose(
              locale,
              'تصفّح السوق وخلّي تجربتك على ذوقك.',
              'Explore the marketplace and make yourself at home.',
            )}
          </p>
        </div>
        <nav
          className="sidebar-links"
          aria-label={choose(locale, 'القائمة الرئيسية', 'Main navigation')}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              aria-current={pathname === link.href ? 'page' : undefined}
            >
              <Icon name={link.icon} />
              <span>{link.label}</span>
              <Icon name="arrow" className="directional-icon" />
            </Link>
          ))}
        </nav>
        <div className="sidebar-settings">
          <h3>{choose(locale, 'على ذوقك', 'Make it yours')}</h3>
          <div className="language-setting">
            <span className="setting-icon">
              <Icon name="globe" />
            </span>
            <span className="setting-copy">
              <strong>{choose(locale, 'اللغة', 'Language')}</strong>
              <span>{choose(locale, 'العربية', 'English')}</span>
            </span>
            <LocaleSwitch locale={locale} />
          </div>
          <AppearanceControl locale={locale} />
        </div>
        <p className="sidebar-note">
          <Icon name="heart" />
          {choose(locale, 'من حارتنا، وبمحبّة.', 'From our neighbourhood, with care.')}
        </p>
      </dialog>
    </div>
  );
}
