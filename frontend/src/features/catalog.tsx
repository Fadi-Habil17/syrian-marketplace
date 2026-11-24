import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api, ApiFailure } from '../lib/api/client';
import type { ApiSchemas } from '../lib/api/contracts';
import { credentials, currentUser } from '../lib/session';
import { amount, choose, localText, type Locale } from '../lib/locale';
import { enumLabel, errorLabel, field } from '../lib/labels';
import { ActionBar, CatalogFilters } from './filters';
import { CommandForm } from './command-form';
import { Checkout } from './checkout';
import { SignInPrompt } from './account/access';
import {
  Back,
  Card,
  Empty,
  Heading,
  NextPage,
  Panel,
  Photo,
  cardName,
  cardPhoto,
  optional,
} from './ui';

export const sections = ['freelance', 'professionals', 'home-store', 'stores'] as const;
export type Section = (typeof sections)[number];

export function sectionOf(value: string): Section {
  const section = sections.find((item) => item === value);
  if (!section) notFound();
  return section;
}

export function sectionTitle(locale: Locale, section: Section) {
  const labels: Record<Section, [string, string]> = {
    freelance: ['خدمات العمل الحر', 'Freelance services'],
    professionals: ['دليل المهنيين', 'Find a professional'],
    'home-store': ['منتجات المتاجر المنزلية', 'Home store products'],
    stores: ['المتاجر المنزلية', 'Home stores'],
  };
  return choose(locale, ...labels[section]);
}

export async function Catalog({
  locale,
  section,
  query,
}: {
  locale: Locale;
  section: Section;
  query: Record<string, string>;
}) {
  const workspace =
    section === 'freelance'
      ? 'FREELANCE'
      : section === 'professionals'
        ? 'PROFESSIONALS'
        : 'HOME_STORE';
  const publicQuery = { ...query };
  delete publicQuery.mine;
  const operation =
    section === 'stores'
      ? 'listStores'
      : section === 'home-store'
        ? 'listProducts'
        : 'listListings';
  const configuredQuery = {
    ...publicQuery,
    ...(operation === 'listListings' ? { workspace } : {}),
  };
  try {
    const [result, categories, governorates, cities] = await Promise.all([
      api(operation, { query: configuredQuery }),
      section === 'stores' ? null : api('listCategories', { query: { workspace, limit: 100 } }),
      api('listGovernorates', { query: { limit: 100 } }),
      query.governorateId
        ? api('listCities', { query: { governorateId: query.governorateId, limit: 100 } })
        : null,
    ]);
    return (
      <>
        <Heading>{sectionTitle(locale, section)}</Heading>
        {section !== 'freelance' && (
          <Link className="pill" href={'/' + locale + '/discover'}>
            {choose(locale, 'استكشف بالقرب منك', 'Explore nearby')}
          </Link>
        )}
        {(section === 'stores' || section === 'home-store') && (
          <ActionBar>
            <Link
              className={section === 'home-store' ? 'pill active' : 'pill'}
              href={'/' + locale + '/home-store'}
            >
              {sectionTitle(locale, 'home-store')}
            </Link>
            <Link
              className={section === 'stores' ? 'pill active' : 'pill'}
              href={'/' + locale + '/stores'}
            >
              {sectionTitle(locale, 'stores')}
            </Link>
          </ActionBar>
        )}
        <CatalogFilters
          locale={locale}
          operation={operation}
          query={publicQuery}
          resultCount={result.items.length}
          options={{
            categoryId: categories?.items.map(geo(locale)) ?? [],
            governorateId: governorates.items.map(geo(locale)),
            cityId: cities?.items.map(geo(locale)) ?? [],
          }}
        />
        {result.items.length ? (
          <div className="catalog-grid browse-grid">
            {result.items.map((item) => (
              <Card key={item.id} item={item} locale={locale} section={section} />
            ))}
          </div>
        ) : (
          <Empty locale={locale} />
        )}
        <NextPage locale={locale} cursor={result.nextCursor} query={publicQuery} />
      </>
    );
  } catch (error) {
    if (!(error instanceof ApiFailure)) throw error;
    return (
      <>
        <Heading>{sectionTitle(locale, section)}</Heading>
        {section !== 'freelance' && (
          <Link className="pill" href={'/' + locale + '/discover'}>
            {choose(locale, 'استكشف بالقرب منك', 'Explore nearby')}
          </Link>
        )}
        <p role="alert" className="notice">
          {errorLabel(locale, error.code)}
        </p>
        <Link className="button outline" href={'/' + locale + '/' + section}>
          {choose(locale, 'إعادة ضبط الفلاتر', 'Reset filters')}
        </Link>
      </>
    );
  }
}

