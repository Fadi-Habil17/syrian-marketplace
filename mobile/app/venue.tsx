import { useEffect, useState } from 'react';
import * as Crypto from 'expo-crypto';
import { api, unwrap } from '../src/api/client';
import { useLoad } from '../src/use-load';
import { useSession } from '../src/state/session';
import { Page, Button, Failure, Copy } from '../src/ui';
import type { Point } from '../src/location-map';
import { LocationPicker } from '../src/location-picker';
export default function Venue() {
  const { locale, user } = useSession(),
    ar = locale === 'ar',
    profileId = user?.activeBusinessProfile?.id;
  const [point, setPoint] = useState<Point | null>(null),
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
    setPoint(current.data?.point ?? null);
    setConsent(false);
  }, [current.data]);

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
      <LocationPicker
        value={point}
        disabled={busy || current.loading}
        onChange={(next) => {
          setPoint(next);
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
