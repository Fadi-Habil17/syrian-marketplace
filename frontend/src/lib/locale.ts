import { isLocale } from '@syrian-marketplace/i18n';
import { notFound } from 'next/navigation';
import type { ApiSchemas } from './api/contracts';
import { formatMoney } from './money';

export type Locale = 'ar' | 'en';
export type RouteProps = {
  params: Promise<{ locale: string; id: string; section: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function localeOf(value: string): Locale {
  if (!isLocale(value)) notFound();
  return value;
}

export function choose(locale: Locale, ar: string, en: string) {
  return locale === 'ar' ? ar : en;
}

export function localText(locale: Locale, ar?: string | null, en?: string | null) {
  return (locale === 'ar' ? ar || en : en || ar) || '';
}

export function amount(locale: Locale, money?: ApiSchemas['Money'] | null) {
  if (!money) return '—';
  return formatMoney(locale, money.currency, money.units);
}

export function timestamp(locale: Locale, date?: string | null) {
  return date
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Damascus',
      }).format(new Date(date))
    : '—';
}

export function queryOf(search: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(search).flatMap(([key, value]) =>
      typeof value === 'string' ? [[key, value]] : [],
    ),
  );
}
