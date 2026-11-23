import { useState } from 'react';
import * as Crypto from 'expo-crypto';
import { api, unwrap } from '../src/api/client';
import { useLoad } from '../src/use-load';
import { useSession } from '../src/state/session';
import { Page, Copy, Field, Button, Failure, Card } from '../src/ui';
export default function Addresses() {
  const { user, locale } = useSession();
  const ar = locale === 'ar';
  const [governorateId, setGovernorate] = useState('');
  const [cityId, setCity] = useState('');
  const [label, setLabel] = useState('');
  const [details, setDetails] = useState('');
  const [contactName, setName] = useState('');
  const [contactPhone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const addresses = useLoad(
    async () => (user ? unwrap(await api.GET('/api/v1/me/addresses')) : null),
    [user?.id],
  );
  const governorates = useLoad(async () => unwrap(await api.GET('/api/v1/geography/governorates')));
  const cities = useLoad(
    async () =>
      governorateId
        ? unwrap(
            await api.GET('/api/v1/geography/cities', { params: { query: { governorateId } } }),
          )
        : null,
    [governorateId],
  );
  async function save() {
    setBusy(true);
    setError('');
    try {
      unwrap(
        await api.POST('/api/v1/me/addresses', {
          params: { header: { 'Idempotency-Key': Crypto.randomUUID() } },
          body: { label, cityId, details, contactName, contactPhone },
        }),
      );
      await addresses.reload();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title={ar ? 'العناوين' : 'Addresses'}>
      {(error || addresses.error || cities.error || governorates.error) && (
        <Failure message={error || addresses.error || cities.error || governorates.error} />
      )}
      {addresses.data?.items.map((address) => (
        <Card key={address.id}>
          <Copy>{address.label}</Copy>
          <Copy>{address.details}</Copy>
        </Card>
      ))}
      {governorates.data?.items.map((item) => (
        <Button
          key={item.id}
          title={ar ? item.nameAr : item.nameEn}
          onPress={() => {
            setGovernorate(item.id);
            setCity('');
          }}
        />
      ))}
      {cities.data?.items.map((item) => (
        <Button
          key={item.id}
          title={`${cityId === item.id ? '✓ ' : ''}${ar ? item.nameAr : item.nameEn}`}
          onPress={() => setCity(item.id)}
        />
      ))}
      <Field label={ar ? 'اسم العنوان' : 'Address label'} value={label} onChangeText={setLabel} />
      <Field
        label={ar ? 'العنوان بالتفصيل' : 'Address details'}
        multiline
        value={details}
        onChangeText={setDetails}
      />
      <Field
        label={ar ? 'اسم المستلم' : 'Contact name'}
        value={contactName}
        onChangeText={setName}
      />
      <Field
        label={ar ? 'رقم الهاتف' : 'Phone'}
        keyboardType="phone-pad"
        value={contactPhone}
        onChangeText={setPhone}
      />
      <Button
        title={ar ? 'حفظ العنوان' : 'Save address'}
        disabled={busy || !cityId}
        onPress={() => void save()}
      />
    </Page>
  );
}
