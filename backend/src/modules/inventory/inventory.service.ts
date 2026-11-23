import { Injectable, Module } from '@nestjs/common';
import type { OrderItem, StockReservation } from '@prisma/client';
import { UnitOfWork } from '../../infrastructure/database/prisma.service';
import { fail } from '../../common/errors';
export interface StockReturn {
  reservationId: string;
  reusableQuantity: number;
  nonRestockableQuantity: number;
  reason: string;
}
@Injectable()
export class InventoryService {
  async releaseReserved(tx: UnitOfWork, storeOrderId: string) {
    const rs = await tx.stockReservation.findMany({
      where: { orderItem: { storeOrderId }, status: 'RESERVED' },
      orderBy: { productId: 'asc' },
    });
    for (const r of rs) {
      await tx.$queryRaw`SELECT "id" FROM "Product" WHERE "id"=${r.productId}::uuid FOR UPDATE`;
      await tx.product.update({
        where: { id: r.productId },
        data: { stockReserved: { decrement: r.quantity } },
      });
      await tx.stockReservation.update({ where: { id: r.id }, data: { status: 'RELEASED' } });
    }
  }
  async reserve(tx: UnitOfWork, items: OrderItem[]) {
    for (const item of [...items].sort((a, b) => a.productId.localeCompare(b.productId))) {
      await tx.$queryRaw`SELECT "id" FROM "Product" WHERE "id"=${item.productId}::uuid FOR UPDATE`;
      if (
        (await tx.$executeRaw`UPDATE "Product" SET "stockReserved"="stockReserved"+${item.quantity},"updatedAt"=transaction_timestamp() WHERE "id"=${item.productId}::uuid AND "status"='PUBLISHED' AND "stockOnHand"-"stockReserved">=${item.quantity}`) !==
        1
      )
        fail('STOCK_UNAVAILABLE');
      await tx.stockReservation.create({
        data: { orderItemId: item.id, productId: item.productId, quantity: item.quantity },
      });
    }
  }
  async consume(tx: UnitOfWork, storeOrderId: string) {
    const rs = await tx.stockReservation.findMany({
      where: { orderItem: { storeOrderId }, status: 'RESERVED' },
      orderBy: { productId: 'asc' },
    });
    for (const r of rs) {
      await tx.$queryRaw`SELECT "id" FROM "Product" WHERE "id"=${r.productId}::uuid FOR UPDATE`;
      await tx.product.update({
        where: { id: r.productId },
        data: { stockOnHand: { decrement: r.quantity }, stockReserved: { decrement: r.quantity } },
      });
      await tx.stockReservation.update({ where: { id: r.id }, data: { status: 'CONSUMED' } });
    }
  }
  async reconcile(
    tx: UnitOfWork,
    reservations: StockReservation[],
    returns: StockReturn[],
    actorId: string,
  ) {
    if (
      returns.length !== reservations.length ||
      new Set(returns.map((x) => x.reservationId)).size !== reservations.length
    )
      fail('INVALID_INPUT', 400);
    for (const r of [...reservations].sort((a, b) => a.productId.localeCompare(b.productId))) {
      const b = returns.find((x) => x.reservationId === r.id);
      if (
        !b ||
        !Number.isInteger(b.reusableQuantity) ||
        !Number.isInteger(b.nonRestockableQuantity) ||
        b.reusableQuantity < 0 ||
        b.nonRestockableQuantity < 0 ||
        b.reusableQuantity + b.nonRestockableQuantity !== r.quantity ||
        !b.reason.trim() ||
        r.status === 'RELEASED'
      )
        fail('INVALID_INPUT', 400);
      await tx.$queryRaw`SELECT "id" FROM "Product" WHERE "id"=${r.productId}::uuid FOR UPDATE`;
      await tx.product.update({
        where: { id: r.productId },
        data:
          r.status === 'RESERVED'
            ? {
                stockReserved: { decrement: r.quantity },
                stockOnHand: { decrement: b.nonRestockableQuantity },
              }
            : { stockOnHand: { increment: b.reusableQuantity } },
      });
      await tx.stockReservation.update({ where: { id: r.id }, data: { status: 'RELEASED' } });
      await tx.stockReconciliation.create({
        data: {
          reservationId: r.id,
          actorId,
          reusableQuantity: b.reusableQuantity,
          nonRestockableQuantity: b.nonRestockableQuantity,
          reason: b.reason,
        },
      });
    }
  }
  async adjust(tx: UnitOfWork, id: string, stockOnHand: number) {
    await tx.$queryRaw`SELECT "id" FROM "Product" WHERE "id"=${id}::uuid FOR UPDATE`;
    const p = await tx.product.findUniqueOrThrow({ where: { id } });
    if (stockOnHand < p.stockReserved) fail('STOCK_UNAVAILABLE');
    return tx.product.update({ where: { id }, data: { stockOnHand } });
  }
}
@Module({ providers: [InventoryService], exports: [InventoryService] })
export class InventoryModule {}
