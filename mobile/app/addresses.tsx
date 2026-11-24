import { useState } from 'react';
import * as Crypto from 'expo-crypto';
import type { ApiSchemas } from '../src/api/contracts';
import { api, unwrap } from '../src/api/client';
import { useLoad } from '../src/use-load';
import { useSession } from '../src/state/session';
import { Page, Copy, Field, Button, Failure, Card } from '../src/ui';
import { LocationPicker } from '../src/location-picker';
import type { Point } from '../src/location-map';
export default function Addresses() {
  const { user, locale } = useSession(),
    ar = locale === 'ar';
  const [cityId, setCity] = useState(''),
    [areaId, setArea] = useState<string | null>(null);
  const [label, setLabel] = useState(''),
    [details, setDetails] = useState(''),
    [contactName, setName] = useState(''),
    [contactPhone, setPhone] = useState('');
  const [editing, setEditing] = useState(''),
    [point, setPoint] = useState<Point | null>(null),
    [dirty, setDirty] = useState(false),
    [editorKey, setEditorKey] = useState(0);
  const [initialLocation, setInitialLocation] = useState<{ cityId: string; areaId: string | null }>(
    { cityId: '', areaId: null },
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const addresses = useLoad(
    async () => (user ? unwrap(await api.GET('/api/v1/me/addresses')) : null),
    [user?.id],
  );
  function edit(address?: ApiSchemas['Address']) {
    setEditing(address?.id ?? '');
    setCity(address?.cityId ?? '');
    setArea(address?.areaId ?? null);
    setInitialLocation({ cityId: address?.cityId ?? '', areaId: address?.areaId ?? null });
    setLabel(address?.label ?? '');
    setDetails(address?.details ?? '');
    setName(address?.contactName ?? '');
    setPhone(address?.contactPhone ?? '');
    setPoint(address?.pin ?? null);
    setDirty(false);
    setError('');
    setEditorKey((n) => n + 1);
  }
  async function save() {
    if (busy || !cityId) return;
    setBusy(true);
    setError('');
    try {
      const body = {
        label,
        cityId,
        areaId,
        details,
        contactName,
        contactPhone,
        ...(dirty ? { pin: point } : {}),
      };
      const header = { 'Idempotency-Key': Crypto.randomUUID() };
      if (editing)
        unwrap(
          await api.PATCH('/api/v1/me/addresses/{addressId}', {
            params: { path: { addressId: editing }, header },
            body,
          }),
        );
      else unwrap(await api.POST('/api/v1/me/addresses', { params: { header }, body }));
      edit();
      await addresses.reload();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title={ar ? 'العناوين' : 'Addresses'}>
      {(error || addresses.error) && <Failure message={error || addresses.error} />}
      {addresses.data?.items.map((address) => (
        <Card key={address.id}>
          <Copy>{address.label}</Copy>
          <Copy>{address.details}</Copy>
          <Button
            title={ar ? 'تعديل' : 'Edit address'}
            disabled={busy}
            onPress={() => edit(address)}
          />
        </Card>
      ))}
      <Card>
        <LocationPicker
          key={editorKey}
          value={point}
          initialCityId={initialLocation.cityId}
          initialAreaId={initialLocation.areaId}
          disabled={busy}
          onLocationChange={(city, area) => {
            setCity(city);
            setArea(area);
          }}
          onChange={(next) => {
            setPoint(next);
            setDirty(true);
          }}
        />
        <Field
          label={ar ? 'اسم العنوان' : 'Address label'}
          value={label}
          onChangeText={setLabel}
          editable={!busy}
        />
        <Field
          label={ar ? 'العنوان بالتفصيل' : 'Address details'}
          value={details}
          onChangeText={setDetails}
          multiline
          editable={!busy}
        />
        <Field
          label={ar ? 'اسم المستلم' : 'Contact name'}
          value={contactName}
          onChangeText={setName}
          editable={!busy}
        />
        <Field
          label={ar ? 'رقم الهاتف' : 'Phone'}
          value={contactPhone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={!busy}
        />
        {!!editing && (
          <Button
            title={ar ? 'إلغاء التعديل' : 'Cancel edit'}
            variant="outline"
            disabled={busy}
            onPress={() => edit()}
          />
        )}
        <Button
          title={ar ? 'حفظ العنوان' : 'Save address'}
          disabled={busy || !cityId}
          onPress={() => void save()}
        />
      </Card>
    </Page>
  );
}
