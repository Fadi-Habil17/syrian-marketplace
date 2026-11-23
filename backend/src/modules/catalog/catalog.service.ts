import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiRequest } from '../../common/actor';
import { AccessService } from '../../common/access.service';
import { CommandsService } from '../../common/commands.service';
import { fail, requireValue } from '../../common/errors';
import { page, pageArgs } from '../../common/pagination';
import { PrismaService, UnitOfWork } from '../../infrastructure/database/prisma.service';
import { CatalogPolicy, eligibleProfile, price, priceFilter, sortBy } from './catalog.policy';
export const listingInclude = {
  profile: true,
  listingAsset_listing: { orderBy: { position: 'asc' as const } },
} satisfies Prisma.ListingInclude;
type ListingRow = Prisma.ListingGetPayload<{ include: typeof listingInclude }>;
export function listingDto(l: ListingRow) {
  return {
    ...l,
    price: { currency: l.currency, units: l.priceUnits.toString() },
    photoIds: l.listingAsset_listing.map((f) => f.fileId),
    ratingAverage: l.profile.ratingAverage,
  };
}
@Injectable()
export class CatalogService {
  async archiveOffers(tx: UnitOfWork, profileId: string) {
    await tx.listing.updateMany({
      where: { profileId, status: 'PUBLISHED' },
      data: { status: 'INACTIVE' },
    });
  }
  constructor(
    private readonly db: PrismaService,
    private readonly access: AccessService,
    private readonly commands: CommandsService,
    private readonly policy: CatalogPolicy,
  ) {}
  async listCategories(r: ApiRequest) {
    return page(
      await this.db.category.findMany({
        where: {
          active: true,
          ...(r.query.workspace ? { workspace: r.query.workspace as any } : {}),
        },
        ...pageArgs(r.query, 'categories', [{ nameEn: 'asc' }, { id: 'asc' }]),
      }),
      r.query,
      'categories',
    );
  }
  async listListings(r: ApiRequest) {
    const q = r.query as Record<string, any>,
      scope = q.mine ? (r.actor?.id ?? fail('AUTH_REQUIRED', 401)) : 'listings';
    const where: Prisma.ListingWhereInput = {
      ...(q.mine
        ? { profile: { userId: r.actor.id } }
        : { status: 'PUBLISHED', profile: eligibleProfile() }),
      ...priceFilter(q),
      ...(q.workspace
        ? { kind: q.workspace === 'FREELANCE' ? 'FREELANCE' : 'PROFESSIONAL_PACKAGE' }
        : {}),
      ...(q.categoryId ? { categoryId: q.categoryId } : {}),
      ...(q.maxDeliveryDays ? { deliveryDays: { lte: q.maxDeliveryDays } } : {}),
      ...(q.q
        ? {
            OR: [
              { titleAr: { contains: String(q.q).normalize('NFKC'), mode: 'insensitive' } },
              { titleEn: { contains: String(q.q).normalize('NFKC'), mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    if (q.cityId || q.governorateId || q.minRating)
      (where.profile as any) = {
        ...(where.profile as object),
        ...(q.cityId ? { cityId: q.cityId } : {}),
        ...(q.governorateId ? { city: { governorateId: q.governorateId } } : {}),
        ...(q.minRating ? { ratingAverage: { gte: q.minRating } } : {}),
      };
    return page(
      (
        await this.db.listing.findMany({
          where,
          include: listingInclude,
          ...pageArgs(q, scope, sortBy(q)),
        })
      ).map(listingDto),
      q,
      scope,
    );
  }
  async read(id: string, tx: UnitOfWork = this.db) {
    return requireValue(
      await tx.listing.findFirst({
        where: { id, status: 'PUBLISHED', profile: eligibleProfile(), category: { active: true } },
        include: listingInclude,
      }),
    );
  }
  async getListing(r: ApiRequest) {
    const l = requireValue(
      await this.db.listing.findUnique({
        where: { id: r.params.listingId },
        include: listingInclude,
      }),
    );
    if (l.profile.userId !== r.actor?.id) await this.read(l.id);
    return listingDto(l);
  }
  private async own(r: ApiRequest, tx: UnitOfWork) {
    const l = requireValue(
      await tx.listing.findFirst({
        where: { id: r.params.listingId, profile: { userId: r.actor.id, status: 'ACTIVE' } },
        include: listingInclude,
      }),
    );
    return l;
  }
  createListing(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const b = r.body,
        kind = b.kind === 'FREELANCE' ? 'FREELANCER' : 'PROFESSIONAL',
        p = await this.access.profile(r.actor, kind, tx);
      await this.policy.category(
        tx,
        b.categoryId,
        kind === 'FREELANCER' ? 'FREELANCE' : 'PROFESSIONALS',
      );
      await this.policy.photos(tx, r.actor, b.photoIds ?? []);
      const l = await tx.listing.create({
        data: {
          profileId: p.id,
          categoryId: b.categoryId,
          kind: b.kind,
          titleAr: b.titleAr ?? '',
          titleEn: b.titleEn ?? '',
          descriptionAr: b.descriptionAr ?? '',
          descriptionEn: b.descriptionEn ?? '',
          ...price(b.price),
          deliveryDays: b.deliveryDays,
          durationMinutes: b.durationMinutes,
          listingAsset_listing: {
            create: (b.photoIds ?? []).map((fileId: string, position: number) => ({
              fileId,
              position,
            })),
          },
        },
        include: listingInclude,
      });
      await this.commands.audit(tx, r.actor.id, l.id, 'listing.created');
      return listingDto(l);
    });
  }
  updateListing(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const l = await this.own(r, tx),
        b = r.body;
      if (l.status === 'HIDDEN') fail('FORBIDDEN', 403);
      if (b.kind && b.kind !== l.kind) fail('INVALID_INPUT', 400);
      if (b.categoryId)
        await this.policy.category(
          tx,
          b.categoryId,
          l.kind === 'FREELANCE' ? 'FREELANCE' : 'PROFESSIONALS',
        );
      const { photoIds, price: p, ...data } = b;
      if (photoIds) {
        await this.policy.photos(tx, r.actor, photoIds);
        await tx.listingAsset.deleteMany({ where: { listingId: l.id } });
      }
      if (l.status === 'PUBLISHED') this.policy.language({ ...l, ...data });
      const updated = await tx.listing.update({
        where: { id: l.id },
        data: {
          ...data,
          ...(p ? price(p) : {}),
          ...(photoIds
            ? {
                listingAsset_listing: {
                  create: photoIds.map((fileId: string, position: number) => ({
                    fileId,
                    position,
                  })),
                },
              }
            : {}),
        },
        include: listingInclude,
      });
      await this.commands.audit(tx, r.actor.id, l.id, 'listing.updated');
      return listingDto(updated);
    });
  }
  publishListing(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      this.policy.publishing(r.actor);
      const l = await this.own(r, tx);
      if (l.status === 'HIDDEN') fail('FORBIDDEN', 403);
      this.policy.language(l);
      if (
        l.kind === 'FREELANCE'
          ? !l.deliveryDays
          : !l.durationMinutes || l.durationMinutes % 30 !== 0
      )
        fail('INVALID_INPUT', 400);
      await this.policy.photos(
        tx,
        r.actor,
        l.listingAsset_listing.map((x) => x.fileId),
      );
      const result = await tx.listing.update({
        where: { id: l.id },
        data: { status: 'PUBLISHED' },
        include: listingInclude,
      });
      await this.commands.audit(tx, r.actor.id, l.id, 'listing.published');
      return listingDto(result);
    });
  }
  deactivateListing(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const l = await this.own(r, tx);
      if (l.status === 'HIDDEN') fail('FORBIDDEN', 403);
      const result = await tx.listing.update({
        where: { id: l.id },
        data: { status: 'INACTIVE' },
        include: listingInclude,
      });
      await this.commands.audit(tx, r.actor.id, l.id, 'listing.deactivated', {
        reason: r.body.reason,
      });
      return listingDto(result);
    });
  }
  async moderate(tx: UnitOfWork, id: string, outcome: string) {
    return tx.listing.update({
      where: { id },
      data: { status: ['HIDE', 'REJECT'].includes(outcome) ? 'HIDDEN' : 'INACTIVE' },
    });
  }
  async inspect(tx: UnitOfWork, id: string) {
    return listingDto(
      requireValue(await tx.listing.findUnique({ where: { id }, include: listingInclude })),
    );
  }
}
