import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Actor, ApiRequest } from '../../common/actor';
import { AccessService } from '../../common/access.service';
import { requireValue } from '../../common/errors';
import { page, pageArgs } from '../../common/pagination';
import { PrismaService, UnitOfWork } from '../../infrastructure/database/prisma.service';
import { fileDto } from '../users/users.service';
export const queryOrderInclude = {
  escrow_order: true,
  serviceOrder_order: {
    include: {
      booking_serviceOrder: true,
      milestone_serviceOrder: { orderBy: { position: 'asc' as const } },
    },
  },
  storeOrder_order: {
    include: {
      delivery_storeOrder: true,
      orderItem_storeOrder: { include: { stockReservation_orderItem: true } },
    },
  },
} satisfies Prisma.MarketOrderInclude;
type OrderRow = Prisma.MarketOrderGetPayload<{ include: typeof queryOrderInclude }>;
export function money(currency: string, units: bigint | null) {
  return units === null ? null : { currency, units: units.toString() };
}
export function paymentDto(p: { id: string; currency: string; units: bigint; [key: string]: any }) {
  return { ...p, amount: money(p.currency, p.units), simulated: true };
}
export function settlementDto(s: any) {
  return { ...s, allocations: s.allocation_settlement, settledAt: s.createdAt, simulated: true };
}
@Injectable()
export class OrdersQueryService {
  constructor(
    private readonly db: PrismaService,
    private readonly access: AccessService,
  ) {}
  dto(o: OrderRow) {
    const s = o.serviceOrder_order,
      store = o.storeOrder_order,
      a = o.agreementSnapshot as Record<string, any>,
      d = store?.delivery_storeOrder,
      deadlines: { kind: string; at: Date }[] = [];
    if (
      s?.responseDeadlineAt &&
      [
        'AWAITING_AGREEMENT',
        'BOOKING_REQUESTED',
        'SCHEDULE_PROPOSED',
        'PENDING_QUOTE',
        'QUOTE_SENT',
      ].includes(o.state)
    )
      deadlines.push({ kind: 'RESPONSE', at: s.responseDeadlineAt });
    if (s?.depositDeadlineAt && o.state === 'AWAITING_DEPOSIT')
      deadlines.push({ kind: 'DEPOSIT', at: s.depositDeadlineAt });
    if (s?.balanceDeadlineAt && o.state === 'READY_FOR_FINAL_PAYMENT')
      deadlines.push({ kind: 'BALANCE', at: s.balanceDeadlineAt });
    if (store?.sellerAcceptanceDeadlineAt && o.state === 'PAID_IN_ESCROW')
      deadlines.push({ kind: 'SELLER_ACCEPTANCE', at: store.sellerAcceptanceDeadlineAt });
    if (o.reviewDeadlineAt && o.state === 'DELIVERED')
      deadlines.push({ kind: 'REVIEW', at: o.reviewDeadlineAt });
    const terms = d?.termsSnapshot as Record<string, any> | undefined;
    return {
      ...o,
      addressSnapshot: undefined,
      total: money(o.currency, o.agreedTotalUnits),
      sellerAmount: money(o.currency, o.eligibleSellerUnits),
      deliveryFee: money(o.currency, o.deliveryFeeUnits),
      deposit: money(o.currency, s?.depositUnits ?? null),
      balance: money(o.currency, s?.balanceUnits ?? null),
      held: money(o.currency, o.escrow_order?.heldUnits ?? 0n),
      terms: {
        scope: o.state === 'AWAITING_AGREEMENT' ? (a.proposal?.scope ?? a.scope) : a.scope,
        dueAt:
          o.state === 'AWAITING_AGREEMENT'
            ? (a.proposal?.dueAt ?? s?.dueAt ?? null)
            : (s?.dueAt ?? terms?.promisedAt ?? null),
        startsAt:
          s?.booking_serviceOrder?.proposedStartsAt ??
          s?.booking_serviceOrder?.requestedStartsAt ??
          null,
        endsAt:
          s?.booking_serviceOrder?.proposedEndsAt ??
          s?.booking_serviceOrder?.requestedEndsAt ??
          null,
        deliveryMethod: d?.method ?? null,
        promisedDeliveryAt: terms?.promisedAt ?? null,
      },
      deadlines,
      simulated: true,
      service: s
        ? {
            kind: s.kind,
            listingId: s.listingId,
            approvedQuoteId: s.approvedQuoteId,
            booking: s.booking_serviceOrder,
            milestones: s.milestone_serviceOrder,
            dueAt: s.dueAt,
            readyAt: s.readyAt,
          }
        : null,
      store: store
        ? {
            storeId: store.storefrontId,
            deliveryId: d!.id,
            sellerAcceptedAt: store.acceptedAt,
            items: store.orderItem_storeOrder.map((i) => ({
              productId: i.productId,
              ...(i.productSnapshot as object),
              quantity: i.quantity,
              currency: i.currency,
              unitPriceUnits: i.unitPriceUnits,
              subtotalUnits: i.unitPriceUnits * BigInt(i.quantity),
              reservationId: i.stockReservation_orderItem?.id ?? null,
            })),
          }
        : null,
    };
  }
  async read(id: string, tx: UnitOfWork = this.db) {
    return this.dto(
      requireValue(await tx.marketOrder.findUnique({ where: { id }, include: queryOrderInclude })),
    );
  }
  async action(
    id: string,
    tx: UnitOfWork = this.db,
    ids: { paymentId?: string; settlementId?: string; caseId?: string } = {},
  ) {
    const payment = ids.paymentId
        ? await tx.paymentAttempt.findUnique({ where: { id: ids.paymentId } })
        : null,
      settlement = ids.settlementId
        ? await tx.settlement.findUnique({
            where: { id: ids.settlementId },
            include: { allocation_settlement: true },
          })
        : null;
    return {
      order: await this.read(id, tx),
      payment: payment ? paymentDto(payment) : null,
      settlement: settlement ? settlementDto(settlement) : null,
      caseId: ids.caseId ?? null,
    };
  }
  async getOrder(r: ApiRequest) {
    const order = await this.access.order(r.params.orderId!, r.actor);
    return {
      ...(await this.read(order.id)),
      destination:
        order.state !== 'DRAFT' || order.buyerId === r.actor.id
          ? (order.addressSnapshot ?? undefined)
          : undefined,
    };
  }
  async listOrders(r: ApiRequest) {
    const q = r.query,
      where: Prisma.MarketOrderWhereInput = {
        ...(q.participation === 'BUYER'
          ? { buyerId: r.actor.id }
          : q.participation === 'PROVIDER'
            ? { sellerProfile: { userId: r.actor.id } }
            : { OR: [{ buyerId: r.actor.id }, { sellerProfile: { userId: r.actor.id } }] }),
        ...(q.workspace ? { workspace: q.workspace as any } : {}),
        ...(q.state ? { state: q.state as any } : {}),
      };
    return page(
      (
        await this.db.marketOrder.findMany({
          where,
          include: queryOrderInclude,
          ...pageArgs(q, r.actor.id, [
            { createdAt: q.sort === 'createdAt:asc' ? 'asc' : 'desc' },
            { id: q.sort === 'createdAt:asc' ? 'asc' : 'desc' },
          ]),
        })
      ).map((o) => this.dto(o)),
      q,
      r.actor.id,
    );
  }
  async getOrderTimeline(r: ApiRequest) {
    await this.access.order(r.params.orderId!, r.actor);
    return page(
      (
        await this.db.orderTransition.findMany({
          where: { orderId: r.params.orderId },
          ...pageArgs(r.query, r.actor.id),
        })
      ).map((t) => ({ ...t, occurredAt: t.createdAt })),
      r.query,
      r.actor.id,
    );
  }
  async listMilestones(r: ApiRequest) {
    const o = await this.access.order(r.params.orderId!, r.actor);
    return page(
      await this.db.milestone.findMany({
        where: {
          serviceOrderId: o.serviceOrder_order?.id ?? '00000000-0000-0000-0000-000000000000',
        },
        ...pageArgs(r.query, r.actor.id, [{ position: 'asc' }, { id: 'asc' }]),
      }),
      r.query,
      r.actor.id,
    );
  }
  async listSubmissions(r: ApiRequest) {
    const o = await this.access.order(r.params.orderId!, r.actor);
    const full = await this.db.paymentAttempt.findFirst({
      where: { orderId: o.id, installment: 'BALANCE', status: 'SUCCEEDED' },
    });
    return page(
      (
        await this.db.fileAsset.findMany({
          where: {
            orderId: o.id,
            deletedAt: null,
            submission_file: { some: {} },
            ...(r.actor.id === o.buyerId && !full
              ? { accessClass: { not: 'FINAL_DELIVERABLE' } }
              : {}),
          },
          ...pageArgs(r.query, r.actor.id),
        })
      ).map(fileDto),
      r.query,
      r.actor.id,
    );
  }
}