export function geo(locale: Locale) {
  return (item: {
    id: string;
    nameAr: string;
    nameEn: string;
    center?: ApiSchemas['GeoPoint'] | null;
  }) => ({
    value: item.id,
    label: localText(locale, item.nameAr, item.nameEn),
    center: item.center,
  });
}
export function addresses(items: ApiSchemas['Address'][] = []) {
  return items.map((item) => ({ value: item.id, label: item.label + ' · ' + item.details }));
}

export async function Detail({
  locale,
  section,
  id,
}: {
  locale: Locale;
  section: Section;
  id: string;
}) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const operation =
    section === 'stores' ? 'getStore' : section === 'home-store' ? 'getProduct' : 'getListing';
  const item = await optional(
    api(operation, { params: { listingId: id, productId: id, storeId: id } }),
  );
  if (!item || ('kind' in item && (section === 'freelance') !== (item.kind === 'FREELANCE')))
    notFound();
  const title = cardName(locale, item);
  const viewer = await currentUser();
  const productStore =
    'storeId' in item
      ? await optional(api('getStore', { params: { storeId: item.storeId } }))
      : null;
  const profileId = 'profileId' in item ? item.profileId : productStore?.profileId;
  const back = <Back locale={locale} path={'/' + section} title={sectionTitle(locale, section)} />;
  const files = 'photoIds' in item ? item.photoIds : item.logoId ? [item.logoId] : [];
  const isStore = section === 'stores';
  return (
    <section className={isStore ? 'listing-detail store-detail' : 'listing-detail'}>
      {back}
      <Heading>{title}</Heading>
      <div className="detail-layout">
        <article className="detail-content">
          <Photo id={cardPhoto(item)} alt={title} priority />
          <h2>{choose(locale, 'التفاصيل', 'Details')}</h2>
          <p className="preserve">{localText(locale, item.descriptionAr, item.descriptionEn)}</p>
          {files.length > 1 && (
            <div className="gallery">
              {files.slice(1).map((file) => (
                <Photo key={file} id={file} alt={title} />
              ))}
            </div>
          )}
          {isStore && (
            <>
              <p className="muted">
                {[
                  'supportsSellerDelivery' in item && item.supportsSellerDelivery
                    ? enumLabel(locale, 'SELLER')
                    : null,
                  'supportsPlatformDelivery' in item && item.supportsPlatformDelivery
                    ? enumLabel(locale, 'PLATFORM_DRIVER')
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <StoreProducts locale={locale} id={id} />
            </>
          )}
          {profileId && (
            <Profile
              locale={locale}
              id={profileId}
              reviewSubject={
                productStore && localText(locale, productStore.nameAr, productStore.nameEn)
              }
            />
          )}
        </article>
        {!isStore && (
          <aside className="panel detail-aside">
            {'price' in item && (
              <>
                <span>{field(locale, 'price')}</span>
                <strong className="price large">{amount(locale, item.price)}</strong>
              </>
            )}
            {'deliveryDays' in item && item.deliveryDays !== null && (
              <p>
                {item.deliveryDays} {choose(locale, 'أيام للتسليم', 'days to deliver')}
              </p>
            )}
            {'availableStock' in item && (
              <p>
                {item.availableStock} {choose(locale, 'متاح', 'in stock')}
              </p>
            )}
            {!viewer ? (
              <SignInPrompt locale={locale} next={'/' + locale + '/' + section + '/' + id} />
            ) : (
              <Purchase
                locale={locale}
                item={item as ApiSchemas['Product'] | ApiSchemas['Listing']}
              />
            )}
          </aside>
        )}
      </div>
    </section>
  );
}

async function StoreProducts({ locale, id }: { locale: Locale; id: string }) {
  const products = await api('listProducts', { query: { storeId: id, limit: 6 } });
  return (
    <section>
      <h2>{choose(locale, 'منتجات المتجر', 'From this store')}</h2>
      {products.items.length ? (
        <>
          <div className="catalog-grid">
            {products.items.map((item) => (
              <Card key={item.id} item={item} locale={locale} section="home-store" />
            ))}
          </div>
          <Link href={'/' + locale + '/home-store?storeId=' + id}>
            {choose(locale, 'عرض كل المنتجات', 'Show all products')}
          </Link>
        </>
      ) : (
        <Empty locale={locale} />
      )}
    </section>
  );
}

async function Profile({
  locale,
  id,
  reviewSubject,
}: {
  locale: Locale;
  id: string;
  reviewSubject?: string | null;
}) {
  const [profile, reviews] = await Promise.all([
    optional(api('getPublicProfile', { params: { profileId: id } })),
    optional(api('listVerifiedReviews', { params: { profileId: id } })),
  ]);
  if (!profile) return null;
  return (
    <>
      <Panel title={profile.title}>
        <p className="preserve">{profile.bio}</p>
        {profile.trade && (
          <p>
            {profile.trade} · {profile.experienceYears ?? '—'}{' '}
            {choose(locale, 'سنوات خبرة', 'years of experience')}
          </p>
        )}
        {!!profile.skills.length && (
          <div className="inline-links">
            {profile.skills.map((skill) => (
              <span key={skill} className="pill">
                {skill}
              </span>
            ))}
          </div>
        )}
        {!!profile.portfolio.length && (
          <div className="gallery">
            {profile.portfolio.map((item) => (
              <figure key={item.id}>
                {item.kind === 'IMAGE' && <Photo id={item.file?.id} alt={item.title} />}
                <figcaption>{item.title}</figcaption>
                {item.file && item.kind !== 'IMAGE' && (
                  <a href={'/api/media/' + item.file.id}>
                    {choose(locale, 'تنزيل الملف', 'Download file')}
                  </a>
                )}
                {item.url && /^https?:\/\//i.test(item.url) && (
                  <a href={item.url} rel="noreferrer">
                    {choose(locale, 'فتح الرابط', 'Open link')}
                  </a>
                )}
              </figure>
            ))}
          </div>
        )}
      </Panel>
      <Panel
        title={
          reviewSubject
            ? choose(locale, `تقييمات متجر ${reviewSubject}`, `Reviews for ${reviewSubject}`)
            : choose(locale, 'التقييمات الموثّقة', 'Verified reviews')
        }
      >
        {reviews?.items.length ? (
          <>
            {profile.ratingAverage !== null && (
              <p className="review-summary">
                <span aria-hidden="true">★</span>{' '}
                <strong>
                  {new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(
                    profile.ratingAverage,
                  )}
                </strong>{' '}
                <span>
                  {choose(locale, 'من ٥', 'out of 5')} ·{' '}
                  {new Intl.NumberFormat(locale).format(profile.reviewCount)}{' '}
                  {choose(locale, 'تقييم', 'reviews')}
                </span>
              </p>
            )}
            <ul className="review-list">
              {reviews.items.map((review) => (
                <li key={review.id}>
                  <div className="review-meta">
                    <strong>
                      <bdi>{review.buyerDisplayName}</bdi>
                    </strong>
                    <time dateTime={review.createdAt}>
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: 'medium',
                        timeZone: 'Asia/Damascus',
                      }).format(new Date(review.createdAt))}
                    </time>
                  </div>
                  <span
                    className="review-stars"
                    role="img"
                    aria-label={choose(
                      locale,
                      `${review.stars} من ٥ نجوم`,
                      `${review.stars} out of 5 stars`,
                    )}
                  >
                    {'★'.repeat(review.stars)}
                    {'☆'.repeat(5 - review.stars)}
                  </span>
                  {review.body && <p dir="auto">{review.body}</p>}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <Empty locale={locale} />
        )}
      </Panel>
    </>
  );
}

