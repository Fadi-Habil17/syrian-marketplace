'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ApiSchemas } from '../lib/api/contracts';
import { searchLocal } from '../lib/actions/market';
import { LocationMap, locate, type Point } from './location-map';
import type { Locale } from '../lib/locale';
import type { Choices } from './command-form';
export function Discovery({
  cityId,
  center,
  areas,
  locale,
}: {
  cityId: string;
  center?: Point | null;
  areas: Choices[string];
  locale: Locale;
}) {
  const ar = locale === 'ar',
    router = useRouter();
  const [origin, setOrigin] = useState<Point>();
  const [area, setArea] = useState('');
  const [kind, setKind] = useState<ApiSchemas['LocalSearch']['kind']>();
  const [cursor, setCursor] = useState<string>();
  const [result, setResult] = useState<ApiSchemas['LocalResults']>();
  const [error, setError] = useState(false),
    [denied, setDenied] = useState(false);
  const [retry, setRetry] = useState(0);
  const gps = useRef(0);
  useEffect(() => {
    let live = true;
    setResult(undefined);
    setError(false);
    void searchLocal({ cityId, areaId: area || undefined, kind, origin, cursor })
      .then((page) => {
        if (live) {
          if (page) setResult(page);
          else setError(true);
        }
      })
      .catch(() => {
        if (live) setError(true);
      });
    return () => {
      live = false;
    };
  }, [cityId, area, kind, origin, cursor, retry]);
  async function near() {
    const id = ++gps.current;
    try {
      const p = await locate();
      if (gps.current !== id) return;
      setDenied(false);
      setOrigin({
        latitude: Number(p.latitude.toFixed(2)),
        longitude: Number(p.longitude.toFixed(2)),
      });
    } catch {
      if (gps.current !== id) return;
      setOrigin(undefined);
      setDenied(true);
    }
    setCursor(undefined);
  }
  const href = (r: ApiSchemas['LocalResult']) =>
    '/' + locale + '/' + (r.kind === 'STORE' ? 'stores' : 'professionals') + '/' + r.detailId;
  const label = (r: ApiSchemas['LocalResult']) => (ar ? r.nameAr : r.nameEn);
  return (
    <section>
      <label>
        {ar ? 'المنطقة' : 'Area'}
        <select
          aria-label={ar ? 'المنطقة' : 'Area'}
          value={area}
          onChange={(e) => {
            setArea(e.target.value);
            setCursor(undefined);
          }}
        >
          <option value="">{ar ? 'المدينة كاملة' : 'Whole city'}</option>
          {areas.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        {ar ? 'نوع النشاط' : 'Business type'}
        <select
          aria-label={ar ? 'نوع النشاط' : 'Business type'}
          value={kind ?? ''}
          onChange={(e) => {
            setKind((e.target.value as typeof kind) || undefined);
            setCursor(undefined);
          }}
        >
          <option value="">{ar ? 'الكل' : 'All'}</option>
          <option value="STORE">{ar ? 'متاجر' : 'Stores'}</option>
          <option value="PROFESSIONAL">{ar ? 'مهنيون' : 'Professionals'}</option>
        </select>
      </label>
      <button onClick={() => void near()}>{ar ? 'بالقرب مني' : 'Near me'}</button>
      {origin && (
        <button
          onClick={() => {
            gps.current++;
            setOrigin(undefined);
            setCursor(undefined);
          }}
        >
          {ar ? 'استخدم الموقع المحدد' : 'Use selected location'}
        </button>
      )}
      {denied && (
        <p role="status">
          {ar
            ? 'تعذّر تحديد موقعك. نعرض المنطقة المحددة.'
            : 'Location unavailable. Showing the selected region.'}
        </p>
      )}
      <LocationMap
        locale={locale}
        center={origin ?? areas.find((a) => a.value === area)?.center ?? center}
        entries={(result?.items ?? []).flatMap((r) =>
          r.point
            ? [{ id: r.id, point: r.point, label: label(r), open: () => router.push(href(r)) }]
            : [],
        )}
      />
      {result?.items.some((r) => r.precision === 'APPROXIMATE') && (
        <small>
          {ar ? 'بيانات مراكز المدن' : 'City center data'} ·{' '}
          <a href="https://www.geonames.org/SY/largest-cities-in-syria.html">GeoNames</a> (
          <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>)
        </small>
      )}
      {error ? (
        <button onClick={() => setRetry((x) => x + 1)}>
          {ar ? 'تعذّر البحث. أعد المحاولة' : 'Search failed. Retry'}
        </button>
      ) : !result ? (
        <p role="status">{ar ? 'جارٍ البحث…' : 'Searching…'}</p>
      ) : (
        <>
          {!result.items.length && <p>{ar ? 'لا توجد نتائج' : 'No matching businesses'}</p>}
          <ul>
            {result.items.map((r) => (
              <li key={r.id}>
                <Link href={href(r)}>{label(r)}</Link> · {ar ? r.regionAr : r.regionEn} ·{' '}
                {r.precision === 'PUBLIC_VENUE'
                  ? ar
                    ? 'مقر يستقبل الزبائن'
                    : 'Public venue'
                  : r.point
                    ? ar
                      ? 'موقع تقريبي'
                      : 'Approximate location'
                    : ar
                      ? 'بدون دبوس'
                      : 'No map point'}
              </li>
            ))}
          </ul>
          {result.nextCursor && (
            <button onClick={() => setCursor(result.nextCursor!)}>
              {ar ? 'النتائج التالية' : 'Next results'}
            </button>
          )}
          {cursor && (
            <button onClick={() => setCursor(undefined)}>
              {ar ? 'العودة للبداية' : 'First results'}
            </button>
          )}
        </>
      )}
    </section>
  );
}
