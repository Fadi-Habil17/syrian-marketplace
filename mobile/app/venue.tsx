import { useEffect, useState } from 'react';
import * as Crypto from 'expo-crypto';
import { api, unwrap } from '../src/api/client';
import { useLoad } from '../src/use-load';
import { useSession } from '../src/state/session';
import { Page, Button, Field, Failure, Copy } from '../src/ui';
import { LocationMap, type Point } from '../src/location-map';
export default function Venue() {
  const { locale, user } = useSession(),
    ar = locale === 'ar',
    profileId = user?.activeBusinessProfile?.id;
  const [lat, setLat] = useState(''),
    [lon, setLon] = useState(''),
    [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [saved, setSaved] = useState(false);
  const current = useLoad(
    async () =>
      profileId
        ? unwrap(
            await api.GET('/api/v1/business-profiles/{profileId}/public-venue', {
              params: { path: { profileId } },
            }),
          )
        : null,
    [profileId],
  );
  useEffect(() => {
    setLat(current.data?.point?.latitude.toString() ?? '');
    setLon(current.data?.point?.longitude.toString() ?? '');
    setConsent(false);
  }, [current.data]);
  const point =
    lat.trim() && lon.trim() && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lon)) <= 180
      ? { latitude: Number(lat), longitude: Number(lon) }
      : null;
  async function save(value: Point | null) {
    if (!profileId) return;
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      unwrap(
        await api.PATCH('/api/v1/business-profiles/{profileId}/public-venue', {
          params: { path: { profileId }, header: { 'Idempotency-Key': Crypto.randomUUID() } },
          body: { point: value, confirmedPublic: !!value && consent },
        }),
      );
      await current.reload();
      setSaved(true);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title={ar ? 'عنوان المقر العام' : 'Public venue location'}>
      {(error || current.error) && <Failure message={error || current.error} />}
      <LocationMap
        ar={ar}
        center={point}
        entries={point ? [{ id: 'venue', point, label: ar ? 'المقر' : 'Venue' }] : []}
        select={(p) => {
          setLat(String(p.latitude));
          setLon(String(p.longitude));
          setConsent(false);
        }}
      />
      <Field
        label={ar ? 'خط العرض' : 'Latitude'}
        value={lat}
        onChangeText={(v) => {
          setLat(v);
          setConsent(false);
        }}
      />
      <Field
        label={ar ? 'خط الطول' : 'Longitude'}
        value={lon}
        onChangeText={(v) => {
          setLon(v);
          setConsent(false);
        }}
      />
      <Button
        variant="outline"
        title={
          (consent ? '✓ ' : '') +
          (ar
            ? 'أستقبل الزبائن هنا وأوافق على نشر الموقع الدقيق.'
            : 'I receive customers here and agree to publish this exact location.')
        }
        onPress={() => setConsent(!consent)}
      />
      <Button
        title={ar ? 'نشر المقر' : 'Publish venue'}
        disabled={busy || !current.data || !point || !consent}
        onPress={() => void save(point)}
      />
      {current.data?.point && (
        <Button
          title={ar ? 'سحب الموقع العام' : 'Withdraw public location'}
          disabled={busy}
          onPress={() => void save(null)}
        />
      )}
      {saved && <Copy>{ar ? 'تم الحفظ' : 'Saved'}</Copy>}
    </Page>
  );
}
