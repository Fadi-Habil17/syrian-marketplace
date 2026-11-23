import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { ApiFailure } from '../lib/api/client';
import type { ApiSchemas } from '../lib/api/contracts';
import { actionLabel, enumLabel, errorLabel, field } from '../lib/labels';
import { amount, choose, localText, timestamp, type Locale } from '../lib/locale';

export async function optional<T>(promise: Promise<T>) {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ApiFailure && [403, 404, 409].includes(error.status)) return null;
    throw error;
  }
}

export function Heading({
  children,
  description,
}: {
  children: ReactNode;
  description?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <h1>{children}</h1>
      {description && <p>{description}</p>}
    </header>
  );
}
export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
export function Empty({ locale }: { locale: Locale }) {
  return <p className="empty">{choose(locale, 'لا توجد نتائج.', 'No results found.')}</p>;
}
export function Back({ locale, path, title }: { locale: Locale; path: string; title: string }) {
  return (
    <Link className="back" href={'/' + locale + path}>
      ‹ {title}
    </Link>
  );
}
export function Photo({
  id,
  alt = '',
  priority = false,
}: {
  id?: string | null;
  alt?: string;
  priority?: boolean;
}) {
  return (
    <div className="photo">
      {id ? (
        <Image
          src={'/api/media/' + id}
          alt={alt}
          fill
          unoptimized
          priority={priority}
          sizes="(max-width: 700px) 100vw, 50vw"
        />
      ) : (
        <div className="photo-placeholder" aria-hidden="true" />
      )}
    </div>
  );
}

export type CardItem = ApiSchemas['Listing'] | ApiSchemas['Product'] | ApiSchemas['Store'];
export const cardName = (locale: Locale, item: CardItem) =>
  'titleAr' in item
    ? localText(locale, item.titleAr, item.titleEn)
    : localText(locale, item.nameAr, item.nameEn);
export const cardPhoto = (item: CardItem) => ('photoIds' in item ? item.photoIds[0] : item.logoId);

export function Card({
  locale,
  item,
  section,
}: {
  locale: Locale;
  item: CardItem;
  section: string;
}) {
  const title = cardName(locale, item);
  return (
    <Link className="catalog-card" href={'/' + locale + '/' + section + '/' + item.id}>
      <Photo id={cardPhoto(item)} />
      <div className="card-copy">
        <h2>{title}</h2>
        <p>{localText(locale, item.descriptionAr, item.descriptionEn)}</p>
        {'ratingAverage' in item && item.ratingAverage !== null && (
          <span className="pill">★ {item.ratingAverage}</span>
        )}
        {'deliveryDays' in item && item.deliveryDays !== null && (
          <span className="pill">
            {item.deliveryDays} {choose(locale, 'أيام', 'days')}
          </span>
        )}
        {'price' in item && <strong className="price">{amount(locale, item.price)}</strong>}
      </div>
    </Link>
  );
}

export function NextPage({
  locale,
  cursor,
  query = {},
}: {
  locale: Locale;
  cursor?: string | null;
  query?: Record<string, string>;
}) {
  if (!cursor) return null;
  return (
    <Link
      className="button outline"
      href={'?' + new URLSearchParams({ ...query, cursor }).toString()}
    >
      {choose(locale, 'الصفحة التالية', 'Next page')}
    </Link>
  );
}

const hidden = new Set([
  'eventId',
  'requestId',
  'clientMessageId',
  'sessionId',
  'providerProfileId',
  'actorId',
  'buyerId',
  'sellerProfileId',
  'userId',
]);
export function Data({ locale, value, label }: { locale: Locale; value: unknown; label?: string }) {
  if (value === null || value === undefined) return <span>—</span>;
  if (typeof value === 'boolean')
    return <span>{value ? choose(locale, 'نعم', 'Yes') : choose(locale, 'لا', 'No')}</span>;
  if (typeof value === 'number') return <span>{new Intl.NumberFormat(locale).format(value)}</span>;
  if (typeof value === 'string') {
    if (
      label &&
      /(?:file|photo|attachment|logo).*id|id.*(?:file|photo)/i.test(label) &&
      /^[0-9a-f-]{36}$/i.test(value)
    ) {
      return <a href={'/api/media/' + value}>{choose(locale, 'تنزيل الملف', 'Download file')}</a>;
    }
    if (/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(value))
      return <time dateTime={value}>{timestamp(locale, value)}</time>;
    if (/^[A-Z][A-Z_]+$/.test(value)) return <span>{enumLabel(locale, value)}</span>;
    return <bdi>{value}</bdi>;
  }
  if (Array.isArray(value))
    return value.length ? (
      <ul className="data-list">
        {value.map((item, index) => (
          <li key={index}>
            <Data locale={locale} value={item} label={label} />
          </li>
        ))}
      </ul>
    ) : (
      <span>—</span>
    );
  if (typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  if (
    (item.currency === 'SYP' || item.currency === 'USD') &&
    typeof item.units === 'string' &&
    /^-?\d+$/.test(item.units)
  ) {
    return <bdi>{amount(locale, { currency: item.currency, units: item.units })}</bdi>;
  }
  return (
    <dl className="record">
      {Object.entries(item)
        .filter(([key, entry]) => !hidden.has(key) && entry != null)
        .map(([key, entry]) => (
          <div key={key}>
            <dt>
              {key === 'operationId' && typeof entry === 'string'
                ? actionLabel(locale, entry)
                : field(locale, key)}
            </dt>
            <dd>
              <Data locale={locale} value={entry} label={key} />
            </dd>
          </div>
        ))}
    </dl>
  );
}

export async function ReadPanel<T>({
  locale,
  title,
  request,
  render,
}: {
  locale: Locale;
  title: string;
  request: Promise<T>;
  render: (value: T) => ReactNode;
}) {
  try {
    return <Panel title={title}>{render(await request)}</Panel>;
  } catch (error) {
    if (!(error instanceof ApiFailure)) throw error;
    return (
      <Panel title={title}>
        <p className="notice">{errorLabel(locale, error.code)}</p>
      </Panel>
    );
  }
}
