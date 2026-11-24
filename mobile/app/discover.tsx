import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { api, unwrap } from '../src/api/client';
import type { ApiSchemas } from '../src/api/contracts';
import { useLoad } from '../src/use-load';
import { useSession } from '../src/state/session';
import { useBrowseLocation } from '../src/state/browse-location';
import { Page, Button, Copy, Busy, Failure, Card } from '../src/ui';
import { LocationMap, locate, type Point } from '../src/location-map';
export default function Discover() {
  const { location } = useBrowseLocation(),
    { locale } = useSession(),
    ar = locale === 'ar';
  return (
    <Page title={ar ? 'استكشف بالقرب منك' : 'Explore nearby'}>
      <Button
        variant="outline"
        title={
          location?.city
            ? ar
              ? location.city.nameAr
              : location.city.nameEn
            : ar
              ? 'اختر المدينة'
              : 'Choose city'
        }
        onPress={() => router.push('/location')}
      />
      {location?.city && (
        <Results
          key={location.city.id}
          ar={ar}
          cityId={location.city.id}
          cityCenter={location.city.center}
        />
      )}
    </Page>
  );
}
function Results({
  cityId,
  cityCenter,
  ar,
}: {
  cityId: string;
  cityCenter?: Point | null;
  ar: boolean;
}) {
  const [area, setArea] = useState<string>(),
    [kind, setKind] = useState<ApiSchemas['LocalSearch']['kind']>();
  const [cursor, setCursor] = useState<string>(),
    [origin, setOrigin] = useState<Point>(),
    [denied, setDenied] = useState(false);
  const sequence = useRef(0);
  const areas = useLoad(
    async () =>
      unwrap(
        await api.GET('/api/v1/geography/areas', { params: { query: { cityId, limit: 100 } } }),
      ),
    [cityId],
  );
  const result = useLoad(
    async () =>
      unwrap(
        await api.POST('/api/v1/discovery/local/search', {
          body: { cityId, areaId: area, kind, cursor, origin },
        }),
      ),
    [cityId, area, kind, cursor, origin],
  );
  const entries = result.error || result.loading ? [] : (result.data?.items ?? []);
  async function near() {
    const id = ++sequence.current;
    try {
      const p = await locate();
      if (sequence.current !== id) return;
      setDenied(false);
      setOrigin({
        latitude: Number(p.latitude.toFixed(2)),
        longitude: Number(p.longitude.toFixed(2)),
      });
    } catch {
      if (sequence.current !== id) return;
      setDenied(true);
      setOrigin(undefined);
    }
    setCursor(undefined);
  }
  const open = (r: ApiSchemas['LocalResult']) =>
    router.push({
      pathname: r.kind === 'STORE' ? '/store' : '/listing',
      params: { id: r.detailId },
    });
  return (
    <>
      <Button
        variant="outline"
        title={ar ? 'المدينة كاملة' : 'Whole city'}
        onPress={() => {
          setArea(undefined);
          setCursor(undefined);
        }}
      />
      {areas.data?.items.map((a) => (
        <Button
          key={a.id}
          variant="outline"
          title={(area === a.id ? '✓ ' : '') + (ar ? a.nameAr : a.nameEn)}
          onPress={() => {
            setArea(a.id);
            setCursor(undefined);
          }}
        />
      ))}
      {[undefined, 'STORE', 'PROFESSIONAL'].map((k, i) => (
        <Button
          key={i}
          variant="outline"
          title={
            (kind === k ? '✓ ' : '') +
            (ar ? ['الكل', 'متاجر', 'مهنيون'] : ['All', 'Stores', 'Professionals'])[i]
          }
          onPress={() => {
            setKind(k as typeof kind);
            setCursor(undefined);
          }}
        />
      ))}
      <Button title={ar ? 'بالقرب مني' : 'Near me'} onPress={() => void near()} />
      {origin && (
        <Button
          title={ar ? 'استخدم الموقع المحدد' : 'Use selected location'}
          onPress={() => {
            sequence.current++;
            setOrigin(undefined);
            setCursor(undefined);
          }}
        />
      )}
      {denied && (
        <Copy>
          {ar
            ? 'تعذّر تحديد موقعك. نعرض المنطقة المحددة.'
            : 'Location unavailable. Showing the selected region.'}
        </Copy>
      )}
      <LocationMap
        ar={ar}
        center={origin ?? areas.data?.items.find((a) => a.id === area)?.center ?? cityCenter}
        entries={entries.flatMap((r) =>
          r.point
            ? [{ id: r.id, point: r.point, label: ar ? r.nameAr : r.nameEn, open: () => open(r) }]
            : [],
        )}
      />
      {entries.some((r) => r.precision === 'APPROXIMATE') && (
        <Copy>{ar ? 'بيانات مراكز المدن' : 'City center data'} · GeoNames (CC BY 4.0)</Copy>
      )}
      {result.loading && <Busy />}
      {(areas.error || result.error) && (
        <Failure
          message={areas.error || result.error}
          retry={() => {
            void areas.reload();
            void result.reload();
          }}
        />
      )}
      {result.data && !result.loading && !result.error && !entries.length && (
        <Copy>{ar ? 'لا توجد نتائج' : 'No matching businesses'}</Copy>
      )}
      {entries.map((r) => (
        <Card key={r.id}>
          <Button title={ar ? r.nameAr : r.nameEn} onPress={() => open(r)} />
          <Copy>
            {ar ? r.regionAr : r.regionEn} ·{' '}
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
          </Copy>
        </Card>
      ))}
      {result.data?.nextCursor && (
        <Button
          title={ar ? 'النتائج التالية' : 'Next results'}
          onPress={() => setCursor(result.data!.nextCursor!)}
        />
      )}
      {cursor && (
        <Button
          title={ar ? 'العودة للبداية' : 'First results'}
          onPress={() => setCursor(undefined)}
        />
      )}
    </>
  );
}
