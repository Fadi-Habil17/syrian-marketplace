import { VenueEditor } from './venue-editor';
import { api } from '../lib/api/client';
import type { ApiSchemas } from '../lib/api/contracts';
import { choose, localText, type Locale } from '../lib/locale';
import { enumLabel } from '../lib/labels';
import { CommandForm } from './command-form';
import { geo } from './catalog';
import { LocationFilter, geographicChoices } from './account/dashboard';
import { Data, Empty, Heading, NextPage, Panel, cardName, optional } from './ui';

export async function Workspace({
  locale,
  token,
  user,
  query,
}: {
  locale: Locale;
  token?: string;
  user: ApiSchemas['User'];
  query: Record<string, string>;
}) {
  const [profiles, locations] = await Promise.all([
    api('listOwnBusinessProfiles', { token, query: { limit: 100 } }),
    geographicChoices(locale, query),
  ]);
  const active = user.activeBusinessProfile;
  const venue =
    active && ['STORE_OWNER', 'PROFESSIONAL'].includes(active.type)
      ? await optional(api('getPublicVenue', { token, params: { profileId: active.id } }))
      : null;
  return (
    <>
      <Heading description={active?.title}>
        {choose(locale, 'مساحة العمل', 'Business workspace')}
      </Heading>
      {venue && active && (
        <VenueEditor key={active.id} profileId={active.id} initial={venue.point} locale={locale} />
      )}
      <div className="dashboard-grid">
        <div className="stack">
          <Panel title={choose(locale, 'ملفات الأعمال', 'Business profiles')}>
            <LocationFilter locale={locale} choices={locations} query={query} />
            {!active && (
              <CommandForm locale={locale} name="createBusinessProfile" choices={locations} />
            )}
            {active && (
              <CommandForm locale={locale} name="switchBusinessWorkspace" choices={locations} />
            )}
            {profiles.items.length ? (
              profiles.items.map((profile) => (
                <div className="card-block" key={profile.id}>
                  <h3>
                    {profile.title || enumLabel(locale, profile.type)}{' '}
                    <span className="pill">{enumLabel(locale, profile.status)}</span>
                  </h3>
                  <p>{profile.bio}</p>
                  {profile.id === active?.id ? (
                    <>
                      <CommandForm
                        locale={locale}
                        name="updateBusinessProfile"
                        params={{ profileId: profile.id }}
                        choices={locations}
                        initial={{
                          title: profile.title,
                          bio: profile.bio,
                          cityId: profile.cityId,
                          trade: profile.trade,
                          experienceYears: profile.experienceYears,
                          skills: profile.skills,
                          languages: profile.languages,
                        }}
                      />
                      <CommandForm
                        locale={locale}
                        name="createPortfolioItem"
                        params={{ profileId: profile.id }}
                        upload={{ accessClass: 'PUBLIC_CATALOG' }}
                      />
                      {profile.portfolio.map((item) => (
                        <div key={item.id} className="row-card">
                          <strong>{item.title}</strong>
                          <CommandForm
                            locale={locale}
                            name="removePortfolioItem"
                            params={{ profileId: profile.id, itemId: item.id }}
                          />
                        </div>
                      ))}
                      {profile.type === 'PROFESSIONAL' && (
                        <ServiceAreas
                          locale={locale}
                          token={token}
                          id={profile.id}
                          choices={locations}
                        />
                      )}
                    </>
                  ) : (
                    profile.status === 'ARCHIVED' && (
                      <CommandForm
                        locale={locale}
                        name="reactivateBusinessProfile"
                        params={{ profileId: profile.id }}
                      />
                    )
                  )}
                </div>
              ))
            ) : (
              <Empty locale={locale} />
            )}
          </Panel>
          {(active?.type === 'FREELANCER' || active?.type === 'PROFESSIONAL') && (
            <ListingManager locale={locale} token={token} type={active.type} query={query} />
          )}
          {active?.type === 'STORE_OWNER' && (
            <StoreManager locale={locale} token={token} locations={locations} query={query} />
          )}
        </div>
        <aside>
          <Panel title={choose(locale, 'حالة مساحة العمل', 'Workspace status')}>
            <Data
              locale={locale}
              value={active ? { type: active.type, status: active.status } : null}
            />
            <p>
              {choose(
                locale,
                'تفحص المنصة الطلبات والتوصيلات والنزاعات والأموال المحجوزة قبل تبديل مساحة العمل.',
                'The marketplace checks orders, deliveries, disputes and held funds before switching workspaces.',
              )}
            </p>
          </Panel>
        </aside>
      </div>
    </>
  );
}

async function ServiceAreas({
  locale,
  token,
  id,
  choices,
}: {
  locale: Locale;
  token?: string;
  id: string;
  choices: Awaited<ReturnType<typeof geographicChoices>>;
}) {
  const list = await optional(
    api('listServiceAreas', { token, params: { profileId: id }, query: { limit: 100 } }),
  );
  return (
    <>
      <CommandForm
        locale={locale}
        name="addServiceArea"
        params={{ profileId: id }}
        choices={choices}
      />
      {list?.items.map((value) => (
        <div className="row-card" key={value.id}>
          <Data locale={locale} value={value} />
          <CommandForm
            locale={locale}
            name="removeServiceArea"
            params={{ profileId: id, areaId: value.id }}
          />
        </div>
      ))}
    </>
  );
}

