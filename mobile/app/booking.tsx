import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { api, unwrap } from '../src/api/client';
import { useLoad } from '../src/use-load';
import { useSession } from '../src/state/session';
import { Page, Copy, Field, Button, Failure, Busy } from '../src/ui';
export default function Booking() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { locale, user } = useSession();
  const ar = locale === 'ar';
  const [addressId, setAddress] = useState('');
  const [startsAt, setStart] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const addresses = useLoad(
    async () => (user ? unwrap(await api.GET('/api/v1/me/addresses')) : null),
    [user?.id],
  );
  async function submit() {
    setBusy(true);
    setError('');
    try {
      const start = new Date(startsAt);
      if (!Number.isFinite(start.getTime()))
        throw new Error(ar ? 'التاريخ غير صحيح' : 'Invalid date');
      const order = unwrap(
        await api.POST('/api/v1/orders/professional-bookings', {
          params: { header: { 'Idempotency-Key': Crypto.randomUUID() } },
          body: {
            listingId: id,
            addressId,
            startsAt: start.toISOString(),
            description: description || undefined,
          },
        }),
      );
      router.replace({ pathname: '/order', params: { id: order.id } });
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title={ar ? 'طلب حجز مهني' : 'Book a professional'}>
      {(error || addresses.error) && <Failure message={error || addresses.error} />}
      {addresses.loading && <Busy />}
      {addresses.data?.items.map((address) => (
        <Button
          key={address.id}
          title={`${addressId === address.id ? '✓ ' : ''}${address.label} · ${address.details}`}
          onPress={() => setAddress(address.id)}
        />
      ))}
      <Button
        title={ar ? 'إدارة العناوين' : 'Manage addresses'}
        onPress={() => router.push('/addresses')}
      />
      <Field
        label={
          ar
            ? 'الموعد مع المنطقة الزمنية، مثل 2026-12-01T10:00:00+03:00'
            : 'Start with time zone, e.g. 2026-12-01T10:00:00+03:00'
        }
        value={startsAt}
        onChangeText={setStart}
        autoCapitalize="none"
      />
      <Field
        label={ar ? 'تفاصيل العمل' : 'Job details'}
        multiline
        value={description}
        onChangeText={setDescription}
      />
      <Copy>
        {ar
          ? 'يؤكد المهني الموعد قبل إتاحة دفعة البداية.'
          : 'The professional confirms the schedule before a deposit can be funded.'}
      </Copy>
      <Button
        title={ar ? 'إرسال الطلب' : 'Send request'}
        disabled={busy || !addressId || !startsAt}
        onPress={() => void submit()}
      />
    </Page>
  );
}