async function Purchase({
  locale,
  item,
}: {
  locale: Locale;
  item: ApiSchemas['Product'] | ApiSchemas['Listing'];
}) {
  if ('kind' in item && item.kind === 'FREELANCE') {
    return (
      <CommandForm
        locale={locale}
        name="createFreelanceOrder"
        defaults={{ listingId: item.id }}
        go="order"
        open
      />
    );
  }
  const { token } = await credentials();
  const list = await api('listAddresses', { token, query: { limit: 100 } });
  const choices = { addressId: addresses(list.items) };
  if (!list.items.length)
    return (
      <Link className="button primary" href={'/' + locale + '/account#addresses'}>
        {choose(locale, 'أضف عنواناً أولاً', 'Add an address first')}
      </Link>
    );
  if ('kind' in item)
    return (
      <>
        <CommandForm
          locale={locale}
          name="createBooking"
          defaults={{ listingId: item.id }}
          choices={choices}
          go="order"
        />
        <CommandForm
          locale={locale}
          name="requestInspectionQuote"
          defaults={{ providerProfileId: item.profileId }}
          choices={choices}
          initial={{ currency: item.price.currency }}
          upload={{ accessClass: 'ORDER_SHARED' }}
          go="order"
        />
      </>
    );
  if (!item.availableStock)
    return <p className="notice">{choose(locale, 'نفد المخزون', 'Out of stock')}</p>;
  const [store, products] = await Promise.all([
    api('getStore', { params: { storeId: item.storeId } }),
    api('listProducts', {
      query: { storeId: item.storeId, currency: item.price.currency, limit: 100 },
    }),
  ]);
  return (
    <>
      <Link href={'/' + locale + '/stores/' + store.id}>
        {localText(locale, store.nameAr, store.nameEn)}
      </Link>
      <Checkout
        locale={locale}
        storeId={store.id}
        productId={item.id}
        currency={item.price.currency}
        addresses={choices.addressId}
        products={products.items
          .filter((product) => product.availableStock > 0)
          .map((product) => ({
            value: product.id,
            label: cardName(locale, product) + ' · ' + amount(locale, product.price),
          }))}
      />
    </>
  );
}
