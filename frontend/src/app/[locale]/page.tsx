import Link from 'next/link';
import { choose, localeOf } from '../../lib/locale';
import { HowItWorks, FilmCard } from '../../features/home-story';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const locale = localeOf((await params).locale);
  const sections = [
    [
      'freelance',
      '✳',
      'فكرة منك، وإبداع من أهلها.',
      'Your idea. Their know-how.',
      'العمل الحر',
      'Freelance services',
      'تصميم، كتابة وخدمات رقمية من مستقلين سوريين.',
      'Design, writing and digital services from Syrian freelancers.',
    ],
    [
      'professionals',
      '↗',
      'إيد شاطرة، قريبة عليك.',
      'A skilled pair of hands.',
      'المهنيون',
      'Local professionals',
      'خدمات للبيت والشغل، بموعد متفق عليه.',
      'Help for your home and business, at a time you agree on.',
    ],
    [
      'home-store',
      '⌂',
      'شغلات معمولة بمحبة.',
      'Made here. Made with care.',
      'المتاجر المنزلية',
      'Home stores',
      'منتجات من متاجر منزلية، من عندهم لعندك.',
      'Thoughtful goods from local home businesses.',
    ],
  ];
  return (
    <>
      <section className="landing-hero" aria-labelledby="home-title">
        <div className="landing-hero-copy">
          <span className="eyebrow">
            <span className="small-sun" aria-hidden="true">
              ✳
            </span>
            {choose(
              locale,
              'سوق سوري، بروح الحارة',
              'A SYRIAN MARKETPLACE, WITH NEIGHBOURHOOD SPIRIT',
            )}
          </span>
          <h1 id="home-title">
            {choose(locale, 'من حارتك،', 'From your neighbourhood,')}
            <br />
            <em>{choose(locale, 'لكل حكاياتك.', 'to your next good thing.')}</em>
          </h1>
          <p>
            {choose(
              locale,
              'منتج معمول بمحبة، مستقل لفكرتك، أو مهني لشغلك. أهل الحارة أقرب مما بتتخيّل.',
              'Something made with care. A freelancer for your idea. A professional for your home. Find your people, a little closer.',
            )}
          </p>
          <form action={'/' + locale + '/search'} className="discovery-search" role="search">
            <label htmlFor="home-search">
              {choose(locale, 'شو عم تدوّر؟', 'What are you looking for?')}
            </label>
            <div>
              <input
                id="home-search"
                name="q"
                type="search"
                placeholder={choose(
                  locale,
                  'خدمة، مهنة، أو منتج…',
                  'A service, a skill, something local…',
                )}
                required
              />
              <button className="button primary">
                {choose(locale, 'خلّينا نلاقيه', 'Find it')} <span aria-hidden="true">↗</span>
              </button>
            </div>
          </form>
          <div className="discovery-links">
            {sections.map(([route, icon, , , ar, en]) => (
              <Link key={route} href={'/' + locale + '/' + route}>
                <span aria-hidden="true">{icon}</span>
                {choose(locale, ar!, en!)}
              </Link>
            ))}
          </div>
          <a className="how-link" href="#how-it-works">
            {choose(locale, 'جديد بالسوق؟ شوف كيف بيشتغل', 'New around here? See how it works')}{' '}
            <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className="landing-visual">
          <picture>
            <source media="(max-width: 700px)" srcSet="/images/neighbourhood-small.webp" />
            <img
              src="/images/neighbourhood.webp"
              width="960"
              height="640"
              fetchPriority="high"
              alt={choose(
                locale,
                'أزقة سوق بأبواب خضراء وبضائع محلية',
                'A market alley with green shop doors and local goods',
              )}
            />
          </picture>
          <div className="visual-label">
            <span aria-hidden="true">⌂</span>
            <div>
              <strong>
                {choose(locale, 'قريبين بالشغل، قريبين بالقلب.', 'Local work. A familiar feeling.')}
              </strong>
              <span>
                {choose(
                  locale,
                  'حرف، أفكار، وشغلات من البيت.',
                  'Skills, ideas and things made at home.',
                )}
              </span>
            </div>
          </div>
          <span className="photo-stamp">
            {choose(locale, 'من إيدين أهل الحارة', 'GOOD THINGS, CLOSE TO HOME')}
          </span>
        </div>
      </section>
      <section className="discovery-section" id="discover">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              {choose(locale, 'ثلاث مساحات، سوق واحد', 'THREE WAYS TO FIND YOUR PEOPLE')}
            </span>
            <h2>
              {choose(locale, 'لكل شغلة، أهلها.', 'For every good thing, a good place to start.')}
            </h2>
          </div>
          <p>
            {choose(
              locale,
              'ابدأ من هون. التفاصيل والسعر عند صاحب الشغل.',
              'Start here. Explore the work, then agree on the details.',
            )}
          </p>
        </div>
        <div className="discovery-grid">
          {sections.map(([route, icon, tagAr, tagEn, ar, en, descAr, descEn], index) => (
            <Link className="discovery-card" key={route} href={'/' + locale + '/' + route}>
              <div className="discovery-card-top">
                <span className="category-symbol" aria-hidden="true">
                  {icon}
                </span>
                <span className="eyebrow">0{index + 1}</span>
              </div>
              <h3>{choose(locale, ar!, en!)}</h3>
              <strong>{choose(locale, tagAr!, tagEn!)}</strong>
              <p>{choose(locale, descAr!, descEn!)}</p>
              <span className="text-link">
                {choose(locale, 'اكتشف المساحة', 'Explore this workspace')}{' '}
                <span aria-hidden="true">↗</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
      <HowItWorks locale={locale} />
      <section className="stories-section" id="stories" aria-labelledby="stories-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              {choose(locale, 'وجوه الحارة وحكاياتها', 'THE PEOPLE BEHIND THE GOOD THINGS')}
            </span>
            <h2 id="stories-title">
              {choose(locale, 'سوق إلو روح.', 'A marketplace with a little soul.')}
            </h2>
          </div>
          <p>
            {choose(
              locale,
              'اكتشف الحكاية، أو خذ جولة بين الواجهات.',
              'Discover the story, or take a look around the product.',
            )}
          </p>
        </div>
        <div className="film-grid">
          <FilmCard
            locale={locale}
            title={choose(locale, 'حكاية دكّان وحارة', 'Good things begin close to home')}
            description={choose(
              locale,
              'من إيد بتخبز، لإيد بتصنع. اكتشف الناس والشغلات اللي بتجمعنا.',
              'From the hands that make to the people who discover. Explore what brings us together.',
            )}
            poster="/images/neighbourhood.webp"
            source={process.env.NEXT_PUBLIC_MARKETPLACE_FILM_URL}
          />
          <FilmCard
            locale={locale}
            tour
            title={choose(locale, 'خذ جولة بالسوق', 'Take a look around')}
            description={choose(
              locale,
              'جولة قصيرة بالنسخة التجريبية، ببيانات خيالية ومدفوعات محاكاة.',
              'A short look at the demo marketplace, with fictional data and simulated payments.',
            )}
            poster="/images/walkthrough-poster.webp"
            source={process.env.NEXT_PUBLIC_PRODUCT_TOUR_URL || '/media/product-tour.webm'}
          />
        </div>
      </section>
      <section className="home-invitation">
        <span className="invitation-sun" aria-hidden="true">
          ✳
        </span>
        <div>
          <h2>{choose(locale, 'إلك مكان بالحارة.', 'There’s a place for you here.')}</h2>
          <p>
            {choose(
              locale,
              'تصفّح، اشتري، أو خلّي الناس تكتشف شغلك.',
              'Find something you need. Or help someone find what you do.',
            )}
          </p>
        </div>
        <Link className="button primary" href={'/' + locale + '/register'}>
          {choose(locale, 'أنشئ حسابك', 'Join the neighbourhood')} ↗
        </Link>
      </section>
    </>
  );
}
