import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiRequest } from '../../common/actor';
import { AccessService } from '../../common/access.service';
import { CommandsService } from '../../common/commands.service';
import { fail, requireValue } from '../../common/errors';
import { page, pageArgs } from '../../common/pagination';
import { PrismaService, UnitOfWork } from '../../infrastructure/database/prisma.service';
import {
  CatalogPolicy,
  eligibleProfile,
  price,
  priceFilter,
  sortBy,
} from '../catalog/catalog.policy';
import { InventoryService } from '../inventory/inventory.service';
export const productInclude = {
  storefront: { include: { profile: true } },
  productAsset_product: { orderBy: { position: 'asc' as const } },
} satisfies Prisma.ProductInclude;
export type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;
export function productDto(p: ProductRow) {
  return {
    ...p,
    storeId: p.storefrontId,
    price: { currency: p.currency, units: p.priceUnits.toString() },
    photoIds: p.productAsset_product.map((x) => x.fileId),
    availableStock: p.stockOnHand - p.stockReserved,
  };
}
@Injectable()
export class ProductsService {
  async deactivateForStore(tx: UnitOfWork, storefrontId: string) {
    await tx.product.updateMany({
      where: { storefrontId, status: 'PUBLISHED' },
      data: { status: 'INACTIVE' },
    });
  }
  constructor(
    private readonly db: PrismaService,
    private readonly access: AccessService,
    private readonly commands: CommandsService,
    private readonly policy: CatalogPolicy,
    private readonly inventory: InventoryService,
  ) {}
  async listProducts(r: ApiRequest) {
    const q = r.query as Record<string, any>,
      scope = q.mine ? (r.actor?.id ?? fail('AUTH_REQUIRED', 401)) : 'products';
    if (q.sort === 'deliveryDays:asc') fail('INVALID_INPUT', 400);
    const where: Prisma.ProductWhereInput = {
      ...(q.mine
        ? { storefront: { profile: { userId: r.actor.id } } }
        : { status: 'PUBLISHED', storefront: { status: 'PUBLISHED', profile: eligibleProfile() } }),
      ...priceFilter(q),
      ...(q.storeId ? { storefrontId: q.storeId } : {}),
      ...(q.categoryId ? { categoryId: q.categoryId } : {}),
      ...(q.q
        ? {
            OR: [
              { titleAr: { contains: q.q, mode: 'insensitive' } },
              { titleEn: { contains: q.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    if (q.cityId || q.governorateId)
      where.storefront = {
        ...(where.storefront as object),
        ...(q.cityId ? { cityId: q.cityId } : {}),
        ...(q.governorateId ? { city: { governorateId: q.governorateId } } : {}),
      };
    return page(
      (
        await this.db.product.findMany({
          where,
          include: productInclude,
          ...pageArgs(q, scope, sortBy(q, 'storefront')),
        })
      ).map(productDto),
      q,
      scope,
    );
  }
  async read(id: string, tx: UnitOfWork = this.db) {
    return requireValue(
      await tx.product.findFirst({
        where: {
          id,
          status: 'PUBLISHED',
          category: { active: true },
          storefront: { status: 'PUBLISHED', profile: eligibleProfile() },
        },
        include: productInclude,
      }),
    );
  }
  async getProduct(r: ApiRequest) {
    const p = requireValue(
      await this.db.product.findUnique({
        where: { id: r.params.productId },
        include: productInclude,
      }),
    );
    if (p.storefront.profile.userId !== r.actor?.id) await this.read(p.id);
    return productDto(p);
  }
  private async own(r: ApiRequest, tx: UnitOfWork) {
    return requireValue(
      await tx.product.findFirst({
        where: {
          id: r.params.productId,
          storefront: { profile: { userId: r.actor.id, status: 'ACTIVE' } },
        },
        include: productInclude,
      }),
    );
  }
  createProduct(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const profile = await this.access.profile(r.actor, 'STORE_OWNER', tx),
        store = requireValue(await tx.storefront.findUnique({ where: { profileId: profile.id } })),
        b = r.body;
      await this.policy.category(tx, b.categoryId, 'HOME_STORE');
      await this.policy.photos(tx, r.actor, b.photoIds ?? []);
      const p = await tx.product.create({
        data: {
          storefrontId: store.id,
          categoryId: b.categoryId,
          titleAr: b.titleAr ?? '',
          titleEn: b.titleEn ?? '',
          descriptionAr: b.descriptionAr ?? '',
          descriptionEn: b.descriptionEn ?? '',
          ...price(b.price, 1n),
          stockOnHand: b.stockOnHand,
          productAsset_product: {
            create: (b.photoIds ?? []).map((fileId: string, position: number) => ({
              fileId,
              position,
            })),
          },
        },
        include: productInclude,
      });
      await this.commands.audit(tx, r.actor.id, p.id, 'product.created');
      return productDto(p);
    });
  }
  updateProduct(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const p = await this.own(r, tx),
        { price: money, photoIds, stockOnHand, ...b } = r.body;
      if (p.status === 'HIDDEN') fail('FORBIDDEN', 403);
      if (b.categoryId) await this.policy.category(tx, b.categoryId, 'HOME_STORE');
      if (stockOnHand !== undefined) await this.inventory.adjust(tx, p.id, stockOnHand);
      if (photoIds) {
        await this.policy.photos(tx, r.actor, photoIds);
        if (p.status === 'PUBLISHED' && !photoIds.length) fail('INVALID_INPUT', 400);
        await tx.productAsset.deleteMany({ where: { productId: p.id } });
      }
      if (p.status === 'PUBLISHED') this.policy.language({ ...p, ...b });
      const updated = await tx.product.update({
        where: { id: p.id },
        data: {
          ...b,
          ...(money ? price(money) : {}),
          ...(photoIds
            ? {
                productAsset_product: {
                  create: photoIds.map((fileId: string, position: number) => ({
                    fileId,
                    position,
                  })),
                },
              }
            : {}),
        },
        include: productInclude,
      });
      await this.commands.audit(tx, r.actor.id, p.id, 'product.updated');
      return productDto(updated);
    });
  }
  publishProduct(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      this.policy.publishing(r.actor);
      const p = await this.own(r, tx);
      if (p.status === 'HIDDEN') fail('FORBIDDEN', 403);
      this.policy.language(p);
      if (p.storefront.status !== 'PUBLISHED' || !p.productAsset_product.length)
        fail('INVALID_INPUT', 400);
      await this.policy.photos(
        tx,
        r.actor,
        p.productAsset_product.map((x) => x.fileId),
      );
      const result = await tx.product.update({
        where: { id: p.id },
        data: { status: 'PUBLISHED' },
        include: productInclude,
      });
      await this.commands.audit(tx, r.actor.id, p.id, 'product.published');
      return productDto(result);
    });
  }
  deactivateProduct(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const p = await this.own(r, tx);
      if (p.status === 'HIDDEN') fail('FORBIDDEN', 403);
      const result = await tx.product.update({
        where: { id: p.id },
        data: { status: 'INACTIVE' },
        include: productInclude,
      });
      await this.commands.audit(tx, r.actor.id, p.id, 'product.deactivated', {
        reason: r.body.reason,
      });
      return productDto(result);
    });
  }
  setProductStock(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const p = await this.own(r, tx);
      await this.inventory.adjust(tx, p.id, r.body.stockOnHand);
      await this.commands.audit(tx, r.actor.id, p.id, 'inventory.adjusted', {
        stockOnHand: r.body.stockOnHand,
        reason: r.body.reason,
      });
      return productDto(
        await tx.product.findUniqueOrThrow({ where: { id: p.id }, include: productInclude }),
      );
    });
  }
  async moderate(tx: UnitOfWork, id: string, outcome: string) {
    return tx.product.update({
      where: { id },
      data: { status: ['HIDE', 'REJECT'].includes(outcome) ? 'HIDDEN' : 'INACTIVE' },
    });
  }
  async inspect(tx: UnitOfWork, id: string) {
    return productDto(
      requireValue(await tx.product.findUnique({ where: { id }, include: productInclude })),
    );
  }
}
