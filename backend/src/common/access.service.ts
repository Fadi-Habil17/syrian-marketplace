import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService, UnitOfWork } from '../infrastructure/database/prisma.service';
import { Actor } from './actor';
import { fail, requireValue } from './errors';
export const orderInclude = {
  sellerProfile: true,
  escrow_order: true,
  serviceOrder_order: {
    include: {
      booking_serviceOrder: true,
      approvedQuote: true,
      inspectionRequest_serviceOrder: true,
    },
  },
  storeOrder_order: {
    include: {
      orderItem_storeOrder: true,
      delivery_storeOrder: {
        include: { driverAssignment_delivery: { include: { driver: true } } },
      },
    },
  },
} satisfies Prisma.MarketOrderInclude;
export type OrderAggregate = Prisma.MarketOrderGetPayload<{ include: typeof orderInclude }>;
@Injectable()
export class AccessService {
  constructor(private readonly db: PrismaService) {}
  async profile(actor: Actor, type?: string, tx: UnitOfWork = this.db) {
    const p = await tx.businessProfile.findFirst({
      where: { userId: actor.id, status: 'ACTIVE', ...(type ? { type: type as any } : {}) },
    });
    if (!p || !actor.roles.includes(p.type)) fail('WORKSPACE_INACTIVE', 403);
    return p;
  }
  async ownedProfile(id: string, actor: Actor, tx: UnitOfWork = this.db) {
    return requireValue(await tx.businessProfile.findFirst({ where: { id, userId: actor.id } }));
  }
  async order(
    id: string,
    actor: Actor,
    tx: UnitOfWork = this.db,
    lock = false,
  ): Promise<OrderAggregate> {
    let o = requireValue(await tx.marketOrder.findUnique({ where: { id }, include: orderInclude }));
    if (lock) {
      await this.db.lockUsers(tx, [o.buyerId, o.sellerProfile.userId]);
      await tx.$queryRaw`SELECT "id" FROM "MarketOrder" WHERE "id"=${id}::uuid FOR UPDATE`;
      o = requireValue(await tx.marketOrder.findUnique({ where: { id }, include: orderInclude }));
    }
    if (
      actor.id !== o.buyerId &&
      actor.id !== o.sellerProfile.userId &&
      !(
        actor.roles.includes('ADMIN') &&
        (await tx.caseRecord.findFirst({ where: { orderId: id, handlingAdminId: actor.id } }))
      )
    )
      fail('NOT_FOUND', 404);
    return o;
  }
  verified(actor: Actor) {
    if (!actor.verified) fail('EMAIL_NOT_VERIFIED', 403);
  }
  seller(o: OrderAggregate, actor: Actor) {
    if (o.sellerProfile.userId !== actor.id) fail('FORBIDDEN', 403);
    if (o.sellerProfile.status !== 'ACTIVE' || !actor.roles.includes(o.sellerProfile.type))
      fail('WORKSPACE_INACTIVE', 403);
  }
  buyer(o: OrderAggregate, actor: Actor) {
    if (o.buyerId !== actor.id) fail('FORBIDDEN', 403);
  }
  version(o: OrderAggregate, value: unknown) {
    if (String(value) !== `"${o.version}"`) fail('VERSION_CONFLICT');
  }
  async cleanFiles(
    ids: string[],
    actor: Actor,
    accessClass: string,
    tx: UnitOfWork = this.db,
    orderId?: string,
  ) {
    if (new Set(ids).size !== ids.length) fail('INVALID_INPUT', 400);
    for (const id of ids)
      if (
        !(await tx.fileAsset.findFirst({
          where: {
            id,
            ownerId: actor.id,
            accessClass: accessClass as any,
            scanStatus: 'CLEAN',
            ...(orderId ? { orderId } : {}),
          },
        }))
      )
        fail('NOT_FOUND', 404);
  }
}
