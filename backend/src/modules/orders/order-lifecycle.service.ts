import { EscrowModule, EscrowService } from '../escrow/escrow.service';
import { Injectable, Module } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Currency, OrderState, Prisma, ServiceKind, Workspace } from '@prisma/client';
import { Actor } from '../../common/actor';
import { CommandsService } from '../../common/commands.service';
import { fail } from '../../common/errors';
import { UnitOfWork } from '../../infrastructure/database/prisma.service';
import { DeadlinesModule, DeadlinesService } from '../jobs/deadlines.service';
import { serviceSplit } from '../payments/domain/money';
import { assertTransition, terminalStates } from './domain/order-state-machine';
@Injectable()
export class OrderLifecycle {
  constructor(
    private readonly commands: CommandsService,
    readonly deadlines: DeadlinesService,
    private readonly escrow: EscrowService,
  ) {}
  async changed(
    tx: UnitOfWork,
    o: { id: string; state: OrderState; version: number },
    state: OrderState,
    actorId: string | null,
    reason: string,
  ) {
    assertTransition(o.state, state);
    const next = await tx.marketOrder.update({
      where: { id: o.id },
      data: {
        state,
        version: { increment: 1 },
        ...(terminalStates.includes(state) ? { completedAt: await this.deadlines.now(tx) } : {}),
      },
    });
    const operationKey = `order:${o.id}:${next.version}`;
    await tx.orderTransition.create({
      data: {
        orderId: o.id,
        fromState: o.state,
        toState: state,
        version: next.version,
        actorId,
        reason,
        operationKey,
      },
    });
    await this.commands.audit(tx, actorId, o.id, 'order.' + state.toLowerCase(), {
      version: next.version,
      reason,
    });
    await tx.outboxEvent.create({
      data: {
        aggregateId: o.id,
        aggregateVersion: next.version,
        type: 'order.updated',
        deduplicationKey: operationKey,
        payload: { orderId: o.id, state },
      },
    });
    return next;
  }
  async initialize(
    tx: UnitOfWork,
    actor: Actor,
    b: {
      sellerProfileId: string;
      sellerUserId: string;
      workspace: Workspace;
      state: OrderState;
      currency: Currency;
      total: bigint | null;
      scope: string;
      listingId?: string;
      kind: ServiceKind;
      dueAt?: Date;
      addressSnapshot?: Prisma.InputJsonObject;
    },
  ) {
    if (actor.id === b.sellerUserId) fail('INVALID_INPUT', 400);
    if (actor.restrictions.includes('PURCHASING')) fail('ACCOUNT_RESTRICTED', 403);
    const now = await this.deadlines.now(tx),
      id = randomUUID(),
      split = b.total === null ? null : serviceSplit(b.total);
    const order = await tx.marketOrder.create({
      data: {
        id,
        buyerId: actor.id,
        sellerProfileId: b.sellerProfileId,
        workspace: b.workspace,
        state: b.state,
        currency: b.currency,
        agreedTotalUnits: b.total,
        eligibleSellerUnits: b.total,
        agreementSnapshot: {
          scope: b.scope,
          listingId: b.listingId ?? null,
          proposal: {
            scope: b.scope,
            dueAt: b.dueAt?.toISOString() ?? null,
            approvedBy: [actor.id],
          },
        },
        addressSnapshot: b.addressSnapshot,
      },
    });
    const service = await tx.serviceOrder.create({
      data: {
        orderId: id,
        kind: b.kind,
        listingId: b.listingId,
        dueAt: b.dueAt,
        depositUnits: split?.deposit,
        balanceUnits: split?.balance,
        responseDeadlineAt: new Date(now.getTime() + 72 * 3600000),
      },
    });
    await this.escrowAndRooms(tx, id, b.currency, false);
    await this.created(tx, order, actor.id, 'Order requested');
    await this.deadlines.schedule(tx, id, 'RESPONSE_EXPIRY', service.responseDeadlineAt!, 1);
    return { order, service };
  }
  async escrowAndRooms(tx: UnitOfWork, id: string, currency: Currency, store: boolean) {
    await this.escrow.create(tx, id, currency);
    await tx.chatRoom.create({ data: { orderId: id, kind: 'ORDER_SHARED' } });
    if (store) await tx.chatRoom.create({ data: { orderId: id, kind: 'DELIVERY' } });
  }
  async created(
    tx: UnitOfWork,
    o: { id: string; state: OrderState; version: number },
    actorId: string,
    reason: string,
  ) {
    const operationKey = `created:${o.id}`;
    await tx.orderTransition.create({
      data: {
        orderId: o.id,
        fromState: 'DRAFT',
        toState: o.state,
        version: o.version,
        actorId,
        reason,
        operationKey,
      },
    });
    await this.commands.audit(tx, actorId, o.id, 'order.created');
    await tx.outboxEvent.create({
      data: {
        aggregateId: o.id,
        aggregateVersion: o.version,
        type: 'order.updated',
        deduplicationKey: operationKey,
        payload: { orderId: o.id, state: o.state },
      },
    });
  }
  async awaitDeposit(
    tx: UnitOfWork,
    o: { id: string; state: OrderState; version: number },
    serviceId: string,
    actorId: string,
  ) {
    const now = await this.deadlines.now(tx),
      deadline = new Date(now.getTime() + 48 * 3600000);
    await tx.serviceOrder.update({
      where: { id: serviceId },
      data: { depositDeadlineAt: deadline },
    });
    const next = await this.changed(
      tx,
      o,
      'AWAITING_DEPOSIT',
      actorId,
      'Agreement and schedule confirmed',
    );
    await this.deadlines.schedule(tx, o.id, 'DEPOSIT_EXPIRY', deadline, next.version);
    return next;
  }
}
@Module({
  imports: [DeadlinesModule, EscrowModule],
  providers: [OrderLifecycle],
  exports: [OrderLifecycle, DeadlinesModule],
})
export class OrderCoreModule {}
