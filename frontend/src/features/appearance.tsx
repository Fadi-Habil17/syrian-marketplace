'use client';
import { useEffect, useState } from 'react';
import { choose, type Locale } from '../lib/locale';

import { appearanceKey, type Appearance } from '../lib/appearance';

export function AppearanceControl({ locale }: { locale: Locale }) {
  const [preference, setPreference] = useState<Appearance>('system');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const read = () => {
      let p: Appearance = 'system';
      try {
        const stored = localStorage.getItem(appearanceKey);
        if (stored === 'light' || stored === 'dark') p = stored;
      } catch {
        /* OS fallback remains usable. */
      }
      setPreference(p);
      document.documentElement.dataset.theme = p;
      document.documentElement.style.colorScheme =
        p === 'system' ? (media.matches ? 'dark' : 'light') : p;
    };
    read();
    window.addEventListener('storage', read);
    media.addEventListener('change', read);
    return () => {
      window.removeEventListener('storage', read);
      media.removeEventListener('change', read);
    };
  }, []);
  return (
    <label className="appearance-control">
      <span className="sr-only">{choose(locale, 'المظهر', 'Appearance')}</span>
      <select
        value={preference}
        onChange={(event) => {
          const p = event.target.value as Appearance;
          setPreference(p);
          document.documentElement.dataset.theme = p;
          document.documentElement.style.colorScheme =
            p === 'system'
              ? matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light'
              : p;
          try {
            localStorage.setItem(appearanceKey, p);
            setNotice('');
          } catch {
            setNotice(
              choose(
                locale,
                'المظهر مؤقت؛ تعذّر حفظ التفضيل.',
                'Appearance changed for this visit; preference could not be saved.',
              ),
            );
          }
        }}
      >
        <option value="light">{choose(locale, 'فاتح', 'Light')}</option>
        <option value="dark">{choose(locale, 'داكن', 'Dark')}</option>
        <option value="system">{choose(locale, 'النظام', 'System')}</option>
      </select>
      <span className="sr-only" role="status">
        {notice}
      </span>
    </label>
  );
}
