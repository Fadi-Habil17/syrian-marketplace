'use client';
import { useEffect, useState } from 'react';
import { choose, type Locale } from '../lib/locale';
import { appearanceKey, type Appearance } from '../lib/appearance';
import { Icon } from './icons';

export function AppearanceControl({ locale }: { locale: Locale }) {
  const [preference, setPreference] = useState<Appearance>('light');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const read = () => {
      let next: Appearance = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
      try {
        const stored = localStorage.getItem(appearanceKey);
        if (stored === 'light' || stored === 'dark') next = stored;
      } catch {
        /* The toggle remains usable without storage. */
      }
      setPreference(next);
      document.documentElement.dataset.theme = next;
      document.documentElement.style.colorScheme = next;
    };
    read();
    window.addEventListener('storage', read);
    return () => window.removeEventListener('storage', read);
  }, []);

  const dark = preference === 'dark';
  return (
    <div className="appearance-control">
      <button
        type="button"
        className="appearance-toggle"
        role="switch"
        aria-checked={dark}
        aria-label={choose(locale, 'الوضع الداكن', 'Dark mode')}
        onClick={() => {
          const next: Appearance = dark ? 'light' : 'dark';
          setPreference(next);
          document.documentElement.dataset.theme = next;
          document.documentElement.style.colorScheme = next;
          try {
            localStorage.setItem(appearanceKey, next);
            setNotice('');
          } catch {
            setNotice(
              choose(
                locale,
                'تغيّر المظهر لهذه الزيارة؛ تعذّر حفظ التفضيل.',
                'Appearance changed for this visit; preference could not be saved.',
              ),
            );
          }
        }}
      >
        <span className="setting-icon">
          <Icon name={dark ? 'moon' : 'sun'} />
        </span>
        <span className="setting-copy">
          <strong>{choose(locale, 'الوضع الداكن', 'Dark mode')}</strong>
          <span>{dark ? choose(locale, 'مفعّل', 'On') : choose(locale, 'غير مفعّل', 'Off')}</span>
        </span>
        <span className="theme-switch" aria-hidden="true">
          <span>
            <Icon name={dark ? 'moon' : 'sun'} />
          </span>
        </span>
      </button>
      <span className="sr-only" role="status">
        {notice}
      </span>
    </div>
  );
}
