import { createHmac } from 'node:crypto';
import type { ApiSchemas } from '@syrian-marketplace/contracts';
import { page, pageArgs } from '../../common/pagination';
type Point = ApiSchemas['GeoPoint'];
function distance(a: Point, b: Point) {
  const radians = Math.PI / 180;
  const h =
    Math.sin(((a.latitude - b.latitude) * radians) / 2) ** 2 +
    Math.cos(a.latitude * radians) *
      Math.cos(b.latitude * radians) *
      Math.sin(((a.longitude - b.longitude) * radians) / 2) ** 2;
  return 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}
export function rankPage(
  rows: ApiSchemas['LocalResult'][],
  search: ApiSchemas['LocalSearch'],
  origin: Point | null,
) {
  const digest = createHmac('sha256', process.env.JWT_ACCESS_SECRET!)
    .update(
      JSON.stringify([
        'local',
        search.cityId,
        search.areaId ?? null,
        search.kind ?? null,
        origin?.latitude,
        origin?.longitude,
      ]),
    )
    .digest('hex');
  const q = { cursor: search.cursor, limit: search.limit };
  const after = pageArgs(q, digest).cursor?.id;
  const ranked = rows
    .map((item) => {
      // Fixed-width nanoradians give a lexicographic continuation key; unmapped places sort last.
      const key = item.point
        ? origin
          ? Math.round(distance(origin, item.point) * 1e9)
          : 0
        : 9999999999;
      return { id: String(key).padStart(10, '0') + '-' + item.id + '-' + item.kind, item };
    })
    .filter((r) => !after || r.id > after)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const result = page(ranked, q, digest);
  return { items: result.items.map((r) => r.item), nextCursor: result.nextCursor };
}
