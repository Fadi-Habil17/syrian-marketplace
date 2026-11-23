'use client';
import { useActionState } from 'react';
import { resumeSession, signIn } from '../../lib/actions/market';
import { choose, type Locale } from '../../lib/locale';
import { errorLabel, field } from '../../lib/labels';

export function LoginForm({ locale, next }: { locale: Locale; next?: string }) {
  const [result, action, pending] = useActionState(signIn.bind(null, locale), null);
  return (
    <form action={action} className="command-form">
      {next && <input type="hidden" name="next" value={next} />}
      <label>
        {field(locale, 'email')}
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        {field(locale, 'password')}
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      <button className="button primary" disabled={pending}>
        {pending
          ? choose(locale, 'جارٍ الدخول…', 'Signing in…')
          : choose(locale, 'تسجيل الدخول', 'Sign in')}
      </button>
      {result && !result.ok && (
        <p role="alert" className="notice">
          {errorLabel(locale, result.code)}
        </p>
      )}
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
