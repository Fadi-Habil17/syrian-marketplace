import Link from 'next/link';
import { choose, type Locale } from '../lib/locale';
import { Icon } from './icons';

export function Footer({ locale }: { locale: Locale }) {
  const root = '/' + locale;
  const groups = [
    {
      title: choose(locale, 'اكتشف السوق', 'Explore the market'),
      links: [
        [root + '/freelance', choose(locale, 'العمل الحر', 'Freelance services')],
        [root + '/professionals', choose(locale, 'المهنيون', 'Local professionals')],
        [root + '/home-store', choose(locale, 'المتاجر المنزلية', 'Home stores')],
        [root + '/discover', choose(locale, 'اكتشف القريب منك', 'Discover nearby')],
      ],
    },
    {
      title: choose(locale, 'حارتك وحسابك', 'Your neighbourhood'),
      links: [
        [root + '/account', choose(locale, 'حسابي', 'My account')],
        [root + '/orders', choose(locale, 'طلباتي', 'My orders')],
        [root + '/wallet', choose(locale, 'المحفظة', 'My wallet')],
        [root + '/workspace', choose(locale, 'مساحة عملي', 'My workspace')],
      ],
    },
    {
      title: choose(locale, 'خلّينا نبدأ', 'Make yourself at home'),
      links: [
        [root + '/#how-it-works', choose(locale, 'كيف بيشتغل السوق؟', 'How it works')],
        [root + '/register', choose(locale, 'انضم للحارة', 'Join the neighbourhood')],
        [root + '/login', choose(locale, 'تسجيل الدخول', 'Sign in')],
      ],
    },
  ];
  return (
    <footer className="footer">
      <div className="site-container">
        <div className="footer-values">
          <span>
            <Icon name="heart" />
            {choose(locale, 'ندعم الشغل المحلي', 'Supporting local talent')}
          </span>
          <span>
            <Icon name="compass" />
            {choose(locale, 'من كل حارات سوريا', 'From neighbourhoods across Syria')}
          </span>
          <span>
            <Icon name="shield" />
            {choose(locale, 'تفاصيل واضحة، من البداية', 'Clear details, from the start')}
          </span>
        </div>
        <div className="footer-grid">
          <div className="footer-about">
            <Link className="brand" href={root}>
              <span className="brand-mark" aria-hidden="true">
                <span />
              </span>
              {choose(locale, 'دكّان و حارة', 'Dukkan & Hara')}
            </Link>
            <p>
              {choose(
                locale,
                'سوق يجمع إبداع المستقلين، خبرة المهنيين، وشغل المتاجر المنزلية. ناس من حارتك، لكل حكاياتك.',
                'A place for freelance creativity, skilled professionals and goods made with care. Local people, for your next good thing.',
              )}
            </p>
            <Link className="footer-discover" href={root + '/discover'}>
              {choose(locale, 'تعرّف على أهل الحارة', 'Meet your neighbourhood')}
              <Icon name="arrow" className="directional-icon" />
            </Link>
          </div>
          {groups.map((group) => (
            <nav className="footer-links" key={group.title} aria-label={group.title}>
              <h2>{group.title}</h2>
              {group.links.map(([href, label]) => (
                <Link key={href} href={href!}>
                  {label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()}{' '}
            {choose(
              locale,
              'دكّان و حارة. من حارتنا، وبمحبّة.',
              'Dukkan & Hara. From our neighbourhood, with care.',
            )}
          </span>
          <span className="footer-payment-note">
            {choose(
              locale,
              'المدفوعات ضمن المنصة محاكاة تجريبية.',
              'Payments on this platform are simulated.',
            )}
          </span>
          <a
            className="footer-source"
            href="https://github.com/Fadi-Habil17/syrian-marketplace"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="github" />
            <span>{choose(locale, 'عن المشروع على GitHub', 'Project on GitHub')}</span>
            <span className="sr-only">
              {choose(locale, 'يفتح في علامة تبويب جديدة', 'Opens in a new tab')}
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
