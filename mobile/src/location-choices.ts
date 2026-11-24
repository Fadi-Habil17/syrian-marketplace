import { api, unwrap } from './api/client';
export async function locationChoices(governorateId?: string, initialCityId?: string) {
  const governors = unwrap(
    await api.GET('/api/v1/geography/governorates', { params: { query: { limit: 100 } } }),
  ).items;
  let selected = governorateId ?? '';
  const citiesFor = async (id: string) =>
    unwrap(
      await api.GET('/api/v1/geography/cities', {
        params: { query: { governorateId: id, limit: 100 } },
      }),
    ).items;
  if (initialCityId && !selected) {
    const groups = await Promise.all(
      governors.map(async (governor) => ({
        id: governor.id,
        cities: await citiesFor(governor.id),
      })),
    );
    const group = groups.find((group) => group.cities.some((city) => city.id === initialCityId));
    return { governors, selected: group?.id ?? '', cities: group?.cities ?? [] };
  }
  return { governors, selected, cities: selected ? await citiesFor(selected) : [] };
}
