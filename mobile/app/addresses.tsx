import { LocationMap, locate, type Point } from '../src/location-map';
import type { ApiSchemas } from '../src/api/contracts';
import { useRef, useState } from 'react';
import { View } from 'react-native';
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
  const [editing, setEditing] = useState('');
  const [areaId, setArea] = useState<string | null>(null);
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [dirty, setDirty] = useState(false);
  const [removed, setRemoved] = useState(false);
  const generation = useRef(0);
  const [locationUnavailable, setLocationUnavailable] = useState(false);
  const point =
    lat.trim() && lon.trim() && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lon)) <= 180
      ? { latitude: Number(lat), longitude: Number(lon) }
      : null;
  function edit(a?: ApiSchemas['Address']) {
    generation.current++;
    setLocationUnavailable(false);
    setEditing(a?.id ?? '');
    setCity(a?.cityId ?? '');
    setGovernorate('');
    setArea(a?.areaId ?? null);
    setLabel(a?.label ?? '');
    setDetails(a?.details ?? '');
    setName(a?.contactName ?? '');
    setPhone(a?.contactPhone ?? '');
    setLat(a?.pin?.latitude.toString() ?? '');
    setLon(a?.pin?.longitude.toString() ?? '');
    setDirty(false);
    setRemoved(false);
    setError('');
  }
  function modify() {
    generation.current++;
    setLocationUnavailable(false);
    setDirty(true);
    setRemoved(false);
  }
  function select(p: Point) {
    modify();
    setLat(String(p.latitude));
    setLon(String(p.longitude));
  }
  async function gps() {
    setLocationUnavailable(false);
    const id = ++generation.current;
    try {
      const value = await locate();
      if (id === generation.current) select(value);
    } catch {
      if (id === generation.current) setLocationUnavailable(true);
    }
  }
  const areas = useLoad(
    async () =>
      cityId
        ? unwrap(await api.GET('/api/v1/geography/areas', { params: { query: { cityId } } }))
        : null,
    [cityId],
  );
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
      const body = {
        label,
        cityId,
        areaId,
        details,
        contactName,
        contactPhone,
        ...(dirty ? { pin: removed ? null : point } : {}),
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
      {(error || addresses.error || cities.error || governorates.error) && (
        <Failure message={error || addresses.error || cities.error || governorates.error} />
      )}
      {addresses.data?.items.map((address) => (
        <Card key={address.id}>
          <Copy>{address.label}</Copy>
          <Copy>{address.details}</Copy>
          <Button title={ar ? 'تعديل' : 'Edit address'} onPress={() => edit(address)} />
        </Card>
      ))}
      {governorates.data?.items.map((item) => (
        <Button
          key={item.id}
          title={ar ? item.nameAr : item.nameEn}
          onPress={() => {
            setGovernorate(item.id);
            setCity('');
            setArea(null);
          }}
        />
      ))}
      {cities.data?.items.map((item) => (
        <Button
          key={item.id}
          title={`${cityId === item.id ? '✓ ' : ''}${ar ? item.nameAr : item.nameEn}`}
          onPress={() => {
            setCity(item.id);
            setArea(null);
          }}
        />
      ))}
      {areas.data?.items.map((item) => (
        <Button
          key={item.id}
          variant="outline"
          title={(areaId === item.id ? '✓ ' : '') + (ar ? item.nameAr : item.nameEn)}
          onPress={() => setArea(areaId === item.id ? null : item.id)}
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
      <Copy>{ar ? 'دبوس الوجهة الخاص (اختياري)' : 'Private destination pin (optional)'}</Copy>
      <LocationMap
        ar={ar}
        center={
          point ??
          areas.data?.items.find((a) => a.id === areaId)?.center ??
          cities.data?.items.find((c) => c.id === cityId)?.center
        }
        entries={point ? [{ id: 'pin', point, label: ar ? 'الوجهة' : 'Destination' }] : []}
        select={select}
      />
      <Button title={ar ? 'استخدم موقعي' : 'Use my location'} onPress={() => void gps()} />
      {locationUnavailable && (
        <View accessible accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Copy>
            {ar
              ? 'تعذّر تحديد الموقع. أدخل النقطة يدويًا.'
              : 'Location unavailable. Enter the point manually.'}
          </Copy>
        </View>
      )}
      <Field
        label={ar ? 'خط العرض' : 'Latitude'}
        value={lat}
        onChangeText={(v) => {
          modify();
          setLat(v);
        }}
        keyboardType="numbers-and-punctuation"
      />
      <Field
        label={ar ? 'خط الطول' : 'Longitude'}
        value={lon}
        onChangeText={(v) => {
          modify();
          setLon(v);
        }}
        keyboardType="numbers-and-punctuation"
      />
      <Button
        title={ar ? 'إزالة الدبوس' : 'Remove pin'}
        variant="outline"
        onPress={() => {
          modify();
          setRemoved(true);
          setLat('');
          setLon('');
        }}
      />
      {!!editing && <Button title={ar ? 'إلغاء التعديل' : 'Cancel edit'} onPress={() => edit()} />}
      <Button
        title={ar ? 'حفظ العنوان' : 'Save address'}
        disabled={busy || !cityId || (dirty && !removed && !point)}
        onPress={() => void save()}
      />
    </Page>
  );
}
