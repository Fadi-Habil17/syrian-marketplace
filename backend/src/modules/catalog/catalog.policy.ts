import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Actor } from '../../common/actor';
import { AccessService } from '../../common/access.service';
import { fail } from '../../common/errors';
import { UnitOfWork } from '../../infrastructure/database/prisma.service';
export const eligibleProfile = () => ({
  status: 'ACTIVE' as const,
  user: {
    archivedAt: null,
    restriction_user: {
      none: {
        kind: 'SUSPENSION' as const,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    },
  },
});
export function price(b: { currency: string; units: string }, minimum = 2n) {
  const priceUnits = BigInt(b.units);
  if (priceUnits < minimum) fail('INVALID_INPUT', 400);
  return { currency: b.currency as any, priceUnits };
}
export function priceFilter(q: Record<string, any>) {
  if (
    (q.minPriceUnits || q.maxPriceUnits || String(q.sort ?? '').startsWith('price')) &&
    !q.currency
  )
    fail('INVALID_INPUT', 400);
  const lower = q.minPriceUnits ? BigInt(q.minPriceUnits) : undefined,
    upper = q.maxPriceUnits ? BigInt(q.maxPriceUnits) : undefined;
  if (lower !== undefined && upper !== undefined && lower > upper) fail('INVALID_INPUT', 400);
  return {
    ...(q.currency ? { currency: q.currency } : {}),
    ...(lower !== undefined || upper !== undefined
      ? { priceUnits: { gte: lower, lte: upper } }
      : {}),
  };
}
export function sortBy(q: Record<string, any>, ratingPath = 'profile') {
  const [key, direction] = String(q.sort ?? 'createdAt:desc').split(':');
  if (key === 'rating') {
    const rating = { ratingAverage: { sort: 'desc', nulls: 'last' } };
    return [
      ratingPath === 'profile' ? { profile: rating } : { storefront: { profile: rating } },
      { id: 'desc' },
    ];
  }
  if (!['createdAt', 'priceUnits', 'deliveryDays', 'nameEn'].includes(key!))
    fail('INVALID_INPUT', 400);
  return [{ [key!]: direction }, { id: direction }];
}
@Injectable()
export class CatalogPolicy {
  constructor(private readonly access: AccessService) {}
  publishing(actor: Actor) {
    if (actor.restrictions.includes('PUBLISHING')) fail('ACCOUNT_RESTRICTED', 403);
  }
  language(b: Record<string, unknown>, store = false) {
    for (const k of [
      store ? 'nameAr' : 'titleAr',
      store ? 'nameEn' : 'titleEn',
      'descriptionAr',
      'descriptionEn',
    ])
      if (typeof b[k] !== 'string' || !(b[k] as string).trim()) fail('INVALID_INPUT', 400);
  }
  async photos(tx: UnitOfWork, actor: Actor, ids: string[]) {
    await this.access.cleanFiles(ids, actor, 'PUBLIC_CATALOG', tx);
    if (
      ids.length &&
      (await tx.fileAsset.count({
        where: { id: { in: ids }, mimeType: { not: { startsWith: 'image/' } } },
      }))
    )
      fail('UNSUPPORTED_MEDIA_TYPE', 415);
  }
  async category(tx: UnitOfWork, id: string, workspace: string) {
    if (
      !(await tx.category.findFirst({ where: { id, workspace: workspace as any, active: true } }))
    )
      fail('INVALID_INPUT', 400);
  }
}
