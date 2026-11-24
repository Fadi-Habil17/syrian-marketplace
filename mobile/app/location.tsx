import { useState } from 'react';
import { router } from 'expo-router';
import { api, unwrap } from '../src/api/client';
import { useBrowseLocation } from '../src/state/browse-location';
import { useSession } from '../src/state/session';
import { useLoad } from '../src/use-load';
import { Button, Card, Copy, Failure, Heading, Page } from '../src/ui';
import { Select } from '../src/select';
export default function Location() {
  const { locale } = useSession(),
    ar = locale === 'ar';
  const { location, setLocation } = useBrowseLocation();
  const [governorate, setGovernorate] = useState(location?.governorate ?? null),
    [city, setCity] = useState(location?.city ?? null);
  const governors = useLoad(async () =>
    unwrap(await api.GET('/api/v1/geography/governorates', { params: { query: { limit: 100 } } })),
  );
  const cities = useLoad(
    async () =>
      governorate
        ? unwrap(
            await api.GET('/api/v1/geography/cities', {
              params: { query: { governorateId: governorate.id, limit: 100 } },
            }),
          )
        : null,
    [governorate?.id],
  );
  const name = (place: { nameAr: string; nameEn: string }) => (ar ? place.nameAr : place.nameEn);
  function finish() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }
  return (
    <Page backLabel={ar ? 'العودة للسوق' : 'Marketplace'}>
      <Card>
        <Heading small>{ar ? 'اختر موقعك' : 'Choose your location'}</Heading>
        <Copy variant="muted">
          {ar
            ? 'اختر محافظة أو مدينة لتصفية النتائج في السوق.'
            : 'Choose a governorate or city to filter marketplace results.'}
        </Copy>
        {(governors.error || cities.error) && (
          <Failure
            message={governors.error || cities.error}
            retry={() => {
              void governors.reload();
              void cities.reload();
            }}
          />
        )}
        <Select
          label={ar ? 'المحافظة' : 'Governorate'}
          value={governorate?.id ?? ''}
          loading={governors.loading}
          options={(governors.data?.items ?? []).map((item) => ({
            value: item.id,
            label: name(item),
          }))}
          onChange={(id) => {
            setGovernorate(governors.data?.items.find((item) => item.id === id) ?? null);
            setCity(null);
          }}
        />
        <Select
          label={ar ? 'المدينة' : 'City'}
          value={city?.id ?? ''}
          disabled={!governorate}
          loading={cities.loading}
          options={[
            { value: '', label: ar ? 'كل المدن' : 'All cities' },
            ...(cities.data?.items ?? []).map((item) => ({ value: item.id, label: name(item) })),
          ]}
          onChange={(id) => setCity(cities.data?.items.find((item) => item.id === id) ?? null)}
        />
        <Button
          title={ar ? 'استخدم هذا الموقع' : 'Use this location'}
          disabled={!governorate || cities.loading}
          onPress={() => {
            if (governorate) {
              setLocation({ governorate, city });
              finish();
            }
          }}
        />
        <Button
          title={ar ? 'تخطّي' : 'Skip for now'}
          variant="outline"
          onPress={() => {
            setLocation(null);
            finish();
          }}
        />
      </Card>
    </Page>
  );
}
