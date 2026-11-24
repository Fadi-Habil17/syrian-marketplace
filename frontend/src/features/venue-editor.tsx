'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { mutate } from '../lib/actions/market';
import { useActor } from './actor-scope';
import { LocationMap, type Point } from './location-map';
import type { Locale } from '../lib/locale';
export function VenueEditor({
  locale,
  profileId,
  initial,
}: {
  locale: Locale;
  profileId: string;
  initial: Point | null;
}) {
  const ar = locale === 'ar',
    actor = useActor(),
    router = useRouter();
  const [lat, setLat] = useState(initial?.latitude.toString() ?? ''),
    [lon, setLon] = useState(initial?.longitude.toString() ?? '');
  const [confirmed, confirm] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const point =
    lat.trim() && lon.trim() && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lon)) <= 180
      ? { latitude: Number(lat), longitude: Number(lon) }
      : null;
  async function save(value: Point | null) {
    setBusy(true);
    try {
      const r = await mutate(
        'setPublicVenue',
        { profileId },
        { point: value, confirmedPublic: !!value && confirmed },
        crypto.randomUUID(),
        undefined,
        actor,
      );
      if (!r.ok) throw Error();
      if (!value) {
        setLat('');
        setLon('');
      }
      confirm(false);
      setMessage(ar ? 'تم الحفظ' : 'Saved');
      router.refresh();
    } catch {
      setMessage(ar ? 'تعذّر حفظ الموقع' : 'Could not save location');
    } finally {
      setBusy(false);
    }
  }
  return (
    <fieldset disabled={busy}>
      <legend>{ar ? 'عنوان المقر العام' : 'Public venue location'}</legend>
      <LocationMap
        locale={locale}
        center={point}
        entries={point ? [{ id: 'venue', point, label: ar ? 'المقر' : 'Venue' }] : []}
        select={(p) => {
          setLat(String(p.latitude));
          setLon(String(p.longitude));
          confirm(false);
        }}
      />
      <label>
        {ar ? 'خط العرض' : 'Latitude'}
        <input
          type="number"
          step="any"
          value={lat}
          onChange={(e) => {
            setLat(e.target.value);
            confirm(false);
          }}
        />
      </label>
      <label>
        {ar ? 'خط الطول' : 'Longitude'}
        <input
          type="number"
          step="any"
          value={lon}
          onChange={(e) => {
            setLon(e.target.value);
            confirm(false);
          }}
        />
      </label>
      <label>
        <input type="checkbox" checked={confirmed} onChange={(e) => confirm(e.target.checked)} />
        {ar
          ? 'أستقبل الزبائن في هذا المقر وأوافق على نشر الموقع الدقيق.'
          : 'I receive customers here and agree to publish this exact location.'}
      </label>
      <button disabled={!confirmed || !point} onClick={() => void save(point)}>
        {ar ? 'نشر المقر' : 'Publish venue'}
      </button>
      {initial && (
        <button onClick={() => void save(null)}>
          {ar ? 'سحب الموقع العام' : 'Withdraw public location'}
        </button>
      )}
      <p role="status">{message}</p>
    </fieldset>
  );
}
