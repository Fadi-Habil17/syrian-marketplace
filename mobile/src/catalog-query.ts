import type { ApiOperations } from './api/contracts';
export function listingQuery(workspace: string, q: string, cursor?: string) {
  return {
    workspace: workspace === 'PROFESSIONAL' ? 'PROFESSIONALS' : 'FREELANCE',
    q: q || undefined,
    cursor,
    limit: 20,
  } satisfies NonNullable<ApiOperations['listListings']['parameters']['query']>;
}
export function productQuery(q: string, cursor?: string) {
  return { q: q || undefined, cursor, limit: 20 } satisfies NonNullable<
    ApiOperations['listProducts']['parameters']['query']
  >;
}
