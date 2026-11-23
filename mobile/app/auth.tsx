import { useState } from 'react';
import { router } from 'expo-router';
import { api, unwrap } from '../src/api/client';
import { useSession } from '../src/state/session';
import { Page, Field, Button, Failure, Copy } from '../src/ui';
export default function Auth() {
  const { login, locale } = useSession();
  const ar = locale === 'ar';
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'verify' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function submit() {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (mode === 'login') {
        await login(email, password);
        router.replace('/');
      }
      if (mode === 'register') {
        unwrap(
          await api.POST('/api/v1/auth/register', {
            body: { email, password, displayName: name, locale },
          }),
        );
        setNotice(ar ? 'تحقق من بريدك ثم سجّل الدخول' : 'Verify your email, then sign in');
      }
      if (mode === 'forgot') {
        unwrap(await api.POST('/api/v1/auth/forgot-password', { body: { email } }));
        setNotice(ar ? 'راجع بريدك الإلكتروني' : 'Check your email');
      }
      if (mode === 'verify') {
        unwrap(await api.POST('/api/v1/auth/verify-email', { body: { token } }));
        setNotice(ar ? 'تم التحقق' : 'Email verified');
      }
      if (mode === 'reset') {
        unwrap(await api.POST('/api/v1/auth/reset-password', { body: { token, password } }));
        setMode('login');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title={ar ? 'أهلاً فيك' : 'Welcome'}>
      {error && <Failure message={error} />}
      {notice && <Copy>{notice}</Copy>}
      {mode === 'register' && (
        <Field label={ar ? 'الاسم' : 'Name'} value={name} onChangeText={setName} />
      )}
      {['login', 'register', 'forgot'].includes(mode) && (
        <Field
          label={ar ? 'البريد الإلكتروني' : 'Email'}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
      )}
      {['login', 'register', 'reset'].includes(mode) && (
        <Field
          label={ar ? 'كلمة المرور' : 'Password'}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
      )}
      {['verify', 'reset'].includes(mode) && (
        <Field
          label={ar ? 'رمز البريد' : 'Email token'}
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
        />
      )}
      <Button title={ar ? 'متابعة' : 'Continue'} disabled={busy} onPress={() => void submit()} />
      {(['login', 'register', 'forgot', 'verify', 'reset'] as const).map((m, i) => (
        <Button
          key={m}
          disabled={busy}
          title={
            (ar
              ? [
                  'دخول',
                  'إنشاء حساب',
                  'نسيت كلمة المرور',
                  'تأكيد البريد',
                  'إعادة تعيين كلمة المرور',
                ]
              : ['Sign in', 'Create account', 'Forgot password', 'Verify email', 'Reset password'])[
              i
            ]!
          }
          onPress={() => {
            setMode(m);
            setError('');
            setNotice('');
          }}
        />
      ))}
    </Page>
  );
}
