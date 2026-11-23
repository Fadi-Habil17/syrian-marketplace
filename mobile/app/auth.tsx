import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { api, unwrap } from '../src/api/client';
import type { ApiSchemas } from '../src/api/contracts';
import { useSession } from '../src/state/session';
import { colors } from '../src/theme';
import { Page, Field, Button, Failure, Copy, Card, Heading } from '../src/ui';

type Mode = 'login' | 'register' | 'forgot' | 'verify' | 'reset';
type Role = ApiSchemas['BusinessType'] | null;
const actions = {
  login: ['تسجيل الدخول', 'Sign in'],
  register: ['إنشاء حساب', 'Create account'],
  forgot: ['نسيت كلمة المرور', 'Forgot password'],
  verify: ['تأكيد البريد', 'Verify email'],
  reset: ['إعادة تعيين كلمة المرور', 'Reset password'],
} satisfies Record<Mode, [string, string]>;
const roles = [
  [null, 'عميل', 'Customer', 'تصفح واطلب من السوق.', 'Browse and order.'],
  ['FREELANCER', 'مستقل', 'Freelancer', 'اعرض خدمات رقمية.', 'Offer digital services.'],
  ['PROFESSIONAL', 'مهني', 'Professional', 'اعرض خدماتك المحلية.', 'Offer local services.'],
  ['STORE_OWNER', 'صاحب متجر', 'Store owner', 'اعرض منتجات متجرك.', 'Offer home-store goods.'],
  [
    'DELIVERY_DRIVER',
    'سائق توصيل',
    'Delivery driver',
    'نفّذ مهام التوصيل.',
    'Deliver marketplace orders.',
  ],
] as const;

export default function Auth() {
  const { login, locale } = useSession();
  const ar = locale === 'ar';
  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<Role>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  function changeMode(next: Mode) {
    setMode(next);
    setPassword('');
    setToken('');
    setError('');
    setNotice('');
  }
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
            body: { email, password, displayName: name, locale, businessRole: role },
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
        changeMode('login');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }
  const title = (action: Mode) => actions[action][ar ? 0 : 1];
  return (
    <Page backLabel={ar ? 'العودة للسوق' : 'Marketplace'}>
      <Card>
        <Heading>{title(mode)}</Heading>
        {mode === 'login' && (
          <>
            <Copy variant="muted">{ar ? 'أهلاً بعودتك' : 'Welcome back'}</Copy>
            <Copy variant="muted">
              {ar
                ? 'سجّل دخولك لإرسال الطلبات ومتابعتها من حسابك.'
                : 'Sign in to send and track requests from your account.'}
            </Copy>
          </>
        )}
        {mode === 'register' && (
          <>
            <Copy variant="muted">
              {ar ? 'اختر دورك في دكّان و حارة.' : 'Choose your role on Dukkan & Hara.'}
            </Copy>
            <View accessibilityRole="radiogroup" style={s.roles}>
              {roles.map(([value, a, en, descAr, descEn]) => (
                <Pressable
                  key={value ?? 'customer'}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: value === role }}
                  onPress={() => setRole(value)}
                  style={[s.role, value === role && s.selected]}
                >
                  <Copy variant="label">{ar ? a : en}</Copy>
                  <Copy variant="muted" style={s.roleDescription}>
                    {ar ? descAr : descEn}
                  </Copy>
                </Pressable>
              ))}
            </View>
            <Field label={ar ? 'الاسم' : 'Name'} value={name} onChangeText={setName} />
          </>
        )}
        {error && <Failure message={error} />}
        {notice && <Copy>{notice}</Copy>}
        {['login', 'register', 'forgot'].includes(mode) && (
          <Field
            label={ar ? 'البريد الإلكتروني' : 'Email'}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="name@example.com"
          />
        )}
        {['login', 'register', 'reset'].includes(mode) && (
          <Field
            label={ar ? 'كلمة المرور' : 'Password'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder="••••••••"
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
        <Button title={title(mode)} disabled={busy} onPress={() => void submit()} />
        {mode === 'login' ? (
          <>
            <Button
              variant="link"
              title={ar ? 'جديد في السوق؟ أنشئ حساباً' : 'New to the marketplace? Create an account'}
              disabled={busy}
              onPress={() => changeMode('register')}
            />
            <Button
              variant="outline"
              title={ar ? 'تابع التصفّح كضيف' : 'Continue as a guest'}
              disabled={busy}
              onPress={() => router.navigate('/')}
            />
          </>
        ) : (
          <Button
            variant="link"
            title={title('login')}
            disabled={busy}
            onPress={() => changeMode('login')}
          />
        )}
      </Card>
      <View style={s.recovery}>
        {(['forgot', 'verify', 'reset'] as const)
          .filter((action) => action !== mode)
          .map((action) => (
            <Button
              key={action}
              variant="link"
              title={title(action)}
              disabled={busy}
              onPress={() => changeMode(action)}
            />
          ))}
      </View>
    </Page>
  );
}

const s = StyleSheet.create({
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  role: {
    width: '48%',
    minHeight: 66,
    justifyContent: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 11,
    gap: 3,
  },
  selected: { backgroundColor: colors.mint, borderColor: colors.green },
  roleDescription: { fontSize: 11, lineHeight: 17 },
  recovery: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
