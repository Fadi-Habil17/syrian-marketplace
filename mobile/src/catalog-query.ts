import type { ApiOperations } from './api/contracts';
type CatalogFilters = { categoryId?: string; governorateId?: string; cityId?: string };

export function listingQuery(
  workspace: string,
  q: string,
  cursor?: string,
  filters?: CatalogFilters,
) {
  return {
    ...filters,
    workspace: workspace === 'PROFESSIONAL' ? 'PROFESSIONALS' : 'FREELANCE',
    q: q || undefined,
    cursor,
    limit: 20,
  } satisfies NonNullable<ApiOperations['listListings']['parameters']['query']>;
}
export function productQuery(q: string, cursor?: string, filters?: CatalogFilters) {
  return { ...filters, q: q || undefined, cursor, limit: 20 } satisfies NonNullable<
    ApiOperations['listProducts']['parameters']['query']
  >;
}
