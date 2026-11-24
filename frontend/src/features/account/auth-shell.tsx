import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { choose, type Locale } from '../../lib/locale';

export function AuthShell({
  locale,
  mode,
  children,
}: {
  locale: Locale;
  mode: 'login' | 'register';
  children: ReactNode;
}) {
  const register = mode === 'register';
  return (
    <section className="auth-shell">
      <aside
        className="auth-story"
        aria-label={choose(locale, 'من حارتنا', 'From our neighbourhood')}
      >
        <Image src="/images/neighbourhood.webp" alt="" fill sizes="(min-width: 900px) 480px, 1px" />
        <div className="auth-story-copy">
          <span className="eyebrow">{choose(locale, 'دكّان و حارة', 'DUKKAN & HARA')}</span>
          <h2>
            {choose(
              locale,
              'كل حارة فيها حكاية.\nوكل حكاية إلها أهل.',
              'Every neighbourhood has a story.\nFind your people here.',
            )}
          </h2>
          <p>
            {choose(
              locale,
              'شغل بإيدين محلية، وخدمات بتقرّب المسافات.',
              'Local skills, thoughtful goods. A little closer to home.',
            )}
          </p>
          <span className="story-note">
            {choose(
              locale,
              'خدمات رقمية · مهنيون · متاجر منزلية',
              'Freelance · Local professionals · Home stores',
            )}
          </span>
        </div>
      </aside>
      <div className="auth-content">
        <Link className="auth-back" href={'/' + locale}>
          ← {choose(locale, 'العودة إلى السوق', 'Back to the marketplace')}
        </Link>
        <span className="eyebrow">
          {choose(locale, 'أهل الحارة أقرب', 'A LITTLE CLOSER TO HOME')}
        </span>
        <h1>
          {register
            ? choose(locale, 'مكانك بين أهل الحارة', 'Make yourself at home')
            : choose(locale, 'أهلاً برجعتك', 'Good to have you back')}
        </h1>
        <p className="muted">
          {register
            ? choose(
                locale,
                'حساب واحد لتشتري، تطلب خدمة، أو تبدأ شغلك.',
                'One account to shop, find a service or start your business.',
              )
            : choose(
                locale,
                'سجّل دخولك وتابع طلباتك من مطرح ما وقفت.',
                'Sign in to pick up where you left off.',
              )}
        </p>
        {children}
        <p className="auth-switch">
          {register
            ? choose(locale, 'عندك حساب؟', 'Already part of the neighbourhood?')
            : choose(locale, 'أول مرة هون؟', 'New around here?')}{' '}
          <Link href={'/' + locale + (register ? '/login' : '/register')}>
            {register
              ? choose(locale, 'سجّل الدخول', 'Sign in')
              : choose(locale, 'أنشئ حسابك', 'Create an account')}
          </Link>
        </p>
        <p className="auth-footnote">
          {choose(
            locale,
            'الدفع عبر المحاكي. لا تُستخدم أموال حقيقية.',
            'Payments are simulated. No real money is used.',
          )}
        </p>
      </div>
    </section>
  );
}
