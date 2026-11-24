import { Select } from '../src/select';
import { useCallback, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { api, unwrap, ApiError } from '../src/api/client';
import type { ApiSchemas } from '../src/api/contracts';
import { useSession } from '../src/state/session';
import { themedStyles } from '../src/appearance';
import { Page, Field, Button, Failure, Copy, Card, Heading } from '../src/ui';

type Mode = 'login' | 'register' | 'forgot' | 'reset';
type Role = ApiSchemas['BusinessType'] | null;
const actions = {
  login: ['تسجيل الدخول', 'Sign in'],
  register: ['إنشاء حساب', 'Create account'],
  forgot: ['استعادة الحساب', 'Recover your account'],
  reset: ['كلمة مرور جديدة', 'New password'],
} satisfies Record<Mode, [string, string]>;
const roles = [
  [null, 'زبون — تصفّح واطلب', 'Customer — browse and order'],
  ['FREELANCER', 'مستقل', 'Freelancer'],
  ['PROFESSIONAL', 'مهني', 'Professional'],
  ['STORE_OWNER', 'صاحب متجر', 'Store owner'],
  ['DELIVERY_DRIVER', 'سائق توصيل', 'Delivery driver'],
] as const;
function utf8Size(s: string) {
  return Array.from(s).reduce((n, c) => {
    const p = c.codePointAt(0)!;
    return n + (p <= 127 ? 1 : p <= 2047 ? 2 : p <= 65535 ? 3 : 4);
  }, 0);
}
export default function Auth() {
  const s = useStyles();
  const { login, locale } = useSession();
  const ar = locale === 'ar';
  const [mode, setMode] = useState<Mode>('login'),
    [role, setRole] = useState<Role>(null),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [name, setName] = useState(''),
    [token, setToken] = useState(''),
    [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const emailRef = useRef<TextInput>(null),
    passwordRef = useRef<TextInput>(null),
    nameRef = useRef<TextInput>(null),
    tokenRef = useRef<TextInput>(null);
  const changeMode = useCallback((next: Mode) => {
    setMode(next);
    setPassword('');
    setToken('');
    setErrors({});
    setError('');
    setNotice('');
    setVisible(false);
  }, []);
  useFocusEffect(
    useCallback(() => {
      if (mode === 'login') return;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        changeMode('login');
        return true;
      });
      return () => subscription.remove();
    }, [mode, changeMode]),
  );
  function validate() {
    const e: Record<string, string> = {};
    if (mode === 'register' && !name.trim())
      e.name = ar ? 'اكتب الاسم الذي سيظهر في حسابك.' : 'Enter your display name.';
    if (
      ['login', 'register', 'forgot'].includes(mode) &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    )
      e.email = ar ? 'اكتب بريدك الإلكتروني بشكل صحيح.' : 'Enter a valid email address.';
    if (['login', 'register', 'reset'].includes(mode) && !password)
      e.password = ar ? 'اكتب كلمة المرور.' : 'Enter your password.';
    if (
      ['register', 'reset'].includes(mode) &&
      (Array.from(password).length < 12 || utf8Size(password) > 72)
    )
      e.password = ar
        ? 'استخدم 12 حرفاً على الأقل، وبحد أقصى 72 بايت.'
        : 'Use at least 12 characters and no more than 72 UTF-8 bytes.';
    if (mode === 'reset' && !token.trim())
      e.token = ar ? 'اكتب رمز التحقق من بريدك.' : 'Enter the token from your email.';
    setErrors(e);
    const first = Object.keys(e)[0];
    const inputs: Record<string, typeof nameRef> = {
      name: nameRef,
      email: emailRef,
      password: passwordRef,
      token: tokenRef,
    };
    inputs[first ?? '']?.current?.focus();
    return Object.keys(e).length === 0;
  }
  async function submit() {
    if (busy || !validate()) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
        router.replace('/');
      }
      if (mode === 'register') {
        unwrap(
          await api.POST('/api/v1/auth/register', {
            body: {
              email: email.trim(),
              password,
              displayName: name.trim(),
              locale,
              businessRole: role,
            },
          }),
        );
        setPassword('');
        changeMode('login');
        changeMode('login');
        setNotice(
          ar ? 'حسابك جاهز! سجّل الدخول للمتابعة.' : 'Your account is ready! Sign in to continue.',
        );
      }
      if (mode === 'forgot') {
        unwrap(await api.POST('/api/v1/auth/forgot-password', { body: { email: email.trim() } }));
        setNotice(
          ar
            ? 'إذا كان البريد مسجّلاً، ستصلك خطوات الاستعادة.'
            : 'If the address is registered, recovery instructions will arrive by email.',
        );
      }
      if (mode === 'reset') {
        unwrap(
          await api.POST('/api/v1/auth/reset-password', {
            body: { token: token.trim(), password },
          }),
        );
        changeMode('login');
        setNotice(
          ar ? 'تم تحديث كلمة المرور. سجّل دخولك.' : 'Password updated. Sign in to continue.',
        );
      }
    } catch (e) {
      const code = e instanceof ApiError ? e.code : '';
      setError(
        code === 'AUTH_REQUIRED'
          ? ar
            ? 'البريد أو كلمة المرور غير صحيحين.'
            : 'The email or password is incorrect.'
          : code === 'ACCOUNT_RESTRICTED'
            ? ar
              ? 'الحساب مقيّد. راجع الدعم أو سجل حسابك.'
              : 'This account is restricted. Review your account or contact support.'
            : code === 'RATE_LIMITED'
              ? ar
                ? 'طلبات كثيرة. انتظر قليلاً ثم جرّب.'
                : 'Too many attempts. Wait a little, then retry.'
              : code === 'VERSION_CONFLICT'
                ? ar
                  ? 'تعذّر إنشاء الحساب بهذه البيانات. جرّب تسجيل الدخول أو الاستعادة.'
                  : 'An account could not be created with these details. Try sign-in or recovery.'
                : code === 'INVALID_INPUT'
                  ? ar
                    ? 'راجع البيانات وأعد المحاولة.'
                    : 'Check the details and try again.'
                  : ar
                    ? 'تعذّر إتمام الطلب. تأكد من الاتصال وأعد المحاولة.'
                    : 'Could not complete the request. Check your connection and retry.',
      );
    } finally {
      setBusy(false);
    }
  }
  const title = (m: Mode) => actions[m][ar ? 0 : 1];
  return (
    <Page backLabel={ar ? 'العودة إلى السوق' : 'Back to the marketplace'}>
      <View style={s.intro}>
        <Copy variant="label" style={s.eyebrow}>
          {ar ? 'أهل الحارة أقرب' : 'A LITTLE CLOSER TO HOME'}
        </Copy>
        <Heading>
          {mode === 'login'
            ? ar
              ? 'أهلاً برجعتك'
              : 'Good to have you back'
            : mode === 'register'
              ? ar
                ? 'مكانك بين أهل الحارة'
                : 'Make yourself at home'
              : title(mode)}
        </Heading>
        <Copy variant="muted">
          {mode === 'register'
            ? ar
              ? 'حساب واحد لتشتري، تطلب خدمة، أو تبدأ شغلك.'
              : 'One account to shop, find a service or start your business.'
            : ar
              ? 'شغل محلي، ناس قريبين، وكل التفاصيل بمكان واحد.'
              : 'Local skills, familiar faces. Your details in one place.'}
        </Copy>
      </View>
      <Card>
        <View style={s.form}>
          {mode === 'register' && (
            <Field
              label={ar ? 'الاسم' : 'Display name'}
              value={name}
              onChangeText={setName}
              inputRef={nameRef}
              autoComplete="name"
              textContentType="name"
              maxLength={120}
              error={errors.name}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
          )}
          {['login', 'register', 'forgot'].includes(mode) && (
            <Field
              label={ar ? 'البريد الإلكتروني' : 'Email'}
              value={email}
              onChangeText={setEmail}
              inputRef={emailRef}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              placeholder="name@example.com"
              style={s.mixedInput}
              error={errors.email}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          )}
          {mode === 'reset' && (
            <Field
              label={ar ? 'رمز البريد' : 'Email token'}
              value={token}
              onChangeText={setToken}
              inputRef={tokenRef}
              autoCapitalize="none"
              autoCorrect={false}
              style={s.mixedInput}
              error={errors.token}
            />
          )}
          {['login', 'register', 'reset'].includes(mode) && (
            <Field
              label={ar ? 'كلمة المرور' : 'Password'}
              value={password}
              onChangeText={setPassword}
              inputRef={passwordRef}
              secureTextEntry={!visible}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              textContentType={mode === 'login' ? 'password' : 'newPassword'}
              style={s.mixedInput}
              error={errors.password}
              hint={
                mode === 'login'
                  ? undefined
                  : ar
                    ? '12 حرفاً على الأقل. العربية والإنكليزية مدعومتان.'
                    : 'At least 12 characters. Arabic and English are supported.'
              }
              returnKeyType="done"
              onSubmitEditing={() => void submit()}
              trailing={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    visible
                      ? ar
                        ? 'إخفاء كلمة المرور'
                        : 'Hide password'
                      : ar
                        ? 'إظهار كلمة المرور'
                        : 'Show password'
                  }
                  accessibilityState={{ selected: visible }}
                  onPress={() => setVisible(!visible)}
                  style={s.visibility}
                >
                  <Copy variant="label">
                    {visible ? (ar ? 'إخفاء' : 'Hide') : ar ? 'إظهار' : 'Show'}
                  </Copy>
                </Pressable>
              }
            />
          )}
          {mode === 'login' && (
            <Button
              variant="link"
              title={ar ? 'نسيت كلمة المرور؟' : 'Forgot your password?'}
              disabled={busy}
              onPress={() => changeMode('forgot')}
            />
          )}
          {mode === 'register' && (
            <View style={s.roleSection}>
              <Select
                label={ar ? 'كيف حابب تبدأ؟' : 'How would you like to start?'}
                value={role ?? ''}
                disabled={busy}
                options={roles.map(([value, a, en]) => ({
                  value: value ?? '',
                  label: ar ? a : en,
                }))}
                onChange={(value) => setRole((value || null) as Role)}
              />
              <Copy variant="muted">
                {ar
                  ? 'كل أصحاب الأعمال بيقدروا يشتروا كمان.'
                  : 'Every business account can shop, too.'}
              </Copy>
            </View>
          )}
          {error && <Failure message={error} />}
          {notice && (
            <View accessibilityLiveRegion="polite">
              <Copy>{notice}</Copy>
            </View>
          )}
          <Button
            title={busy ? (ar ? 'لحظة…' : 'One moment…') : title(mode)}
            disabled={busy}
            onPress={() => void submit()}
          />
        </View>
      </Card>
      <View style={s.switch}>
        <Copy variant="muted">
          {mode === 'login'
            ? ar
              ? 'أول مرة هون؟'
              : 'New around here?'
            : ar
              ? 'عندك حساب؟'
              : 'Already part of the neighbourhood?'}
        </Copy>
        <Button
          variant="link"
          title={title(mode === 'login' ? 'register' : 'login')}
          disabled={busy}
          onPress={() => changeMode(mode === 'login' ? 'register' : 'login')}
        />
      </View>
      <View style={s.recovery}>
        {(['reset'] as const)
          .filter((m) => m !== mode)
          .map((m) => (
            <Button
              key={m}
              variant="link"
              title={title(m)}
              disabled={busy}
              onPress={() => changeMode(m)}
            />
          ))}
      </View>
      <Copy variant="muted" style={s.footnote}>
        {ar
          ? 'الدفع عبر المحاكي. لا تُستخدم أموال حقيقية.'
          : 'Payments are simulated. No real money is used.'}
      </Copy>
    </Page>
  );
}
const useStyles = themedStyles((colors) =>
  StyleSheet.create({
    intro: { gap: 8, marginBottom: 8 },
    eyebrow: { color: colors.green, fontSize: 12 },
    form: { gap: 14 },
    mixedInput: { writingDirection: 'ltr', textAlign: 'left' },
    visibility: {
      minHeight: 44,
      minWidth: 62,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 10,
    },
    roleSection: { gap: 8 },
    role: {
      minHeight: 50,
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 10,
      marginBottom: 6,
    },
    selected: { backgroundColor: colors.mint, borderColor: colors.green },
    switch: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 4,
    },
    recovery: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
    footnote: { fontSize: 11, textAlign: 'center', marginBottom: 12 },
  }),
);
