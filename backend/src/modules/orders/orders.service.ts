import { Injectable } from '@nestjs/common';
import { ApiRequest } from '../../common/actor';
import { AccessService, OrderAggregate } from '../../common/access.service';
import { CommandsService, jsonValue } from '../../common/commands.service';
import { fail, requireValue } from '../../common/errors';
import { PrismaService, UnitOfWork } from '../../infrastructure/database/prisma.service';
import { OrderLifecycle } from './order-lifecycle.service';
import { OrdersQueryService } from './orders-query.service';
import { beforeDeadline } from './domain/order-state-machine';
import { SchedulingService } from '../scheduling/scheduling.service';
import { MarketplaceFinance } from '../payments/application/marketplace-finance';
@Injectable()
export class OrdersService {
  constructor(
    private readonly db: PrismaService,
    private readonly commands: CommandsService,
    private readonly access: AccessService,
    private readonly lifecycle: OrderLifecycle,
    private readonly query: OrdersQueryService,
    private readonly scheduling: SchedulingService,
    private readonly finance: MarketplaceFinance,
  ) {}
  acceptStoreOrder(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const o = await this.writable(tx, r);
      this.access.seller(o, r.actor);
      const s = requireValue(o.storeOrder_order);
      if (o.state !== 'PAID_IN_ESCROW') fail('INVALID_TRANSITION');
      beforeDeadline(await this.lifecycle.deadlines.now(tx), s.sellerAcceptanceDeadlineAt);
      await tx.storeOrder.update({
        where: { id: s.id },
        data: { acceptedAt: await this.lifecycle.deadlines.now(tx) },
      });
      await this.lifecycle.changed(
        tx,
        o,
        'PREPARING',
        r.actor.id,
        'Seller accepted paid store order',
      );
      return this.query.action(o.id, tx);
    });
  }
  markStoreReady(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const o = await this.writable(tx, r);
      this.access.seller(o, r.actor);
      if (o.state !== 'PREPARING' || !o.storeOrder_order?.acceptedAt) fail('INVALID_TRANSITION');
      await this.lifecycle.changed(
        tx,
        o,
        'READY_FOR_DELIVERY',
        r.actor.id,
        'Goods prepared for agreed delivery',
      );
      return this.query.action(o.id, tx);
    });
  }
  private async writable(tx: UnitOfWork, r: ApiRequest) {
    const o = await this.access.order(r.params.orderId!, r.actor, tx, true);
    this.access.version(o, r.headers['if-match']);
    if (
      o.paused ||
      (await tx.caseRecord.findFirst({
        where: {
          orderId: o.id,
          kind: { not: 'SUPPORT' },
          status: { in: ['OPEN', 'ADMIN_REVIEW'] },
        },
      }))
    )
      fail('FUNDS_FROZEN');
    return o;
  }
  rejectOrder(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const o = await this.writable(tx, r);
      if (o.state === 'PAID_IN_ESCROW') {
        this.access.seller(o, r.actor);
        const receipt = await this.finance.refundUncontestedInTransaction(tx, {
          orderId: o.id,
          actorId: r.actor.id,
          mode: 'STORE_DECLINE',
          reason: r.body.reason,
        });
        return this.query.action(o.id, tx, { settlementId: receipt.id });
      }
      if (
        ![
          'AWAITING_AGREEMENT',
          'BOOKING_REQUESTED',
          'SCHEDULE_PROPOSED',
          'PENDING_QUOTE',
          'QUOTE_SENT',
        ].includes(o.state) ||
        o.escrow_order!.heldUnits !== 0n
      )
        fail('INVALID_TRANSITION');
      const seller = r.actor.id === o.sellerProfile.userId,
        buyer = r.actor.id === o.buyerId;
      if (!seller && !buyer) fail('FORBIDDEN', 403);
      if (
        (o.state === 'BOOKING_REQUESTED' && !seller) ||
        (o.state === 'SCHEDULE_PROPOSED' && !buyer) ||
        (o.state === 'PENDING_QUOTE' && !seller) ||
        (o.state === 'QUOTE_SENT' && !buyer)
      )
        fail('FORBIDDEN', 403);
      if (o.serviceOrder_order) {
        await this.scheduling.release(tx, o.serviceOrder_order.id);
        await tx.booking.updateMany({
          where: { serviceOrderId: o.serviceOrder_order.id },
          data: { state: 'REJECTED' },
        });
        await tx.quote.updateMany({
          where: { serviceOrderId: o.serviceOrder_order.id, state: 'SENT' },
          data: { state: 'REJECTED' },
        });
      }
      await this.lifecycle.changed(tx, o, 'REJECTED', r.actor.id, r.body.reason);
      return this.query.action(o.id, tx);
    });
  }
  startWork(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const o = await this.writable(tx, r);
      this.access.seller(o, r.actor);
      if (
        o.state !== 'DEPOSIT_HELD' ||
        !o.serviceOrder_order ||
        !(await tx.paymentAttempt.findFirst({
          where: { orderId: o.id, installment: 'DEPOSIT', status: 'SUCCEEDED' },
        }))
      )
        fail('DEPOSIT_REQUIRED');
      await tx.marketOrder.update({
        where: { id: o.id },
        data: { workStartedAt: await this.lifecycle.deadlines.now(tx) },
      });
      await this.lifecycle.changed(
        tx,
        o,
        'IN_PROGRESS',
        r.actor.id,
        'Provider started agreed work after deposit',
      );
      return this.query.action(o.id, tx);
    });
  }
  recordProgress(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const o = await this.writable(tx, r);
      this.access.seller(o, r.actor);
      const s = requireValue(o.serviceOrder_order),
        b = r.body;
      if (!['IN_PROGRESS', 'EN_ROUTE', 'ON_SITE', 'REVISION_IN_PROGRESS'].includes(o.state))
        fail('INVALID_TRANSITION');
      let state = o.state;
      if (b.kind === 'EN_ROUTE') {
        if (o.workspace !== 'PROFESSIONALS' || o.state !== 'IN_PROGRESS')
          fail('INVALID_TRANSITION');
        state = 'EN_ROUTE';
      }
      if (b.kind === 'ON_SITE') {
        if (o.workspace !== 'PROFESSIONALS' || !['IN_PROGRESS', 'EN_ROUTE'].includes(o.state))
          fail('INVALID_TRANSITION');
        state = 'ON_SITE';
      }
      if (b.milestoneId) {
        const m = requireValue(
          await tx.milestone.findFirst({ where: { id: b.milestoneId, serviceOrderId: s.id } }),
        );
        if (b.progress === undefined) fail('INVALID_INPUT', 400);
        await tx.milestone.update({ where: { id: m.id }, data: { progress: b.progress } });
      }
      await this.lifecycle.changed(tx, o, state, r.actor.id, b.note);
      return this.query.action(o.id, tx);
    });
  }
  markReady(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const o = await this.writable(tx, r);
      this.access.seller(o, r.actor);
      const s = requireValue(o.serviceOrder_order),
        b = r.body;
      if (!['IN_PROGRESS', 'ON_SITE', 'REVISION_IN_PROGRESS'].includes(o.state))
        fail('INVALID_TRANSITION');
      if (!b.completedScope.length) fail('INVALID_INPUT', 400);
      await this.access.cleanFiles(b.previewFileIds, r.actor, 'ORDER_SHARED', tx, o.id);
      const now = await this.lifecycle.deadlines.now(tx);
      if (
        await tx.paymentAttempt.findFirst({
          where: { orderId: o.id, installment: 'BALANCE', status: 'SUCCEEDED' },
        })
      ) {
        await this.lifecycle.changed(
          tx,
          o,
          'FULLY_FUNDED',
          r.actor.id,
          'Revised work ready; existing balance retained',
        );
      } else {
        const deadline = new Date(now.getTime() + 72 * 3600000);
        await tx.serviceOrder.update({
          where: { id: s.id },
          data: {
            readyAt: now,
            readinessEvidence: jsonValue(b),
            balanceDeadlineAt: deadline,
            balanceResumedAt: null,
            balanceResumptionCaseId: null,
          },
        });
        const next = await this.lifecycle.changed(
          tx,
          o,
          'READY_FOR_FINAL_PAYMENT',
          r.actor.id,
          b.note,
        );
        await this.lifecycle.deadlines.schedule(
          tx,
          o.id,
          'BALANCE_REMINDER_24',
          new Date(now.getTime() + 24 * 3600000),
          next.version,
        );
        await this.lifecycle.deadlines.schedule(
          tx,
          o.id,
          'BALANCE_REMINDER_48',
          new Date(now.getTime() + 48 * 3600000),
          next.version,
        );
        await this.lifecycle.deadlines.schedule(tx, o.id, 'BALANCE_EXPIRY', deadline, next.version);
      }
      return this.query.action(o.id, tx);
    });
  }
  deliverService(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const o = await this.writable(tx, r);
      this.access.seller(o, r.actor);
      const s = requireValue(o.serviceOrder_order),
        b = r.body;
      if (
        !['FULLY_FUNDED', 'REVISION_IN_PROGRESS'].includes(o.state) ||
        !(await tx.paymentAttempt.findFirst({
          where: { orderId: o.id, installment: 'BALANCE', status: 'SUCCEEDED' },
        }))
      )
        fail('HOLD_REQUIRED');
      const digital = o.workspace === 'FREELANCE';
      if ((digital && b.kind !== 'DIGITAL_FINAL') || (!digital && b.kind !== 'ONSITE_HANDOVER'))
        fail('INVALID_INPUT', 400);
      const ids: string[] = digital ? (b.fileIds ?? []) : b.proofFileId ? [b.proofFileId] : [];
      if (digital && !ids.length) fail('DELIVERY_PROOF_REQUIRED');
      await this.access.cleanFiles(
        ids,
        r.actor,
        digital ? 'FINAL_DELIVERABLE' : 'ORDER_SHARED',
        tx,
        o.id,
      );
      const latest = await tx.submission.findFirst({
        where: { serviceOrderId: s.id, kind: b.kind },
        orderBy: { version: 'desc' },
      });
      let version = latest?.version ?? 0;
      for (const fileId of ids)
        await tx.submission.create({
          data: {
            serviceOrderId: s.id,
            kind: b.kind,
            fileId,
            actorId: r.actor.id,
            version: ++version,
            evidence: { note: b.note },
          },
        });
      if (!ids.length)
        await tx.submission.create({
          data: {
            serviceOrderId: s.id,
            kind: b.kind,
            actorId: r.actor.id,
            version: version + 1,
            evidence: { note: b.note },
          },
        });
      const now = await this.lifecycle.deadlines.now(tx),
        deadline = new Date(now.getTime() + 72 * 3600000);
      await tx.marketOrder.update({
        where: { id: o.id },
        data: {
          deliveredAt: now,
          reviewDeadlineAt: deadline,
          deliveryVersion: { increment: 1 },
          deliveryVerified: ids.length > 0,
        },
      });
      const next = await this.lifecycle.changed(tx, o, 'DELIVERED', r.actor.id, b.note);
      await this.lifecycle.deadlines.schedule(
        tx,
        o.id,
        'DELIVERY_REVIEW',
        deadline,
        next.deliveryVersion,
      );
      return this.query.action(o.id, tx);
    });
  }
  createMilestone(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const o = await this.writable(tx, r);
      this.access.seller(o, r.actor);
      const s = requireValue(o.serviceOrder_order);
      if (
        ![
          'AWAITING_AGREEMENT',
          'AWAITING_DEPOSIT',
          'DEPOSIT_HELD',
          'IN_PROGRESS',
          'REVISION_IN_PROGRESS',
        ].includes(o.state)
      )
        fail('INVALID_TRANSITION');
      if ((await tx.milestone.count({ where: { serviceOrderId: s.id } })) >= 100)
        fail('INVALID_INPUT', 400);
      const m = await tx.milestone.create({
        data: { serviceOrderId: s.id, description: r.body.description, position: r.body.position },
      });
      await this.lifecycle.changed(
        tx,
        o,
        o.state,
        r.actor.id,
        'Non-billing progress milestone created',
      );
      return m;
    });
  }
  async getAllowedOrderActions(r: ApiRequest) {
    const o = await this.access.order(r.params.orderId!, r.actor),
      s = o.serviceOrder_order,
      now = new Date(),
      buyer = o.buyerId === r.actor.id,
      seller = o.sellerProfile.userId === r.actor.id,
      blocked =
        o.paused ||
        r.actor.restrictions.includes('SUSPENSION') ||
        (seller && o.sellerProfile.status !== 'ACTIVE');
    const items: {
      operationId: string;
      enabled: boolean;
      reasonCode: string | null;
      deadlineAt: Date | null;
    }[] = [];
    const add = (
      operationId: string,
      enabled: boolean,
      deadlineAt: Date | null = null,
      reasonCode = 'INVALID_TRANSITION',
    ) =>
      items.push({
        operationId,
        enabled: enabled && !blocked,
        reasonCode: blocked ? 'FUNDS_FROZEN' : enabled ? null : reasonCode,
        deadlineAt,
      });
    if (buyer) {
      add(
        'checkoutStore',
        o.workspace === 'HOME_STORE' &&
          o.state === 'DRAFT' &&
          !!o.checkoutExpiresAt &&
          o.checkoutExpiresAt > now &&
          !r.actor.restrictions.includes('PURCHASING'),
        o.checkoutExpiresAt,
      );
      add(
        'holdDeposit',
        o.state === 'AWAITING_DEPOSIT' && !!s?.depositDeadlineAt && s.depositDeadlineAt > now,
        s?.depositDeadlineAt ?? null,
      );
      add(
        'holdBalance',
        o.state === 'READY_FOR_FINAL_PAYMENT' &&
          !!s?.balanceDeadlineAt &&
          s.balanceDeadlineAt > now,
        s?.balanceDeadlineAt ?? null,
      );
      add(
        'confirmReceipt',
        o.state === 'DELIVERED' && o.escrow_order?.heldUnits === o.agreedTotalUnits,
        o.reviewDeadlineAt,
      );
      add('acceptSchedule', o.state === 'SCHEDULE_PROPOSED', s?.responseDeadlineAt ?? null);
    }
    if (seller) {
      add(
        'acceptStoreOrder',
        o.state === 'PAID_IN_ESCROW' &&
          !!o.storeOrder_order?.sellerAcceptanceDeadlineAt &&
          o.storeOrder_order.sellerAcceptanceDeadlineAt > now,
        o.storeOrder_order?.sellerAcceptanceDeadlineAt ?? null,
      );
      add('markStoreReady', o.state === 'PREPARING');
      add(
        'requestPlatformDriver',
        o.state === 'READY_FOR_DELIVERY' &&
          o.storeOrder_order?.delivery_storeOrder?.method === 'PLATFORM_DRIVER' &&
          ['PENDING', 'EXCEPTION'].includes(o.storeOrder_order.delivery_storeOrder.status),
      );
      add(
        'recordProgress',
        ['IN_PROGRESS', 'EN_ROUTE', 'ON_SITE', 'REVISION_IN_PROGRESS'].includes(o.state),
      );
      add(
        'proposeSchedule',
        ['BOOKING_REQUESTED', 'SCHEDULE_PROPOSED'].includes(o.state),
        s?.responseDeadlineAt ?? null,
      );
      add(
        'sendQuote',
        ['PENDING_QUOTE', 'QUOTE_SENT'].includes(o.state),
        s?.responseDeadlineAt ?? null,
      );
      add(
        'createMilestone',
        !!s &&
          [
            'AWAITING_AGREEMENT',
            'AWAITING_DEPOSIT',
            'DEPOSIT_HELD',
            'IN_PROGRESS',
            'REVISION_IN_PROGRESS',
          ].includes(o.state),
      );
      add('startWork', o.state === 'DEPOSIT_HELD');
      add('markReady', ['IN_PROGRESS', 'ON_SITE', 'REVISION_IN_PROGRESS'].includes(o.state));
      add(
        'deliverService',
        ['FULLY_FUNDED', 'REVISION_IN_PROGRESS'].includes(o.state) &&
          o.escrow_order?.heldUnits === o.agreedTotalUnits,
      );
      add('acceptBooking', o.state === 'BOOKING_REQUESTED', s?.responseDeadlineAt ?? null);
    }
    if (buyer || seller) {
      add(
        'cancelOrder',
        !['COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED', 'REFUNDED'].includes(o.state),
      );
      add(
        'requestExtension',
        !!s?.dueAt &&
          s.dueAt <= now &&
          ['DEPOSIT_HELD', 'IN_PROGRESS', 'EN_ROUTE', 'ON_SITE', 'EXTENSION_PENDING'].includes(
            o.state,
          ),
        s?.dueAt ?? null,
      );
      add('acceptExtension', o.state === 'EXTENSION_PENDING');
      add(
        'agreeOrder',
        o.workspace === 'FREELANCE' && o.state === 'AWAITING_AGREEMENT',
        s?.responseDeadlineAt ?? null,
      );
      add(
        'openCase',
        (o.escrow_order?.heldUnits ?? 0n) > 0n &&
          !(await this.db.settlement.findUnique({ where: { orderId: o.id } })),
      );
    }
    return { items, nextCursor: null };
  }
}
