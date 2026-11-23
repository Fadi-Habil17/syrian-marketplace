import { Injectable, Module } from '@nestjs/common';
import { Actor } from '../../common/actor';
import { UnitOfWork } from '../../infrastructure/database/prisma.service';
import { orderInclude } from '../../common/access.service';
import { fail, requireValue } from '../../common/errors';
@Injectable()
export class ChatAccess {
  async rooms(tx: UnitOfWork, orderId: string, actor: Actor) {
    const o = requireValue(
      await tx.marketOrder.findUnique({ where: { id: orderId }, include: orderInclude }),
    );
    let driver = false;
    if (![o.buyerId, o.sellerProfile.userId].includes(actor.id)) {
      driver =
        actor.roles.includes('DELIVERY_DRIVER') &&
        !!o.storeOrder_order?.delivery_storeOrder?.driverAssignment_delivery.some(
          (a) =>
            a.driver.userId === actor.id &&
            a.driver.status === 'ACTIVE' &&
            ['ASSIGNED', 'PICKED_UP'].includes(a.status),
        );
      if (
        !driver &&
        !(
          actor.roles.includes('ADMIN') &&
          (await tx.caseRecord.findFirst({ where: { orderId, handlingAdminId: actor.id } }))
        )
      )
        fail('NOT_FOUND', 404);
    }
    return {
      order: o,
      driver,
      rooms: await tx.chatRoom.findMany({
        where: { orderId, ...(driver ? { kind: 'DELIVERY' } : {}) },
      }),
    };
  }
  async room(tx: UnitOfWork, id: string, actor: Actor) {
    const room = requireValue(await tx.chatRoom.findUnique({ where: { id } })),
      grant = await this.rooms(tx, room.orderId, actor);
    if (!grant.rooms.some((r) => r.id === id)) fail('NOT_FOUND', 404);
    return { ...grant, room };
  }
}
@Module({ providers: [ChatAccess], exports: [ChatAccess] })
export class ChatAccessModule {}