async function ListingManager({
  locale,
  token,
  type,
  query,
}: {
  locale: Locale;
  token?: string;
  type: 'FREELANCER' | 'PROFESSIONAL';
  query: Record<string, string>;
}) {
  const workspace = type === 'FREELANCER' ? 'FREELANCE' : 'PROFESSIONALS';
  const kind = type === 'FREELANCER' ? 'FREELANCE' : 'PROFESSIONAL_PACKAGE';
  const [list, categories] = await Promise.all([
    api('listListings', { token, query: { workspace, mine: true, cursor: query.cursor } }),
    api('listCategories', { query: { workspace, limit: 100 } }),
  ]);
  const choices = { categoryId: categories.items.map(geo(locale)) };
  const upload = { accessClass: 'PUBLIC_CATALOG' } as const;
  return (
    <Panel title={choose(locale, 'خدماتي', 'My services')}>
      <CommandForm
        locale={locale}
        name="createListing"
        defaults={{ kind }}
        choices={choices}
        upload={upload}
      />
      {list.items.map((item) => (
        <div className="card-block" key={item.id}>
          <h3>
            {cardName(locale, item)} <span className="pill">{enumLabel(locale, item.status)}</span>
          </h3>
          <CommandForm
            locale={locale}
            name="updateListing"
            params={{ listingId: item.id }}
            choices={choices}
            upload={upload}
            initial={{
              titleAr: item.titleAr,
              titleEn: item.titleEn,
              descriptionAr: item.descriptionAr,
              descriptionEn: item.descriptionEn,
              categoryId: item.categoryId,
              price: item.price,
              deliveryDays: item.deliveryDays,
              durationMinutes: item.durationMinutes,
              photoIds: item.photoIds,
            }}
          />
          <CommandForm locale={locale} name="publishListing" params={{ listingId: item.id }} />
          <CommandForm locale={locale} name="deactivateListing" params={{ listingId: item.id }} />
        </div>
      ))}
      <NextPage locale={locale} cursor={list.nextCursor} query={query} />
    </Panel>
  );
}

async function StoreManager({
  locale,
  token,
  locations,
  query,
}: {
  locale: Locale;
  token?: string;
  locations: Awaited<ReturnType<typeof geographicChoices>>;
  query: Record<string, string>;
}) {
  const [stores, products, categories] = await Promise.all([
    api('listStores', { token, query: { mine: true, limit: 100 } }),
    api('listProducts', { token, query: { mine: true, cursor: query.cursor } }),
    api('listCategories', { query: { workspace: 'HOME_STORE', limit: 100 } }),
  ]);
  const upload = { accessClass: 'PUBLIC_CATALOG' } as const;
  const choices = {
    storeId: stores.items.map(geo(locale)),
    categoryId: categories.items.map(geo(locale)),
  };
  return (
    <>
      <Panel title={choose(locale, 'متجري', 'My store')}>
        <CommandForm locale={locale} name="createStore" choices={locations} upload={upload} />
        {stores.items.map((store) => (
          <div className="card-block" key={store.id}>
            <h3>
              {localText(locale, store.nameAr, store.nameEn)}{' '}
              <span className="pill">{enumLabel(locale, store.status)}</span>
            </h3>
            <CommandForm
              locale={locale}
              name="updateStore"
              params={{ storeId: store.id }}
              choices={locations}
              upload={upload}
              initial={{
                nameAr: store.nameAr,
                nameEn: store.nameEn,
                descriptionAr: store.descriptionAr,
                descriptionEn: store.descriptionEn,
                cityId: store.cityId,
                logoId: store.logoId,
                supportsSellerDelivery: store.supportsSellerDelivery,
                supportsPlatformDelivery: store.supportsPlatformDelivery,
              }}
            />
            <CommandForm locale={locale} name="publishStore" params={{ storeId: store.id }} />
            <CommandForm locale={locale} name="deactivateStore" params={{ storeId: store.id }} />
          </div>
        ))}
      </Panel>
      <Panel title={choose(locale, 'منتجاتي والمخزون', 'My products and stock')}>
        {!!stores.items.length && (
          <CommandForm locale={locale} name="createProduct" choices={choices} upload={upload} />
        )}
        {products.items.map((product) => (
          <div className="card-block" key={product.id}>
            <h3>
              {cardName(locale, product)}{' '}
              <span className="pill">{enumLabel(locale, product.status)}</span>
            </h3>
            <p>
              {choose(locale, 'المخزون المتاح', 'Available stock')} · {product.availableStock}
            </p>
            <CommandForm
              locale={locale}
              name="updateProduct"
              params={{ productId: product.id }}
              choices={choices}
              upload={upload}
              initial={{
                titleAr: product.titleAr,
                titleEn: product.titleEn,
                descriptionAr: product.descriptionAr,
                descriptionEn: product.descriptionEn,
                categoryId: product.categoryId,
                price: product.price,
                photoIds: product.photoIds,
              }}
            />
            <CommandForm
              locale={locale}
              name="setProductStock"
              params={{ productId: product.id }}
            />
            <CommandForm locale={locale} name="publishProduct" params={{ productId: product.id }} />
            <CommandForm
              locale={locale}
              name="deactivateProduct"
              params={{ productId: product.id }}
            />
          </div>
        ))}
        <NextPage locale={locale} cursor={products.nextCursor} query={query} />
      </Panel>
    </>
  );
}
