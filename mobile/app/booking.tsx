import * as ImagePicker from 'expo-image-picker';
import type { ApiSchemas } from '../src/api/contracts';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { api, unwrap } from '../src/api/client';
import { useLoad } from '../src/use-load';
import { useSession } from '../src/state/session';
import { Page, Copy, Field, Button, Failure, Busy } from '../src/ui';
export default function Booking() {
  const {
    id = '',
    provider,
    currency,
  } = useLocalSearchParams<{ id: string; provider?: string; currency?: string }>();
  const [photo, setPhoto] = useState<ApiSchemas['FileMetadata']>();
  async function pick() {
    setBusy(true);
    setError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
      if (result.canceled) return;
      const asset = result.assets[0]!;
      const form = new FormData();
      form.append('accessClass', 'ORDER_SHARED');
      form.append('file', {
        uri: asset.uri,
        name: asset.fileName ?? 'inspection.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      } as unknown as Blob);
      setPhoto(
        unwrap(
          await api.POST('/api/v1/files/uploads', {
            params: { header: { 'Idempotency-Key': Crypto.randomUUID() } },
            body: { accessClass: 'ORDER_SHARED', file: 'binary' },
            bodySerializer: () => form,
          }),
        ),
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
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
      if (provider && photo) {
        const scanned = unwrap(
          await api.GET('/api/v1/files/{fileId}/status', {
            params: { path: { fileId: photo.id } },
          }),
        );
        if (scanned.scanStatus !== 'CLEAN')
          throw new Error(
            ar
              ? 'الصورة غير جاهزة. تحقق من الفحص أو اختر صورة أخرى.'
              : 'Photo unavailable. Check its scan or select another image.',
          );
        const order = unwrap(
          await api.POST('/api/v1/orders/inspection-requests', {
            params: { header: { 'Idempotency-Key': Crypto.randomUUID() } },
            body: {
              providerProfileId: provider,
              currency: currency === 'USD' ? 'USD' : 'SYP',
              addressId,
              description,
              photoIds: [photo.id],
            },
          }),
        );
        router.replace({ pathname: '/order', params: { id: order.id } });
        return;
      }
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
    <Page
      title={
        provider
          ? ar
            ? 'طلب معاينة'
            : 'Request inspection'
          : ar
            ? 'طلب حجز مهني'
            : 'Book a professional'
      }
    >
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
      {provider ? (
        <Button
          title={
            photo
              ? ar
                ? 'تغيير الصورة'
                : 'Change photo'
              : ar
                ? 'إرفاق صورة'
                : 'Attach inspection photo'
          }
          onPress={() => void pick()}
          disabled={busy}
        />
      ) : (
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
      )}
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
        disabled={busy || !addressId || (provider ? !photo || !description.trim() : !startsAt)}
        onPress={() => void submit()}
      />
    </Page>
  );
}
