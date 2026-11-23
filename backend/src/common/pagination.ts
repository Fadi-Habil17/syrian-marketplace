import { createHmac, timingSafeEqual } from 'node:crypto';
import { fail } from './errors';
const bindingOf = (q: ListQuery, scope: string) =>
  JSON.stringify(
    Object.fromEntries(
      Object.entries({ ...q, cursor: undefined, limit: undefined, scope })
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
  );
export interface ListQuery {
  limit?: number;
  cursor?: string;
  sort?: string;
  [key: string]: unknown;
}
function signature(value: string) {
  return createHmac('sha256', process.env.JWT_ACCESS_SECRET!).update(value).digest('base64url');
}
export function pageArgs(
  q: ListQuery,
  scope: string,
  orderBy: object[] = [{ createdAt: 'desc' }, { id: 'desc' }],
) {
  let id: string | undefined;
  const binding = bindingOf(q, scope);
  if (q.cursor) {
    try {
      const [body, mac] = q.cursor.split('.');
      if (!body || !mac || !timingSafeEqual(Buffer.from(mac), Buffer.from(signature(body))))
        fail('INVALID_CURSOR', 400);
      const p = JSON.parse(Buffer.from(body, 'base64url').toString());
      if (p.binding !== binding) fail('INVALID_CURSOR', 400);
      id = p.id;
    } catch {
      fail('INVALID_CURSOR', 400);
    }
  }
  return {
    take: Math.min(Number(q.limit ?? 20), 100) + 1,
    ...(id ? { cursor: { id }, skip: 1 } : {}),
    orderBy,
  };
}
export function page<T extends { id: string }>(rows: T[], q: ListQuery, scope: string) {
  const limit = Math.min(Number(q.limit ?? 20), 100),
    items = rows.slice(0, limit);
  let nextCursor: string | null = null;
  if (rows.length > limit) {
    const body = Buffer.from(
      JSON.stringify({ id: items.at(-1)!.id, binding: bindingOf(q, scope) }),
    ).toString('base64url');
    nextCursor = body + '.' + signature(body);
  }
  return { items, nextCursor };
}
