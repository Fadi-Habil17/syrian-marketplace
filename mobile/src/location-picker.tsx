import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { api, unwrap } from './api/client';
import { useSession } from './state/session';
import { useLoad } from './use-load';
import { locationChoices } from './location-choices';
import { Select } from './select';
import { LocationMap, type Point } from './location-map';
import { Button, Copy, Failure } from './ui';

export function LocationPicker({
  value,
  onChange,
  initialCityId = '',
  initialAreaId = null,
  onLocationChange,
  disabled = false,
}: {
  value: Point | null;
  onChange: (point: Point | null) => void;
  initialCityId?: string;
  initialAreaId?: string | null;
  onLocationChange?: (city: string, area: string | null) => void;
  disabled?: boolean;
}) {
  const { locale } = useSession(),
    ar = locale === 'ar';
  const [options, setOptions] = useState<Awaited<ReturnType<typeof locationChoices>>>();
  const [governorate, setGovernorate] = useState(''),
    [city, setCity] = useState(initialCityId),
    [area, setArea] = useState(initialAreaId ?? '');
  const [center, setCenter] = useState<Point | null>(value),
    [focusKey, setFocusKey] = useState(0);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0);
  const sequence = useRef(0);
  useEffect(() => {
    let live = true;
    const id = ++sequence.current;
    void locationChoices(undefined, initialCityId)
      .then((result) => {
        if (live && id === sequence.current) {
          setOptions(result);
          setGovernorate(result.selected);
          setLoading(false);
          setError('');
        }
      })
      .catch(() => {
        if (live && id === sequence.current) {
          setError('تعذّر تحميل المواقع / Could not load locations');
          setLoading(false);
        }
      });
    return () => {
      live = false;
    };
  }, [initialCityId, retry]);
  const areas = useLoad(
    async () =>
      city
        ? unwrap(
            await api.GET('/api/v1/geography/areas', {
              params: { query: { cityId: city, limit: 100 } },
            }),
          )
        : null,
    [city],
  );
  async function chooseGovernorate(next: string) {
    const id = ++sequence.current;
    setGovernorate(next);
    setCity('');
    setArea('');
    onChange(null);
    onLocationChange?.('', null);
    setError('');
    setOptions((old) => (old ? { ...old, cities: [] } : old));
    if (!next) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await locationChoices(next);
      if (id === sequence.current) setOptions(result);
    } catch {
      if (id === sequence.current) setError(ar ? 'تعذّر تحميل المدن' : 'Could not load cities');
    } finally {
      if (id === sequence.current) setLoading(false);
    }
  }
  const name = (item: { nameAr: string; nameEn: string }) => (ar ? item.nameAr : item.nameEn);
  return (
    <View style={{ gap: 14 }}>
      <Select
        label={ar ? 'المحافظة' : 'Governorate'}
        value={governorate}
        loading={loading}
        disabled={disabled}
        placeholder={ar ? 'اختر المحافظة' : 'Choose a governorate'}
        options={(options?.governors ?? []).map((item) => ({ value: item.id, label: name(item) }))}
        onChange={(next) => void chooseGovernorate(next)}
      />
      <Select
        label={ar ? 'المدينة' : 'City'}
        value={city}
        loading={loading}
        disabled={disabled || !governorate}
        placeholder={ar ? 'اختر المدينة' : 'Choose a city'}
        options={(options?.cities ?? []).map((item) => ({ value: item.id, label: name(item) }))}
        onChange={(next) => {
          setCity(next);
          setArea('');
          onLocationChange?.(next, null);
          onChange(options?.cities.find((item) => item.id === next)?.center ?? null);
        }}
      />
      {!!areas.data?.items.length && (
        <Select
          label={ar ? 'المنطقة (اختياري)' : 'Area (optional)'}
          value={area}
          disabled={disabled}
          loading={areas.loading}
          options={[
            { value: '', label: ar ? 'المدينة كاملة' : 'Whole city' },
            ...areas.data.items.map((item) => ({ value: item.id, label: name(item) })),
          ]}
          onChange={(next) => {
            setArea(next);
            onLocationChange?.(city, next || null);
          }}
        />
      )}
      {(error || areas.error) && (
        <Failure
          message={error || areas.error}
          retry={() => {
            setLoading(true);
            setRetry((n) => n + 1);
            void areas.reload();
          }}
        />
      )}
      <Button
        title={ar ? 'عرض الموقع' : 'Show location'}
        disabled={disabled || loading || areas.loading || !city}
        onPress={() => {
          const point =
            areas.data?.items.find((item) => item.id === area)?.center ??
            options?.cities.find((item) => item.id === city)?.center ??
            null;
          setCenter(point);
          onChange(point);
          setFocusKey((n) => n + 1);
        }}
      />
      <Copy variant="muted">
        {ar
          ? 'اختر المحافظة والمدينة واضغط عرض الموقع، ثم اضغط مطولاً على الدبوس واسحبه لموقعك الدقيق.'
          : 'Choose your governorate and city, tap Show location, then press and drag the pin to your exact location.'}
      </Copy>
      <LocationMap
        ar={ar}
        center={center}
        entries={
          value
            ? [{ id: 'selected-location', point: value, label: ar ? 'موقعك' : 'Your location' }]
            : []
        }
        select={disabled ? undefined : onChange}
        focusKey={focusKey}
      />
      {!!city && !value && (
        <Copy variant="muted">
          {ar
            ? 'انقر على الخريطة لوضع الدبوس؛ قد لا يتوفر مركز لهذه المدينة.'
            : 'Tap the map to place a pin if this city has no mapped center.'}
        </Copy>
      )}
      {!!value && (
        <Button
          variant="outline"
          title={ar ? 'إزالة الدبوس' : 'Remove pin'}
          disabled={disabled}
          onPress={() => onChange(null)}
        />
      )}
    </View>
  );
}
