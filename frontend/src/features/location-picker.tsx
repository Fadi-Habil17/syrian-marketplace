'use client';
import { useEffect, useRef, useState, useId, useMemo } from 'react';
import { loadMapLocations } from '../lib/actions/market';
import { choose, type Locale } from '../lib/locale';
import { LocationMap, type Point } from './location-map';

export function LocationPicker({
  locale,
  value,
  onChange,
  initialCityId = '',
  cityName,
}: {
  locale: Locale;
  value: Point | null;
  onChange: (point: Point | null) => void;
  initialCityId?: string;
  cityName?: string;
}) {
  const id = useId();
  const [options, setOptions] = useState<Awaited<ReturnType<typeof loadMapLocations>>>();
  const [governorate, setGovernorate] = useState('');
  const [city, setCity] = useState(initialCityId);
  const [center, setCenter] = useState<Point | null>(value);
  const [focusKey, setFocusKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const request = useRef(0);
  useEffect(() => {
    let live = true;
    const seq = ++request.current;
    void loadMapLocations(undefined, initialCityId)
      .then((result) => {
        if (!live || seq !== request.current) return;
        setOptions(result);
        setGovernorate(result.selected);
        setLoading(false);
        setError(false);
      })
      .catch(() => {
        if (live && seq === request.current) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      live = false;
    };
  }, [initialCityId, retry]);
  async function changeGovernorate(next: string) {
    const seq = ++request.current;
    setGovernorate(next);
    setCity('');
    onChange(null);
    setError(false);
    setOptions((current) => (current ? { ...current, cities: [] } : current));
    if (!next) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await loadMapLocations(next);
      if (seq === request.current) setOptions(result);
    } catch {
      if (seq === request.current) setError(true);
    } finally {
      if (seq === request.current) setLoading(false);
    }
  }
  const entries = useMemo(
    () =>
      value
        ? [
            {
              id: 'selected-location',
              point: value,
              label: choose(locale, 'اسحب الدبوس لموقعك', 'Drag the pin to your location'),
            },
          ]
        : [],
    [value, locale],
  );
  return (
    <div className="location-picker">
      <div className="location-picker-fields">
        <label htmlFor={id + '-governorate'}>
          {choose(locale, 'المحافظة', 'Governorate')}
          <select
            id={id + '-governorate'}
            value={governorate}
            disabled={loading}
            required={!!cityName}
            onChange={(event) => void changeGovernorate(event.target.value)}
          >
            <option value="">{choose(locale, 'اختر المحافظة', 'Choose a governorate')}</option>
            {options?.governors.map((item) => (
              <option key={item.id} value={item.id}>
                {locale === 'ar' ? item.nameAr : item.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={id + '-city'}>
          {choose(locale, 'المدينة', 'City')}
          <select
            id={id + '-city'}
            value={city}
            name={cityName}
            disabled={!governorate || loading}
            required={!!cityName}
            onChange={(event) => {
              const next = event.target.value;
              setCity(next);
              const point = options?.cities.find((item) => item.id === next)?.center ?? null;
              setCenter(point);
              onChange(point);
            }}
          >
            <option value="">
              {loading
                ? choose(locale, 'جارٍ تحميل المدن…', 'Loading cities…')
                : choose(locale, 'اختر المدينة', 'Choose a city')}
            </option>
            {options?.cities.map((item) => (
              <option key={item.id} value={item.id}>
                {locale === 'ar' ? item.nameAr : item.nameEn}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <button
          type="button"
          className="button primary"
          disabled={loading || !city}
          onClick={() => {
            const point = options?.cities.find((item) => item.id === city)?.center ?? null;
            setCenter(point);
            onChange(point);
            setFocusKey((key) => key + 1);
          }}
        >
          {choose(locale, 'عرض الموقع', 'Show location')}
        </button>
      </div>
      {cityName && city !== initialCityId && (
        <input type="hidden" name="areaId.__null" value="true" />
      )}
      {error && (
        <p role="alert">
          {choose(locale, 'تعذّر تحميل المواقع.', 'Could not load locations.')}{' '}
          <button
            type="button"
            className="button soft"
            onClick={() => {
              setLoading(true);
              setRetry((n) => n + 1);
            }}
          >
            {choose(locale, 'إعادة المحاولة', 'Retry')}
          </button>
        </p>
      )}
      <p className="location-picker-help" id={id + '-help'}>
        {choose(
          locale,
          'اختر محافظتك ومدينتك، ثم اسحب الدبوس إلى موقعك الدقيق. يمكنك أيضاً النقر على الخريطة أو تحريك الدبوس بأسهم لوحة المفاتيح.',
          'Choose your governorate and city, then drag the pin to your exact location. You can also click the map or move the pin with the arrow keys.',
        )}
      </p>
      <LocationMap
        locale={locale}
        center={center}
        entries={entries}
        select={onChange}
        focusKey={focusKey}
      />
      {city && !value && (
        <p role="status">
          {choose(
            locale,
            'انقر على الخريطة لوضع الدبوس في موقعك.',
            'Click the map to place your pin.',
          )}
        </p>
      )}
    </div>
  );
}
