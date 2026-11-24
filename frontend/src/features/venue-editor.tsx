'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { mutate } from '../lib/actions/market';
import { useActor } from './actor-scope';
import type { Point } from './location-map';
import { LocationPicker } from './location-picker';
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
  const [point, setPoint] = useState<Point | null>(initial);
  const [confirmed, confirm] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');

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
      if (!value) setPoint(null);
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
      <LocationPicker
        locale={locale}
        value={point}
        onChange={(next) => {
          setPoint(next);
          confirm(false);
        }}
      />
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
