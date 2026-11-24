import Link from 'next/link';
import { api } from '../../lib/api/client';
import type { ApiSchemas } from '../../lib/api/contracts';
import { signOut } from '../../lib/actions/market';
import { choose, type Locale } from '../../lib/locale';
import { enumLabel } from '../../lib/labels';
import { CommandForm, type Choices } from '../command-form';
import { geo } from '../catalog';
import { Data, Empty, Heading, Panel } from '../ui';

export async function geographicChoices(
  locale: Locale,
  query: Record<string, string> = {},
): Promise<Choices & { governorateId: Choices[string]; cityId: Choices[string] }> {
  const [governorates, cities, areas] = await Promise.all([
    api('listGovernorates', { query: { limit: 100 } }),
    query.governorateId
      ? api('listCities', { query: { limit: 100, governorateId: query.governorateId } })
      : null,
    query.cityId ? api('listAreas', { query: { limit: 100, cityId: query.cityId } }) : null,
  ]);
  return {
    governorateId: governorates.items.map(geo(locale)),
    cityId: cities?.items.map(geo(locale)) ?? [],
    ...(areas ? { areaId: areas.items.map(geo(locale)) } : {}),
  };
}

export function LocationFilter({
  locale,
  choices,
  query,
}: {
  locale: Locale;
  choices: Choices;
  query: Record<string, string>;
}) {
  return (
    <form method="get" className="filters">
      {query.tab && <input type="hidden" name="tab" value={query.tab} />}
      {(
        [
          ['governorateId', 'المحافظة', 'Governorate'],
          ['cityId', 'المدينة', 'City'],
        ] as const
      ).map(([key, ar, en]) => (
        <label key={key}>
          {choose(locale, ar, en)}
          <select name={key} defaultValue={query[key] ?? ''}>
            <option value="">{choose(locale, 'الكل', 'All')}</option>
            {choices[key]?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      <button className="button soft">{choose(locale, 'عرض المواقع', 'Show locations')}</button>
    </form>
  );
}

export async function Account({
  locale,
  user,
  token,
  query,
}: {
  locale: Locale;
  user: ApiSchemas['User'];
  token?: string;
  query: Record<string, string>;
}) {
  const [addresses, locations] = await Promise.all([
    api('listAddresses', { token, query: { limit: 100 } }),
    geographicChoices(locale, query),
  ]);
  return (
    <>
      <Heading>{user.displayName}</Heading>
      <div className="dashboard-grid">
        <div className="stack">
          <Panel title={choose(locale, 'بيانات الحساب', 'Account details')}>
            <Data
              locale={locale}
              value={{
                email: user.email,
                displayName: user.displayName,
                locale: user.locale,
                roles: user.roles,
                restrictions: user.restrictions,
              }}
            />
            <CommandForm
              locale={locale}
              name="updateMe"
              initial={{ displayName: user.displayName, locale: user.locale }}
            />
            <form action={signOut.bind(null, locale)}>
              <button className="button outline">
                {choose(locale, 'تسجيل الخروج', 'Sign out')}
              </button>
            </form>
          </Panel>
          <div id="addresses">
            <Panel title={choose(locale, 'عناويني', 'My addresses')}>
              <LocationFilter locale={locale} choices={locations} query={query} />
              {locations.cityId.length > 0 ? (
                <CommandForm
                  locale={locale}
                  name="createAddress"
                  choices={locations}
                  initial={query.cityId ? { cityId: query.cityId } : {}}
                />
              ) : (
                <p>
                  {choose(
                    locale,
                    'اختر محافظة لعرض المدن وإضافة عنوان.',
                    'Select a governorate to show cities and add an address.',
                  )}
                </p>
              )}
              {addresses.items.length ? (
                addresses.items.map((address) => (
                  <div className="card-block" key={address.id}>
                    <h3>{address.label}</h3>
                    <p>{address.details}</p>
                    <CommandForm
                      locale={locale}
                      name="updateAddress"
                      params={{ addressId: address.id }}
                      initial={{
                        label: address.label,
                        pin: address.pin ?? null,
                        cityId: address.cityId,
                        areaId: address.areaId,
                        details: address.details,
                        contactName: address.contactName,
                        contactPhone: address.contactPhone,
                      }}
                      choices={{
                        ...locations,
                        areaId:
                          address.areaId &&
                          !locations.areaId?.some((area) => area.value === address.areaId)
                            ? [
                                {
                                  value: address.areaId,
                                  label: choose(locale, 'المنطقة الحالية', 'Current area'),
                                },
                                ...(locations.areaId ?? []),
                              ]
                            : (locations.areaId ?? []),
                        cityId: locations.cityId.some((city) => city.value === address.cityId)
                          ? locations.cityId
                          : [
                              {
                                value: address.cityId,
                                label: choose(locale, 'المدينة الحالية', 'Current city'),
                              },
                              ...locations.cityId,
                            ],
                      }}
                    />
                    <CommandForm
                      locale={locale}
                      name="archiveAddress"
                      params={{ addressId: address.id }}
                    />
                  </div>
                ))
              ) : (
                <Empty locale={locale} />
              )}
            </Panel>
          </div>
        </div>
        <aside>
          <Panel title={choose(locale, 'مساحة العمل', 'Business workspace')}>
            <p>
              {user.activeBusinessProfile
                ? enumLabel(locale, user.activeBusinessProfile.type)
                : choose(locale, 'حساب عميل', 'Customer account')}
            </p>
            <Link className="button primary" href={'/' + locale + '/workspace'}>
              {choose(locale, 'إدارة مساحة العمل', 'Manage workspace')}
            </Link>
          </Panel>
        </aside>
      </div>
    </>
  );
}
