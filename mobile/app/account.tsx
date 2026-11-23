import * as Crypto from 'expo-crypto';
import { enablePush } from '../src/push';
import { useState } from 'react';
import { router } from 'expo-router';
import { useSession } from '../src/state/session';
import { api, unwrap } from '../src/api/client';
import { Page, Copy, Field, Button, Failure } from '../src/ui';
export default function Account() {
  const { user, locale, setLocale, logout, reload } = useSession();
  const ar = locale === 'ar';
  const [name, setName] = useState(user?.displayName ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    setError('');
    try {
      unwrap(
        await api.PATCH('/api/v1/me', {
          params: { header: { 'Idempotency-Key': Crypto.randomUUID() } },
          body: { displayName: name, locale },
        }),
      );
      await reload();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title={ar ? 'حسابي' : 'My account'}>
      {error && <Failure message={error} />}
      {user ? (
        <>
          <Copy>{user.email}</Copy>
          <Field label={ar ? 'الاسم' : 'Name'} value={name} onChangeText={setName} />
          <Button title={ar ? 'حفظ' : 'Save'} disabled={busy} onPress={() => void save()} />
          <Button title={ar ? 'English' : 'العربية'} onPress={() => setLocale(ar ? 'en' : 'ar')} />
          {[
            ['wallet', 'المحفظة', 'Wallet'],
            ['notifications', 'الإشعارات', 'Notifications'],
          ].map(([path, a, e]) => (
            <Button key={path} title={(ar ? a : e)!} onPress={() => router.push(`/${path}`)} />
          ))}
          <Button
            title={ar ? 'خروج' : 'Sign out'}
            onPress={() => {
              void logout()
                .then(() => router.replace('/'))
                .catch((e) => setError(String(e)));
            }}
          />
        </>
      ) : (
        <Button title={ar ? 'تسجيل الدخول' : 'Sign in'} onPress={() => router.push('/auth')} />
      )}
    </Page>
  );
}
