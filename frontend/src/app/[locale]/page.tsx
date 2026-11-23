import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { api } from '../../lib/api/client';
import { choose, localeOf, type Locale } from '../../lib/locale';
import { Photo, optional } from '../../features/ui';

async function Workspaces({ locale }: { locale: Locale }) {
  const [products, professionals, freelance] = await Promise.all([
    optional(api('listProducts', { query: { limit: 1 } })).catch(() => null),
    optional(api('listListings', { query: { workspace: 'PROFESSIONALS', limit: 1 } })).catch(
      () => null,
    ),
    optional(api('listListings', { query: { workspace: 'FREELANCE', limit: 1 } })).catch(
      () => null,
    ),
  ]);
  return (
    <div className="catalog-grid">
      {[
        [
          'freelance',
          'خدمات العمل الحر',
          'Freelance services',
          'خدمات رقمية يقدمها مستقلون من سوريا.',
          'Digital services from Syrian freelancers.',
          freelance?.items[0]?.photoIds[0],
        ],
        [
          'professionals',
          'دليل المهنيين',
          'Find a professional',
          'حرفيون ومهنيون في مدينتك.',
          'Find tradespeople and local services near you.',
          professionals?.items[0]?.photoIds[0],
        ],
        [
          'home-store',
          'المتاجر المنزلية',
          'Shop home stores',
          'منتجات محلية من متاجر منزلية.',
          'Discover goods from local home businesses.',
          products?.items[0]?.photoIds[0],
        ],
      ].map(([path, ar, en, descAr, descEn, id]) => (
        <Link key={path} className="catalog-card workspace-card" href={'/' + locale + '/' + path}>
          <Photo id={id} />
          <div className="card-copy">
            <h2>{choose(locale, ar!, en!)}</h2>
            <p>{choose(locale, descAr!, descEn!)}</p>
            <span className="card-link">
              {choose(locale, 'استكشف', 'Explore')} <span aria-hidden="true">›</span>
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const locale = localeOf((await params).locale);
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>{choose(locale, 'أهل الحارة أقرب', 'Find it close to home')}</h1>
          <p>
            {choose(
              locale,
              'خدمات ومنتجات محلية من ناس حارتك، في كل سوريا.',
              'Local services and home-made goods from communities across Syria.',
            )}
          </p>
          <form action={'/' + locale + '/search'} className="hero-search" role="search">
            <label className="sr-only" htmlFor="home-search">
              {choose(
                locale,
                'ابحث عن خدمة أو مهنة أو منتج',
                'Search services, trades or products',
              )}
            </label>
            <input
              id="home-search"
              name="q"
              type="search"
              required
              placeholder={choose(
                locale,
                'ابحث عن خدمة أو مهنة أو منتج',
                'Search services, trades or products',
              )}
            />
            <button className="button soft">{choose(locale, 'بحث', 'Search')}</button>
          </form>
        </div>
        <div className="hero-image">
          <Image
            src="/images/damascus-souq.webp"
            alt=""
            fill
            unoptimized
            priority
            sizes="(max-width: 680px) 100vw, 50vw"
          />
        </div>
      </section>
      <section className="home-workspaces">
        <h2>{choose(locale, 'استكشف السوق', 'Explore the marketplace')}</h2>
        <Suspense
          fallback={
            <div className="skeletons" aria-busy="true">
              <span />
              <span />
              <span />
            </div>
          }
        >
          <Workspaces locale={locale} />
        </Suspense>
      </section>
    </>
  );
}
