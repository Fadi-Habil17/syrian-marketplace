import {
  coverageWhere,
  publicLocation,
  publicPlaceSelect,
  venueOf,
  venueData,
  venueSelect,
  type Point,
} from '../geography/public-location';
import { ProductsService } from '../products/products.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiRequest } from '../../common/actor';
import { AccessService } from '../../common/access.service';
import { CommandsService } from '../../common/commands.service';
import { fail, requireValue } from '../../common/errors';
import { page, pageArgs } from '../../common/pagination';
import { PrismaService, UnitOfWork } from '../../infrastructure/database/prisma.service';
import { CatalogPolicy, eligibleProfile, sortBy } from '../catalog/catalog.policy';
import { GeographyService } from '../geography/geography.service';
@Injectable()
export class StoresService {
  constructor(
    private readonly db: PrismaService,
    private readonly access: AccessService,
    private readonly commands: CommandsService,
    private readonly policy: CatalogPolicy,
    private readonly geography: GeographyService,
    private readonly products: ProductsService,
  ) {}
  async discovery(cityId: string, areaId?: string) {
    const stores = await this.db.storefront.findMany({
      where: {
        status: 'PUBLISHED',
        profile: {
          ...eligibleProfile(),
          type: 'STORE_OWNER',
          serviceArea_profile: { some: coverageWhere(cityId, areaId) },
        },
      },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        ...venueSelect,
        city: { select: publicPlaceSelect },
      },
    });
    return stores.map((s) => ({
      id: s.id,
      detailId: s.id,
      kind: 'STORE' as const,
      nameAr: s.nameAr,
      nameEn: s.nameEn,
      cityId: s.city.id,
      regionAr: s.city.nameAr,
      regionEn: s.city.nameEn,
      ...publicLocation(s, s.city),
    }));
  }
  async ownerVenue(tx: UnitOfWork, profileId: string, point?: Point | null) {
    const store = requireValue(await tx.storefront.findUnique({ where: { profileId } }));
    if (point === undefined) return { point: venueOf(store) };
    if (point && store.status !== 'PUBLISHED') fail('INVALID_TRANSITION');
    return {
      point: venueOf(
        await tx.storefront.update({ where: { id: store.id }, data: venueData(point) }),
      ),
    };
  }
  async listStores(r: ApiRequest) {
    const q = r.query as Record<string, any>,
      scope = q.mine ? (r.actor?.id ?? fail('AUTH_REQUIRED', 401)) : 'stores';
    const where: Prisma.StorefrontWhereInput = {
      ...(q.mine
        ? { profile: { userId: r.actor.id } }
        : { status: 'PUBLISHED', profile: eligibleProfile() }),
      ...(q.cityId ? { cityId: q.cityId } : {}),
      ...(q.governorateId ? { city: { governorateId: q.governorateId } } : {}),
      ...(q.q
        ? {
            OR: [
              { nameAr: { contains: q.q, mode: 'insensitive' } },
              { nameEn: { contains: q.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    return page(
      await this.db.storefront.findMany({ where, ...pageArgs(q, scope, sortBy(q)) }),
      q,
      scope,
    );
  }
  async read(id: string, tx: UnitOfWork = this.db) {
    return requireValue(
      await tx.storefront.findFirst({
        where: { id, status: 'PUBLISHED', profile: eligibleProfile() },
        include: { profile: true },
      }),
    );
  }
  async getStore(r: ApiRequest) {
    const s = requireValue(
      await this.db.storefront.findUnique({
        where: { id: r.params.storeId },
        include: { profile: true },
      }),
    );
    if (s.profile.userId !== r.actor?.id) await this.read(s.id);
    return s;
  }
  async own(id: string, r: ApiRequest, tx: UnitOfWork = this.db) {
    return requireValue(
      await tx.storefront.findFirst({
        where: { id, profile: { userId: r.actor.id, status: 'ACTIVE' } },
      }),
    );
  }
  createStore(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const p = await this.access.profile(r.actor, 'STORE_OWNER', tx),
        b = r.body;
      await this.geography.validateLocation(b.cityId, null, tx);
      if (b.logoId) await this.policy.photos(tx, r.actor, [b.logoId]);
      const store = await tx.storefront.create({
        data: {
          profileId: p.id,
          nameAr: b.nameAr ?? '',
          nameEn: b.nameEn ?? '',
          descriptionAr: b.descriptionAr ?? '',
          descriptionEn: b.descriptionEn ?? '',
          cityId: b.cityId,
          logoId: b.logoId,
          supportsSellerDelivery: b.supportsSellerDelivery,
          supportsPlatformDelivery: b.supportsPlatformDelivery,
        },
      });
      await this.commands.audit(tx, r.actor.id, store.id, 'store.created');
      return store;
    });
  }
  updateStore(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const s = await this.own(r.params.storeId!, r, tx),
        b = r.body;
      if (s.status === 'HIDDEN') fail('FORBIDDEN', 403);
      if (b.cityId) await this.geography.validateLocation(b.cityId, null, tx);
      if (b.logoId) await this.policy.photos(tx, r.actor, [b.logoId]);
      if (s.status === 'PUBLISHED') this.policy.language({ ...s, ...b }, true);
      const updated = await tx.storefront.update({ where: { id: s.id }, data: b });
      await this.commands.audit(tx, r.actor.id, s.id, 'store.updated');
      return updated;
    });
  }
  publishStore(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      this.policy.publishing(r.actor);
      const s = await this.own(r.params.storeId!, r, tx);
      if (s.status === 'HIDDEN') fail('FORBIDDEN', 403);
      this.policy.language(s, true);
      if (!s.logoId || (!s.supportsSellerDelivery && !s.supportsPlatformDelivery))
        fail('INVALID_INPUT', 400);
      await this.policy.photos(tx, r.actor, [s.logoId]);
      const result = await tx.storefront.update({
        where: { id: s.id },
        data: { status: 'PUBLISHED' },
      });
      await this.commands.audit(tx, r.actor.id, s.id, 'store.published');
      return result;
    });
  }
  deactivateStore(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const s = await this.own(r.params.storeId!, r, tx);
      if (s.status === 'HIDDEN') fail('FORBIDDEN', 403);
      const result = await tx.storefront.update({
        where: { id: s.id },
        data: { status: 'INACTIVE' },
      });
      await this.products.deactivateForStore(tx, s.id);
      await this.commands.audit(tx, r.actor.id, s.id, 'store.deactivated', {
        reason: r.body.reason,
      });
      return result;
    });
  }
  async moderate(tx: UnitOfWork, id: string, outcome: string) {
    return tx.storefront.update({
      where: { id },
      data: { status: ['HIDE', 'REJECT'].includes(outcome) ? 'HIDDEN' : 'INACTIVE' },
    });
  }
  async archiveForProfile(tx: UnitOfWork, profileId: string) {
    const s = await tx.storefront.findUnique({ where: { profileId } });
    if (s) {
      if (s.status === 'PUBLISHED')
        await tx.storefront.update({ where: { id: s.id }, data: { status: 'INACTIVE' } });
      await this.products.deactivateForStore(tx, s.id);
    }
  }
  async inspect(tx: UnitOfWork, id: string) {
    return requireValue(await tx.storefront.findUnique({ where: { id } }));
  }
}
