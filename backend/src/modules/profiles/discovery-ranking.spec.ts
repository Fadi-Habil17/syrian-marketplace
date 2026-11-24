import { rankPage } from './discovery-ranking';
import type { ApiSchemas } from '@syrian-marketplace/contracts';
const make = (id: string, longitude: number | null): ApiSchemas['LocalResult'] => ({
  id,
  detailId: id,
  kind: 'STORE',
  nameAr: id,
  nameEn: id,
  regionEn: 'City',
  regionAr: 'مدينة',
  cityId: 'city',
  point: longitude === null ? null : { latitude: 0, longitude },
  precision: longitude === null ? null : 'APPROXIMATE',
});
it('ranks by public distance, breaks ties by ID, paginates unmapped entries last and binds cursors without exposing origin', () => {
  process.env.JWT_ACCESS_SECRET ??= 'test-only-key';
  const rows = [make('c', null), make('b', 2), make('a', 2), make('d', 0)];
  const origin = { latitude: 0, longitude: 0.01 },
    query = { cityId: 'city', origin, limit: 2 };
  const page = rankPage(rows, query, origin);
  expect(page.items.map((i) => i.id)).toEqual(['d', 'a']);
  const cursor = page.nextCursor!;
  expect(Buffer.from(cursor.split('.')[0]!, 'base64url').toString()).not.toContain('0.01');
  expect(rankPage(rows, { ...query, cursor }, origin).items.map((i) => i.id)).toEqual(['b', 'c']);
  expect(() => rankPage(rows, { ...query, cursor, areaId: 'other' }, origin)).toThrow();
  expect(() => rankPage(rows, { ...query, cursor }, { latitude: 0, longitude: 1 })).toThrow();
});
