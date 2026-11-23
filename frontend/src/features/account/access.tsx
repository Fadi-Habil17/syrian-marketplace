import Link from 'next/link';
import { redirect } from 'next/navigation';
import { credentials, currentUser } from '../../lib/session';
import { choose, type Locale } from '../../lib/locale';
import { LoginForm, ResumeForm } from './forms';
import { Heading } from '../ui';

export async function access(locale: Locale, next: string, admin = false) {
  const [user, session] = await Promise.all([currentUser(), credentials()]);
  if (!user && !session.refreshToken)
    redirect('/' + locale + '/login?' + new URLSearchParams({ next }));
  if (!user)
    return {
      gate: (
        <section className="auth-panel">
          <Heading>{choose(locale, 'استأنف جلستك', 'Continue your session')}</Heading>
          <ResumeForm locale={locale} next={next} />
          <Link href={'/' + locale + '/login'}>
            {choose(locale, 'تسجيل الدخول مجدداً', 'Sign in again')}
          </Link>
        </section>
      ),
    };
  if (admin && !user.roles.includes('ADMIN'))
    return {
      gate: (
        <Heading>{choose(locale, 'هذه الصفحة للمشرفين', 'Administrator access required')}</Heading>
      ),
    };
  return { user, token: session.token };
}

export function SignInPrompt({ locale, next }: { locale: Locale; next: string }) {
  return (
    <div className="panel">
      <p>{choose(locale, 'سجّل الدخول للمتابعة.', 'Sign in to continue.')}</p>
      <Link
        className="button primary"
        href={'/' + locale + '/login?' + new URLSearchParams({ next })}
      >
        {choose(locale, 'تسجيل الدخول', 'Sign in')}
      </Link>
    </div>
  );
}

export function LoginPanel({ locale, next }: { locale: Locale; next?: string }) {
  return (
    <div className="auth-panel">
      <Heading>{choose(locale, 'تسجيل الدخول', 'Sign in')}</Heading>
      <LoginForm locale={locale} next={next} />
      <nav className="inline-links">
        <Link href={'/' + locale + '/register'}>
          {choose(locale, 'إنشاء حساب', 'Create an account')}
        </Link>
        <Link href={'/' + locale + '/verify-email'}>
          {choose(locale, 'تأكيد البريد', 'Verify email')}
        </Link>
        <Link href={'/' + locale + '/forgot-password'}>
          {choose(locale, 'نسيت كلمة المرور', 'Forgot password')}
        </Link>
      </nav>
    </div>
  );
}
