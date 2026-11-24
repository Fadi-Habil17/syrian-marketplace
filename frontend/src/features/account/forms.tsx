'use client';
import { useActionState, useId, useState } from 'react';
import Link from 'next/link';
import { resumeSession, signIn, mutate } from '../../lib/actions/market';
import { choose, type Locale } from '../../lib/locale';
import { errorLabel, enumLabel, field } from '../../lib/labels';
import type { ApiSchemas } from '../../lib/api/contracts';

type Errors = Partial<Record<'email' | 'password' | 'displayName', string>>;
function validate(
  email: string,
  password: string,
  locale: Locale,
  register = false,
  name = '',
): Errors {
  const e: Errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    e.email = choose(locale, 'اكتب بريدك الإلكتروني بشكل صحيح.', 'Enter a valid email address.');
  if (!password) e.password = choose(locale, 'اكتب كلمة المرور.', 'Enter your password.');
  if (
    register &&
    (Array.from(password).length < 12 || new TextEncoder().encode(password).length > 72)
  )
    e.password = choose(
      locale,
      'استخدم 12 حرفاً على الأقل، وبحد أقصى 72 بايت.',
      'Use at least 12 characters and no more than 72 UTF-8 bytes.',
    );
  if (register && !name.trim())
    e.displayName = choose(locale, 'اكتب الاسم الذي سيظهر في حسابك.', 'Enter your display name.');
  return e;
}
export function PasswordInput({
  locale,
  value,
  onChange,
  id,
  error,
  register = false,
  hint,
}: {
  locale: Locale;
  value: string;
  onChange: (value: string) => void;
  id: string;
  error?: string;
  register?: boolean;
  hint?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="auth-field">
      <label htmlFor={id}>{field(locale, 'password')}</label>
      <div className="password-input">
        <input
          id={id}
          name="password"
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={register ? 'new-password' : 'current-password'}
          dir="ltr"
          required
          aria-invalid={!!error}
          aria-describedby={error ? id + '-error' : hint ? id + '-hint' : undefined}
        />
        <button
          type="button"
          aria-controls={id}
          aria-pressed={visible}
          aria-label={
            visible
              ? choose(locale, 'إخفاء كلمة المرور', 'Hide password')
              : choose(locale, 'إظهار كلمة المرور', 'Show password')
          }
          onClick={() => setVisible(!visible)}
        >
          {visible ? choose(locale, 'إخفاء', 'Hide') : choose(locale, 'إظهار', 'Show')}
        </button>
      </div>
      {hint && (
        <small id={id + '-hint'} className="muted">
          {choose(
            locale,
            '12 حرفاً على الأقل. العربية والإنكليزية مدعومتان.',
            'At least 12 characters. Arabic and English are supported.',
          )}
        </small>
      )}
      {error && (
        <span className="field-error" id={id + '-error'}>
          {error}
        </span>
      )}
    </div>
  );
}
export function LoginForm({ locale, next }: { locale: Locale; next?: string }) {
  const [result, action, pending] = useActionState(signIn.bind(null, locale), null);
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const id = useId();
  return (
    <form
      action={action}
      className="auth-form"
      noValidate
      aria-busy={pending}
      onSubmit={(event) => {
        const e = validate(email, password, locale);
        setErrors(e);
        if (Object.keys(e).length) {
          event.preventDefault();
          event.currentTarget
            .querySelector<HTMLElement>('[name="' + Object.keys(e)[0] + '"]')
            ?.focus();
        }
      }}
    >
      {next && <input type="hidden" name="next" value={next} />}
      <div className="auth-field">
        <label htmlFor={id + '-email'}>{field(locale, 'email')}</label>
        <input
          id={id + '-email'}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          dir="ltr"
          placeholder="name@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? id + '-email-error' : undefined}
        />
        {errors.email && (
          <span className="field-error" id={id + '-email-error'}>
            {errors.email}
          </span>
        )}
      </div>
      <PasswordInput
        locale={locale}
        value={password}
        onChange={setPassword}
        id={id + '-password'}
        error={errors.password}
      />
      <Link className="auth-recovery" href={'/' + locale + '/forgot-password'}>
        {choose(locale, 'نسيت كلمة المرور؟', 'Forgot your password?')}
      </Link>
      {result && !result.ok && (
        <p role="alert" className="notice">
          {errorLabel(locale, result.code)}
        </p>
      )}
      <button className="button primary auth-submit" disabled={pending}>
        {pending
          ? choose(locale, 'جارٍ الدخول…', 'Signing in…')
          : choose(locale, 'تسجيل الدخول', 'Sign in')}{' '}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
export function RegisterForm({ locale }: { locale: Locale }) {
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [name, setName] = useState('');
  const [role, setRole] = useState<ApiSchemas['BusinessType'] | ''>('');
  const [errors, setErrors] = useState<Errors>({}),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [created, setCreated] = useState(false);
  const id = useId();
  if (created)
    return (
      <div className="registration-success" role="status">
        <span className="success-mark" aria-hidden="true">
          ✓
        </span>
        <h2>{choose(locale, 'أهلاً في الحارة!', 'You’re part of the neighbourhood!')}</h2>
        <p>
          {choose(
            locale,
            'حسابك جاهز. سجّل الدخول وابدأ باستخدام السوق.',
            'Your account is ready. Sign in to get started.',
          )}
        </p>
        <Link className="button primary" href={'/' + locale + '/login'}>
          {choose(locale, 'تسجيل الدخول', 'Sign in')}
        </Link>
      </div>
    );
  return (
    <form
      className="auth-form"
      noValidate
      aria-busy={busy}
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        const e = validate(email, password, locale, true, name);
        setErrors(e);
        if (Object.keys(e).length) {
          event.currentTarget
            .querySelector<HTMLElement>('[name="' + Object.keys(e)[0] + '"]')
            ?.focus();
          return;
        }
        setBusy(true);
        setError('');
        try {
          const result = await mutate(
            'register',
            {},
            {
              email: email.trim(),
              password,
              displayName: name.trim(),
              locale,
              businessRole: role || null,
            },
            crypto.randomUUID(),
          );
          if (!result.ok) setError(errorLabel(locale, result.code));
          else {
            setPassword('');
            setCreated(true);
          }
        } catch {
          setError(errorLabel(locale, 'CONNECTION_ERROR'));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="auth-field">
        <label htmlFor={id + '-name'}>{field(locale, 'displayName')}</label>
        <input
          id={id + '-name'}
          name="displayName"
          autoComplete="name"
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          aria-invalid={!!errors.displayName}
          aria-describedby={errors.displayName ? id + '-name-error' : undefined}
        />
        {errors.displayName && (
          <span className="field-error" id={id + '-name-error'}>
            {errors.displayName}
          </span>
        )}
      </div>
      <div className="auth-field">
        <label htmlFor={id + '-email'}>{field(locale, 'email')}</label>
        <input
          id={id + '-email'}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          dir="ltr"
          placeholder="name@example.com"
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? id + '-email-error' : undefined}
        />
        {errors.email && (
          <span className="field-error" id={id + '-email-error'}>
            {errors.email}
          </span>
        )}
      </div>
      <PasswordInput
        locale={locale}
        value={password}
        onChange={setPassword}
        id={id + '-password'}
        error={errors.password}
        register
        hint
      />
      <div className="auth-field">
        <label htmlFor={id + '-role'}>
          {choose(locale, 'كيف حابب تبدأ؟', 'How would you like to start?')}
        </label>
        <select
          id={id + '-role'}
          name="businessRole"
          value={role}
          onChange={(e) => setRole(e.target.value as typeof role)}
        >
          <option value="">
            {choose(locale, 'زبون — تصفّح واطلب', 'Customer — browse and order')}
          </option>
          {(['FREELANCER', 'PROFESSIONAL', 'STORE_OWNER', 'DELIVERY_DRIVER'] as const).map(
            (code) => (
              <option key={code} value={code}>
                {enumLabel(locale, code)}
              </option>
            ),
          )}
        </select>
        <small className="muted">
          {choose(
            locale,
            'كل أصحاب الأعمال بيقدروا يشتروا كمان.',
            'Every business account can shop, too.',
          )}
        </small>
      </div>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      <button className="button primary auth-submit" disabled={busy}>
        {busy
          ? choose(locale, 'جارٍ إنشاء الحساب…', 'Creating your account…')
          : choose(locale, 'إنشاء حساب', 'Create account')}{' '}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
export function ResumeForm({ locale, next }: { locale: Locale; next: string }) {
  const [result, action, pending] = useActionState(resumeSession.bind(null, locale), null);
  return (
    <form action={action} className="command-form">
      <input type="hidden" name="next" value={next} />
      <button className="button primary" disabled={pending}>
        {pending
          ? choose(locale, 'جارٍ الاستئناف…', 'Resuming…')
          : choose(locale, 'استئناف الجلسة', 'Continue session')}
      </button>
      {result && !result.ok && (
        <p role="alert" className="notice">
          {errorLabel(locale, result.code)}
        </p>
      )}
    </form>
  );
}
