import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiRequest } from '../../common/actor';
import { AccessService } from '../../common/access.service';
import { CommandsService, jsonValue } from '../../common/commands.service';
import { fail, requireValue } from '../../common/errors';
import { page, pageArgs } from '../../common/pagination';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { GeographyService } from '../geography/geography.service';
import { OrderLifecycle } from '../orders/order-lifecycle.service';
import { OrdersQueryService } from '../orders/orders-query.service';
import { SchedulingService } from '../scheduling/scheduling.service';
import { serviceSplit } from '../payments/domain/money';
import { beforeDeadline } from '../orders/domain/order-state-machine';
const quoteInclude = {
  quoteItem_quote: true,
  serviceOrder: { select: { orderId: true, order: { select: { version: true } } } },
} satisfies Prisma.QuoteInclude;
function quoteDto(q: Prisma.QuoteGetPayload<{ include: typeof quoteInclude }>) {
  const split = serviceSplit(q.totalUnits);
  return {
    ...q,
    orderId: q.serviceOrder.orderId,
    orderVersion: q.serviceOrder.order.version,
    totalUnits: q.totalUnits,
    depositUnits: split.deposit,
    balanceUnits: split.balance,
    items: q.quoteItem_quote,
  };
}
@Injectable()
export class QuotesService {
  constructor(
    private readonly db: PrismaService,
    private readonly commands: CommandsService,
    private readonly access: AccessService,
    private readonly geography: GeographyService,
    private readonly lifecycle: OrderLifecycle,
    private readonly orders: OrdersQueryService,
    private readonly scheduling: SchedulingService,
  ) {}
  async requestInspectionQuote(r: ApiRequest) {
    const provider = requireValue(
      await this.db.businessProfile.findFirst({
        where: { id: r.body.providerProfileId, type: 'PROFESSIONAL', status: 'ACTIVE' },
        include: { user: true },
      }),
    );
    return this.commands.run(
      r,
      async (tx) => {
        const p = requireValue(
            await tx.businessProfile.findFirst({
              where: { id: provider.id, type: 'PROFESSIONAL', status: 'ACTIVE' },
            }),
          ),
          address = await this.geography.ownedAddress(r.body.addressId, r.actor.id, tx);
        await this.geography.serviceable(p.id, address.cityId, address.areaId, tx);
        await this.access.cleanFiles(r.body.photoIds, r.actor, 'ORDER_SHARED', tx);
        for (const id of r.body.photoIds) {
          const f = await tx.fileAsset.findUniqueOrThrow({ where: { id } });
          if (f.orderId || !f.mimeType.startsWith('image/')) fail('INVALID_INPUT', 400);
        }
        const result = await this.lifecycle.initialize(tx, r.actor, {
          sellerProfileId: p.id,
          sellerUserId: p.userId,
          workspace: 'PROFESSIONALS',
          state: 'PENDING_QUOTE',
          currency: r.body.currency,
          total: null,
          scope: r.body.description,
          kind: 'INSPECTION_QUOTE',
          addressSnapshot: jsonValue(address) as any,
        });
        const inspection = await tx.inspectionRequest.create({
          data: {
            serviceOrderId: result.service.id,
            addressId: address.id,
            description: r.body.description,
          },
        });
        for (const fileId of r.body.photoIds) {
          await tx.fileAsset.update({ where: { id: fileId }, data: { orderId: result.order.id } });
          await tx.inspectionPhoto.create({ data: { inspectionId: inspection.id, fileId } });
        }
        return this.orders.read(result.order.id, tx);
      },
      [provider.userId],
    );
  }
  async listOrderQuotes(r: ApiRequest) {
    const o = await this.access.order(r.params.orderId!, r.actor);
    return page(
      (
        await this.db.quote.findMany({
          where: {
            serviceOrderId: o.serviceOrder_order?.id ?? '00000000-0000-0000-0000-000000000000',
            state: { not: 'DRAFT' },
          },
          include: quoteInclude,
          ...pageArgs(r.query, r.actor.id, [{ version: 'desc' }, { id: 'desc' }]),
        })
      ).map(quoteDto),
      r.query,
      r.actor.id,
    );
  }
  sendQuote(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const o = await this.access.order(r.params.orderId!, r.actor, tx, true);
      this.access.version(o, r.headers['if-match']);
      this.access.seller(o, r.actor);
      const s = requireValue(o.serviceOrder_order),
        now = await this.lifecycle.deadlines.now(tx);
      if (s.kind !== 'INSPECTION_QUOTE' || !['PENDING_QUOTE', 'QUOTE_SENT'].includes(o.state))
        fail('INVALID_TRANSITION');
      beforeDeadline(now, s.responseDeadlineAt);
      const b = r.body;
      if (b.currency !== o.currency) fail('MIXED_CURRENCY', 400);
      const starts = new Date(b.startsAt),
        ends = new Date(b.endsAt),
        due = new Date(b.dueAt);
      this.scheduling.validate(starts, ends, now);
      if (due < ends) fail('INVALID_INPUT', 400);
      if (b.items.some((i: any) => BigInt(i.unitPriceUnits) <= 0n)) fail('INVALID_INPUT', 400);
      const total = b.items.reduce(
        (n: bigint, item: any) => n + BigInt(item.quantity) * BigInt(item.unitPriceUnits),
        0n,
      );
      serviceSplit(total);
      const previous = await tx.quote.findFirst({
          where: { serviceOrderId: s.id },
          orderBy: { version: 'desc' },
        }),
        deadline = new Date(now.getTime() + 72 * 3600000);
      await tx.quote.updateMany({
        where: { serviceOrderId: s.id, state: 'SENT' },
        data: { state: 'EXPIRED' },
      });
      const q = await tx.quote.create({
        data: {
          serviceOrderId: s.id,
          version: (previous?.version ?? 0) + 1,
          state: 'DRAFT',
          currency: o.currency,
          totalUnits: total,
          scope: b.scope,
          startsAt: starts,
          endsAt: ends,
          dueAt: due,
          quoteItem_quote: {
            create: b.items.map((i: any) => ({
              description: i.description,
              quantity: i.quantity,
              unitPriceUnits: BigInt(i.unitPriceUnits),
            })),
          },
        },
      });
      await tx.quote.update({
        where: { id: q.id },
        data: { state: 'SENT', sentAt: now, responseDeadlineAt: deadline },
      });
      await tx.serviceOrder.update({ where: { id: s.id }, data: { responseDeadlineAt: deadline } });
      const next = await this.lifecycle.changed(
        tx,
        o,
        'QUOTE_SENT',
        r.actor.id,
        'Itemized quote offered',
      );
      await this.lifecycle.deadlines.schedule(tx, o.id, 'RESPONSE_EXPIRY', deadline, next.version);
      return quoteDto(
        await tx.quote.findUniqueOrThrow({ where: { id: q.id }, include: quoteInclude }),
      );
    });
  }
  approveQuote(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const q = requireValue(
          await tx.quote.findUnique({ where: { id: r.params.quoteId }, include: quoteInclude }),
        ),
        o = await this.access.order(q.serviceOrder.orderId, r.actor, tx, true);
      this.access.version(o, r.headers['if-match']);
      this.access.buyer(o, r.actor);
      const s = requireValue(o.serviceOrder_order),
        now = await this.lifecycle.deadlines.now(tx);
      if (q.state !== 'SENT' || o.state !== 'QUOTE_SENT') fail('INVALID_TRANSITION');
      beforeDeadline(now, q.responseDeadlineAt);
      this.scheduling.validate(q.startsAt, q.endsAt, now);
      await this.scheduling.reserve(tx, s.id, o.sellerProfileId, q.startsAt, q.endsAt);
      const split = serviceSplit(q.totalUnits);
      await tx.quote.update({ where: { id: q.id }, data: { state: 'APPROVED', approvedAt: now } });
      await tx.marketOrder.update({
        where: { id: o.id },
        data: {
          agreedTotalUnits: q.totalUnits,
          eligibleSellerUnits: q.totalUnits,
          agreementSnapshot: {
            scope: q.scope,
            quoteId: q.id,
            quoteVersion: q.version,
            startsAt: q.startsAt.toISOString(),
            endsAt: q.endsAt.toISOString(),
          },
        },
      });
      await tx.serviceOrder.update({
        where: { id: s.id },
        data: {
          approvedQuoteId: q.id,
          depositUnits: split.deposit,
          balanceUnits: split.balance,
          dueAt: q.dueAt,
        },
      });
      const approved = await this.lifecycle.changed(
        tx,
        o,
        'APPROVED',
        r.actor.id,
        'Exact quote version approved',
      );
      await this.lifecycle.awaitDeposit(tx, approved, s.id, r.actor.id);
      return this.orders.action(o.id, tx);
    });
  }
  rejectQuote(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const q = requireValue(
          await tx.quote.findUnique({ where: { id: r.params.quoteId }, include: quoteInclude }),
        ),
        o = await this.access.order(q.serviceOrder.orderId, r.actor, tx, true);
      this.access.version(o, r.headers['if-match']);
      this.access.buyer(o, r.actor);
      if (q.state !== 'SENT' || o.state !== 'QUOTE_SENT') fail('INVALID_TRANSITION');
      await tx.quote.update({ where: { id: q.id }, data: { state: 'REJECTED' } });
      await this.scheduling.release(tx, q.serviceOrderId);
      await this.lifecycle.changed(tx, o, 'REJECTED', r.actor.id, r.body.reason);
      return this.orders.action(o.id, tx);
    });
  }
  agreeInspectionSchedule(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const o = await this.access.order(r.params.orderId!, r.actor, tx, true);
      this.access.version(o, r.headers['if-match']);
      if (![o.buyerId, o.sellerProfile.userId].includes(r.actor.id) || o.state !== 'PENDING_QUOTE')
        fail('INVALID_TRANSITION');
      const s = requireValue(o.serviceOrder_order),
        inspection = requireValue(s.inspectionRequest_serviceOrder),
        now = await this.lifecycle.deadlines.now(tx),
        b = r.body,
        starts = new Date(b.startsAt),
        ends = new Date(b.endsAt),
        deadline = new Date(b.responseDeadlineAt);
      beforeDeadline(now, s.responseDeadlineAt);
      this.scheduling.validate(starts, ends, now);
      if (deadline <= ends || deadline <= now) fail('INVALID_INPUT', 400);
      const snap = o.agreementSnapshot as Record<string, any>,
        old = snap.inspectionProposal,
        same =
          old?.startsAt === starts.toISOString() &&
          old?.endsAt === ends.toISOString() &&
          old?.responseDeadlineAt === deadline.toISOString(),
        proposal = {
          startsAt: starts.toISOString(),
          endsAt: ends.toISOString(),
          responseDeadlineAt: deadline.toISOString(),
          approvedBy: [...new Set<string>([...(same ? old.approvedBy : []), r.actor.id])],
        };
      await tx.marketOrder.update({
        where: { id: o.id },
        data: { agreementSnapshot: { ...snap, inspectionProposal: proposal } },
      });
      if (
        proposal.approvedBy.includes(o.buyerId) &&
        proposal.approvedBy.includes(o.sellerProfile.userId)
      ) {
        await this.scheduling.reserve(tx, s.id, o.sellerProfileId, starts, ends);
        await tx.inspectionRequest.update({
          where: { id: inspection.id },
          data: { startsAt: starts, agreedAt: now },
        });
        await tx.serviceOrder.update({
          where: { id: s.id },
          data: { responseDeadlineAt: deadline },
        });
        await this.lifecycle.deadlines.schedule(
          tx,
          o.id,
          'RESPONSE_EXPIRY',
          deadline,
          o.version + 1,
        );
      }
      await this.lifecycle.changed(
        tx,
        o,
        o.state,
        r.actor.id,
        'Free inspection schedule proposal or agreement',
      );
      return this.orders.read(o.id, tx);
    });
  }
}
