import { geographicChoices, LocationFilter } from '../../../features/account/dashboard';
import { Discovery } from '../../../features/discovery';
import { localeOf, queryOf, type RouteProps } from '../../../lib/locale';
export default async function Discover({ params, searchParams }: RouteProps) {
  const locale = localeOf((await params).locale),
    query = queryOf(await searchParams);
  const choices = await geographicChoices(locale, query);
  const city = choices.cityId.find((c) => c.value === query.cityId);
  return (
    <>
      <h1>{locale === 'ar' ? 'استكشف بالقرب منك' : 'Explore nearby'}</h1>
      <LocationFilter locale={locale} query={query} choices={choices} />
      {city && (
        <Discovery
          key={city.value}
          cityId={city.value}
          center={city.center}
          locale={locale}
          areas={choices.areaId ?? []}
        />
      )}
    </>
  );
}
