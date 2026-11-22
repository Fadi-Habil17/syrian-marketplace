import { createHash, randomUUID } from 'node:crypto';
import {
  Prisma,
  PrismaClient,
  type Installment,
  type OrderState,
  type SettlementMode,
} from '@prisma/client';
import { LocalSimulatedGateway } from '../infrastructure/local-simulated-gateway';
import { settlementAmounts } from '../domain/money';

type Tx = Prisma.TransactionClient;
type Receipt = {
  id: string;
  status: string;
  reference?: string;
  units?: string;
  currency?: string;
  simulated: true;
  errorCode?: string;
};
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function reject(code: string): never {
  throw new Error(code);
}

/** Backend application commands, not HTTP controllers. actorId is supplied by
 * authenticated server context, never a buyer-controlled DTO. All money is read
 * from the agreed order. Remaining workflow commands are separate slices. */
export class MarketplaceFinance {
  private readonly gateway = new LocalSimulatedGateway();
  constructor(private readonly db: PrismaClient) {}
  private async atomic<T>(work: (tx: Tx) => Promise<T>): Promise<T> {
    for (let n = 0; ; n++) {
      try {
        return await this.db.$transaction(work, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 15000,
        });
      } catch (e) {
        // Raw SELECT ... FOR UPDATE reports PostgreSQL serialization/deadlock
        // SQLSTATE through P2010, while Prisma model writes can use P2034.
        // Both require retrying the entire rolled-back transaction.
        const retryable =
          e instanceof Prisma.PrismaClientKnownRequestError &&
          (['P2034', 'P2002'].includes(e.code) ||
            (e.code === 'P2010' && ['40001', '40P01'].includes(String(e.meta?.code))));
        if (n >= 2 || !retryable) throw e;
      }
    }
  }
  private async lock(tx: Tx, id: string) {
    const first = await tx.marketOrder.findUniqueOrThrow({
      where: { id },
      include: { sellerProfile: true },
    });
    for (const uid of [...new Set([first.buyerId, first.sellerProfile.userId])].sort())
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id"=${uid}::uuid FOR UPDATE`;
    await tx.$queryRaw`SELECT "id" FROM "MarketOrder" WHERE "id"=${id}::uuid FOR UPDATE`;
    return tx.marketOrder.findUniqueOrThrow({
      where: { id },
      include: {
        sellerProfile: true,
        escrow_order: true,
        serviceOrder_order: { include: { booking_serviceOrder: true, approvedQuote: true } },
        storeOrder_order: {
          include: {
            orderItem_storeOrder: true,
            delivery_storeOrder: {
              include: {
                driverAssignment_delivery: { include: { driver: true } },
                deliveryEvent_delivery: { include: { proof: true } },
              },
            },
          },
        },
      },
    });
  }
  private async now(tx: Tx) {
    return (await tx.$queryRaw<{ now: Date }[]>`SELECT transaction_timestamp() AS now`)[0]!.now;
  }
  private async admin(tx: Tx, id: string) {
    if (
      !(await tx.userRole.findFirst({
        where: { userId: id, revokedAt: null, role: { code: 'ADMIN' }, user: { archivedAt: null } },
      }))
    )
      reject('FORBIDDEN');
    if (
      await tx.restriction.findFirst({
        where: {
          userId: id,
          kind: 'SUSPENSION',
          revokedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: await this.now(tx) } }],
        },
      })
    )
      reject('ACCOUNT_RESTRICTED');
  }
  private async event(
    tx: Tx,
    o: { id: string; version: number },
    actorId: string | null,
    key: string,
    type: string,
    payload: Prisma.InputJsonObject,
  ) {
    await tx.auditRecord.create({
      data: { actorId, aggregateId: o.id, requestId: key, action: type, metadata: payload },
    });
    await tx.outboxEvent.create({
      data: {
        aggregateId: o.id,
        aggregateVersion: o.version,
        type,
        payload,
        deduplicationKey: key,
      },
    });
  }
  private async transition(
    tx: Tx,
    o: { id: string; state: OrderState; version: number },
    state: OrderState,
    actorId: string | null,
    key: string,
  ) {
    const next = await tx.marketOrder.update({
      where: { id: o.id },
      data: { state, version: { increment: 1 } },
    });
    await tx.orderTransition.create({
      data: {
        orderId: o.id,
        actorId,
        fromState: o.state,
        toState: state,
        version: next.version,
        reason: key,
        operationKey: key,
      },
    });
    return next;
  }
  private async cached(
    tx: Tx,
    actorId: string,
    route: string,
    key: string,
    requestHash: string,
  ): Promise<Receipt | null> {
    if (!key || key.length > 128) reject('INVALID_IDEMPOTENCY_KEY');
    const old = await tx.idempotencyRecord.findUnique({
      where: { actorId_route_key: { actorId, route, key } },
    });
    if (!old) return null;
    if (old.requestHash !== requestHash) reject('IDEMPOTENCY_CONFLICT');
    return old.response as unknown as Receipt;
  }
  private async remember(
    tx: Tx,
    actorId: string,
    route: string,
    key: string,
    requestHash: string,
    response: Receipt,
  ) {
    await tx.idempotencyRecord.create({
      data: {
        actorId,
        route,
        key,
        requestHash,
        response,
        httpStatus: response.status === 'FAILED' ? 422 : 200,
        expiresAt: new Date((await this.now(tx)).getTime() + 7 * 86400000),
      },
    });
    return response;
  }
  async hold(i: {
    orderId: string;
    actorId: string;
    installment: Exclude<Installment, 'DELIVERY_ADJUSTMENT'>;
    expectedVersion: number;
    idempotencyKey: string;
    termsAccepted: true;
    simulateFailure?: boolean;
  }): Promise<Receipt> {
    if (i.simulateFailure && process.env.NODE_ENV === 'production') reject('FORBIDDEN');
    return this.atomic(async (tx) => {
      const o = await this.lock(tx, i.orderId);
      if (o.buyerId !== i.actorId) reject('FORBIDDEN');
      const route = `orders/${o.id}/payments/${i.installment}`,
        requestHash = hash({ ...i, idempotencyKey: undefined });
      const cached = await this.cached(tx, i.actorId, route, i.idempotencyKey, requestHash);
      if (cached) return cached;
      const old = await tx.paymentAttempt.findFirst({
        where: { orderId: o.id, installment: i.installment, status: 'SUCCEEDED' },
      });
      if (old)
        return this.remember(tx, i.actorId, route, i.idempotencyKey, requestHash, {
          id: old.id,
          status: old.status,
          reference: old.providerReference,
          units: old.units.toString(),
          currency: old.currency,
          simulated: true,
        });
      if (o.version !== i.expectedVersion) reject('VERSION_CONFLICT');
      if (
        i.termsAccepted !== true ||
        !o.agreedTotalUnits ||
        !o.eligibleSellerUnits ||
        !o.escrow_order
      )
        reject('AGREEMENT_REQUIRED');
      const now = await this.now(tx),
        buyer = await tx.user.findUniqueOrThrow({ where: { id: i.actorId } });
      if (!buyer.verifiedAt || buyer.archivedAt || o.sellerProfile.status !== 'ACTIVE')
        reject('ACCOUNT_RESTRICTED');
      if (
        await tx.restriction.findFirst({
          where: {
            userId: { in: [o.buyerId, o.sellerProfile.userId] },
            revokedAt: null,
            kind: { in: ['SUSPENSION', 'PURCHASING'] },
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        })
      )
        reject('ACCOUNT_RESTRICTED');
      if (
        o.paused ||
        o.escrow_order.status !== 'OPEN' ||
        (await tx.caseRecord.findFirst({
          where: {
            orderId: o.id,
            kind: { not: 'SUPPORT' },
            status: { in: ['OPEN', 'ADMIN_REVIEW'] },
          },
        }))
      )
        reject('FUNDS_FROZEN');
      const s = o.serviceOrder_order;
      let units: bigint;
      let state: OrderState;
      if (i.installment === 'FULL') {
        if (
          o.workspace !== 'HOME_STORE' ||
          o.state !== 'DRAFT' ||
          !o.storeOrder_order?.orderItem_storeOrder.length
        )
          reject('INVALID_TRANSITION');
        if (!o.checkoutExpiresAt || o.checkoutExpiresAt <= now) reject('DEADLINE_EXPIRED');
        units = o.agreedTotalUnits;
        state = 'PAID_IN_ESCROW';
      } else {
        if (!s || o.workspace === 'HOME_STORE') reject('INVALID_TRANSITION');
        if (i.installment === 'DEPOSIT') {
          if (
            o.state !== 'AWAITING_DEPOSIT' ||
            !s.depositUnits ||
            !s.depositDeadlineAt ||
            s.depositDeadlineAt <= now
          )
            reject('DEADLINE_EXPIRED');
          if (
            s.kind === 'FIXED_BOOKING' &&
            (s.booking_serviceOrder?.state !== 'CONFIRMED' ||
              !s.booking_serviceOrder.providerAcceptedAt ||
              (s.booking_serviceOrder.proposedStartsAt && !s.booking_serviceOrder.buyerAcceptedAt))
          )
            reject('BOOKING_NOT_CONFIRMED');
          if (s.kind === 'INSPECTION_QUOTE' && s.approvedQuote?.state !== 'APPROVED')
            reject('QUOTE_NOT_APPROVED');
          if (
            s.kind !== 'FREELANCE' &&
            !(await tx.scheduleReservation.findFirst({
              where: { serviceOrderId: s.id, providerId: o.sellerProfileId, status: 'RESERVED' },
            }))
          )
            reject('BOOKING_NOT_CONFIRMED');
          units = s.depositUnits;
          state = 'DEPOSIT_HELD';
        } else {
          if (
            o.state !== 'READY_FOR_FINAL_PAYMENT' ||
            !s.balanceUnits ||
            !s.readyAt ||
            !s.readinessEvidence ||
            !s.balanceDeadlineAt ||
            s.balanceDeadlineAt <= now
          )
            reject('DEADLINE_EXPIRED');
          if (
            !(await tx.paymentAttempt.findFirst({
              where: { orderId: o.id, installment: 'DEPOSIT', status: 'SUCCEEDED' },
            }))
          )
            reject('DEPOSIT_REQUIRED');
          units = s.balanceUnits;
          state = 'FULLY_FUNDED';
        }
      }
      const wallet = await tx.wallet.findUniqueOrThrow({
        where: { userId_currency: { userId: i.actorId, currency: o.currency } },
      });
      // Inventory precedes account locks everywhere; local holds roll back if stock changes.
      if (i.installment === 'FULL')
        for (const item of [...o.storeOrder_order!.orderItem_storeOrder].sort((a, b) =>
          a.productId.localeCompare(b.productId),
        ))
          await tx.$queryRaw`SELECT "id" FROM "Product" WHERE "id"=${item.productId}::uuid FOR UPDATE`;
      const key = `hold:${o.id}:${i.installment}`;
      const result = await this.gateway.hold(
        {
          operationKey: key,
          requestHash: hash({
            orderId: o.id,
            installment: i.installment,
            units: units.toString(),
            currency: o.currency,
          }),
          orderId: o.id,
          actorId: i.actorId,
          currency: o.currency,
          kind:
            i.installment === 'FULL'
              ? 'STORE_HOLD'
              : i.installment === 'DEPOSIT'
                ? 'DEPOSIT_HOLD'
                : 'BALANCE_HOLD',
          simulateFailure: i.simulateFailure,
          postings: [
            { accountId: wallet.accountId, debitUnits: units, creditUnits: 0n },
            { accountId: o.escrow_order.accountId, debitUnits: 0n, creditUnits: units },
          ],
        },
        tx,
      );
      if (result.status === 'succeeded' && i.installment === 'FULL') {
        for (const item of o.storeOrder_order!.orderItem_storeOrder) {
          if (
            (await tx.$executeRaw`UPDATE "Product" SET "stockReserved"="stockReserved"+${item.quantity},"updatedAt"=transaction_timestamp() WHERE "id"=${item.productId}::uuid AND "status"='PUBLISHED' AND "stockOnHand"-"stockReserved">=${item.quantity}`) !==
            1
          )
            reject('STOCK_UNAVAILABLE');
          await tx.stockReservation.create({
            data: { orderItemId: item.id, productId: item.productId, quantity: item.quantity },
          });
        }
        await tx.storeOrder.update({
          where: { id: o.storeOrder_order!.id },
          data: { sellerAcceptanceDeadlineAt: new Date(now.getTime() + 24 * 3600000) },
        });
      }
      const payment = await tx.paymentAttempt.create({
        data: {
          orderId: o.id,
          actorId: i.actorId,
          operationKey: result.status === 'succeeded' ? key : `failed:${randomUUID()}`,
          installment: i.installment,
          currency: o.currency,
          units,
          status: result.status === 'succeeded' ? 'SUCCEEDED' : 'FAILED',
          journalId: result.status === 'succeeded' ? result.journalId : null,
          failureCode: result.status === 'failed' ? result.code : null,
          providerReference: result.reference,
        },
      });
      let version = o.version;
      if (result.status === 'succeeded') {
        if (o.commissionBpsSnapshot === null) {
          const rate =
            (await tx.commissionRate.findFirst({
              where: { workspace: o.workspace, effectiveAt: { lte: now } },
              orderBy: [{ effectiveAt: 'desc' }, { version: 'desc' }],
            })) ??
            (await tx.commissionRate.findFirst({
              where: { workspace: null, effectiveAt: { lte: now } },
              orderBy: [{ effectiveAt: 'desc' }, { version: 'desc' }],
            }));
          if (!rate) reject('COMMISSION_CONFIGURATION_MISSING');
          await tx.marketOrder.update({
            where: { id: o.id },
            data: {
              commissionBpsSnapshot: rate.basisPoints,
              commissionRateId: rate.id,
              termsAcceptedAt: now,
            },
          });
        }
        version = (await this.transition(tx, o, state, i.actorId, key)).version;
      }
      await this.event(
        tx,
        { id: o.id, version },
        i.actorId,
        `payment:${payment.id}`,
        'payment.updated',
        { paymentId: payment.id, status: payment.status, simulated: true },
      );
      return this.remember(tx, i.actorId, route, i.idempotencyKey, requestHash, {
        id: payment.id,
        status: payment.status,
        reference: payment.providerReference,
        units: units.toString(),
        currency: o.currency,
        simulated: true,
        ...(result.status === 'failed' ? { errorCode: result.code } : {}),
      });
    });
  }
  async openDispute(i: {
    orderId: string;
    actorId: string;
    reason: string;
    expectedVersion: number;
    idempotencyKey: string;
  }): Promise<Receipt> {
    return this.atomic(async (tx) => {
      const o = await this.lock(tx, i.orderId);
      if (![o.buyerId, o.sellerProfile.userId].includes(i.actorId)) reject('FORBIDDEN');
      if (!i.reason.trim()) reject('INVALID_INPUT');
      const route = `orders/${o.id}/cases`,
        requestHash = hash(i.reason),
        cached = await this.cached(tx, i.actorId, route, i.idempotencyKey, requestHash);
      if (cached) return cached;
      if (o.version !== i.expectedVersion) reject('VERSION_CONFLICT');
      if (await tx.settlement.findUnique({ where: { orderId: o.id } })) reject('ALREADY_SETTLED');
      if (!o.escrow_order || o.escrow_order.heldUnits <= 0n) reject('HOLD_REQUIRED');
      const existing = await tx.caseRecord.findFirst({
        where: {
          orderId: o.id,
          kind: { not: 'SUPPORT' },
          status: { in: ['OPEN', 'ADMIN_REVIEW'] },
        },
      });
      if (existing)
        return this.remember(tx, i.actorId, route, i.idempotencyKey, requestHash, {
          id: existing.id,
          status: existing.status,
          simulated: true,
        });
      const now = await this.now(tx),
        deadline = new Date(now.getTime() + 72 * 3600000);
      const c = await tx.caseRecord.create({
        data: {
          orderId: o.id,
          openerId: i.actorId,
          kind: 'DISPUTE',
          reason: i.reason,
          evidenceDeadlineAt: deadline,
          pausedState: o.state,
          pausedReview: {
            deliveredAt: o.deliveredAt?.toISOString() ?? null,
            reviewDeadlineAt: o.reviewDeadlineAt?.toISOString() ?? null,
          },
          caseParty_case: {
            create: [
              { userId: o.buyerId, role: 'BUYER', notifiedAt: now, evidenceDeadlineAt: deadline },
              {
                userId: o.sellerProfile.userId,
                role: 'SELLER',
                notifiedAt: now,
                evidenceDeadlineAt: deadline,
              },
            ],
          },
        },
      });
      await tx.escrow.update({ where: { id: o.escrow_order.id }, data: { status: 'FROZEN' } });
      await tx.marketOrder.update({ where: { id: o.id }, data: { paused: true } });
      const next = await this.transition(tx, o, 'DISPUTED', i.actorId, `case:${c.id}`);
      await this.event(tx, next, i.actorId, `case-opened:${c.id}`, 'case.updated', {
        caseId: c.id,
        status: c.status,
        evidenceDeadlineAt: deadline.toISOString(),
      });
      return this.remember(tx, i.actorId, route, i.idempotencyKey, requestHash, {
        id: c.id,
        status: c.status,
        simulated: true,
      });
    });
  }
  async complete(i: {
    orderId: string;
    actorId?: string;
    automatic?: boolean;
    expectedVersion?: number;
    idempotencyKey: string;
  }): Promise<Receipt> {
    return this.atomic(async (tx) => {
      const o = await this.lock(tx, i.orderId);
      if ((!i.automatic && i.actorId !== o.buyerId) || (i.automatic && i.actorId))
        reject('FORBIDDEN');
      const route = `orders/${o.id}/confirm`,
        requestHash = hash({ orderId: o.id, expectedVersion: i.expectedVersion });
      if (i.actorId) {
        const cached = await this.cached(tx, i.actorId, route, i.idempotencyKey, requestHash);
        if (cached) return cached;
      }
      // automatic is a trusted worker capability and is absent from HTTP DTOs.
      const old = await tx.settlement.findUnique({ where: { orderId: o.id } });
      if (old) {
        const result: Receipt = { id: old.id, status: 'SETTLED', simulated: true };
        return i.actorId
          ? this.remember(tx, i.actorId, route, i.idempotencyKey, requestHash, result)
          : result;
      }
      if (!i.automatic && o.version !== i.expectedVersion) reject('VERSION_CONFLICT');
      const now = await this.now(tx);
      if (
        o.state !== 'DELIVERED' ||
        o.paused ||
        !o.escrow_order ||
        o.escrow_order.status !== 'OPEN' ||
        o.escrow_order.heldUnits !== o.agreedTotalUnits ||
        o.commissionBpsSnapshot === null
      )
        reject('NOT_ELIGIBLE_FOR_SETTLEMENT');
      if (
        await tx.caseRecord.findFirst({
          where: {
            orderId: o.id,
            kind: { not: 'SUPPORT' },
            status: { in: ['OPEN', 'ADMIN_REVIEW'] },
          },
        })
      )
        reject('FUNDS_FROZEN');
      if (i.automatic && (!o.deliveryVerified || !o.reviewDeadlineAt || o.reviewDeadlineAt > now))
        reject('REVIEW_WINDOW_OPEN');
      const delivery = o.storeOrder_order?.delivery_storeOrder;
      let driverUserId: string | undefined;
      if (o.serviceOrder_order) {
        const balance = await tx.paymentAttempt.findFirst({
          where: { orderId: o.id, installment: 'BALANCE', status: 'SUCCEEDED' },
        });
        if (!balance) reject('NOT_ELIGIBLE_FOR_SETTLEMENT');
        const submission = await tx.submission.findFirst({
          where: {
            serviceOrderId: o.serviceOrder_order.id,
            kind: o.workspace === 'FREELANCE' ? 'DIGITAL_FINAL' : 'ONSITE_HANDOVER',
            submittedAt: { gte: balance.createdAt },
          },
          include: { file: true },
          orderBy: { submittedAt: 'desc' },
        });
        if (
          !submission ||
          (o.workspace === 'FREELANCE' && submission.file?.scanStatus !== 'CLEAN') ||
          (i.automatic &&
            o.workspace === 'PROFESSIONALS' &&
            submission.file?.scanStatus !== 'CLEAN')
        )
          reject('DELIVERY_PROOF_REQUIRED');
      }
      if (
        i.automatic &&
        delivery &&
        !delivery.deliveryEvent_delivery.some(
          (x) => x.type === 'DROPOFF' && x.verified && x.proof?.scanStatus === 'CLEAN',
        )
      )
        reject('DELIVERY_PROOF_REQUIRED');
      if (delivery?.method === 'PLATFORM_DRIVER') {
        const dropoff = delivery.deliveryEvent_delivery
          .filter((x) => x.type === 'DROPOFF')
          .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())[0];
        const assignment = delivery.driverAssignment_delivery.find(
          (x) => x.id === dropoff?.assignmentId && x.status === 'COMPLETED',
        );
        if (
          !assignment ||
          !delivery.deliveryEvent_delivery.some(
            (x) => x.type === 'PICKUP' && x.assignmentId === assignment.id,
          )
        )
          reject('DELIVERY_PROOF_REQUIRED');
        driverUserId = assignment.driver.userId;
      }
      if (!i.automatic)
        await tx.marketOrder.update({ where: { id: o.id }, data: { buyerConfirmedAt: now } });
      if (
        o.storeOrder_order &&
        (await tx.stockReservation.count({
          where: { orderItem: { storeOrderId: o.storeOrder_order.id }, status: 'RESERVED' },
        }))
      )
        reject('INVALID_TRANSITION');
      const result = await this.settle(
        tx,
        o,
        i.actorId ?? null,
        i.automatic ? 'AUTO_COMPLETION' : 'BUYER_CONFIRMATION',
        o.eligibleSellerUnits!,
        delivery?.method === 'SELLER' ? o.deliveryFeeUnits : 0n,
        driverUserId ? o.deliveryFeeUnits : 0n,
        driverUserId,
        i.automatic ? 'Verified review elapsed' : 'Buyer confirmed receipt',
      );
      return i.actorId
        ? this.remember(tx, i.actorId, route, i.idempotencyKey, requestHash, result)
        : result;
    });
  }
  async resolveDispute(i: {
    orderId: string;
    actorId: string;
    caseId: string;
    reason: string;
    substantiation: string;
    sellerAwardUnits: bigint;
    sellerDeliveryUnits: bigint;
    driverAwardUnits: bigint;
    driverUserId?: string;
    outcome: 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
    expectedVersion: number;
    idempotencyKey: string;
    inventoryReturns?: {
      reservationId: string;
      reusableQuantity: number;
      nonRestockableQuantity: number;
      reason: string;
    }[];
  }): Promise<Receipt> {
    return this.atomic(async (tx) => {
      await this.admin(tx, i.actorId);
      const o = await this.lock(tx, i.orderId);
      const c = await tx.caseRecord.findUniqueOrThrow({
        where: { id: i.caseId },
        include: { caseParty_case: true },
      });
      if (c.orderId !== o.id || c.handlingAdminId !== i.actorId || c.kind === 'SUPPORT')
        reject('FORBIDDEN');
      const route = `cases/${c.id}/resolve`,
        requestHash = hash({
          ...i,
          sellerAwardUnits: i.sellerAwardUnits.toString(),
          sellerDeliveryUnits: i.sellerDeliveryUnits.toString(),
          driverAwardUnits: i.driverAwardUnits.toString(),
          idempotencyKey: undefined,
        });
      const cached = await this.cached(tx, i.actorId, route, i.idempotencyKey, requestHash);
      if (cached) return cached;
      const old = await tx.settlement.findUnique({ where: { orderId: o.id } });
      if (old) {
        if (old.decisionId === (await tx.adminDecision.findUnique({ where: { caseId: c.id } }))?.id)
          return this.remember(tx, i.actorId, route, i.idempotencyKey, requestHash, {
            id: old.id,
            status: 'SETTLED',
            simulated: true,
          });
        reject('ALREADY_SETTLED');
      }
      if (
        !['OPEN', 'ADMIN_REVIEW'].includes(c.status) ||
        !o.escrow_order ||
        o.commissionBpsSnapshot === null
      )
        reject('INVALID_TRANSITION');
      if (o.version !== i.expectedVersion) reject('VERSION_CONFLICT');
      const now = await this.now(tx);
      if (c.caseParty_case.length !== 2 || c.caseParty_case.some((x) => x.evidenceDeadlineAt > now))
        reject('EVIDENCE_WINDOW_OPEN');
      if (!i.reason.trim() || !i.substantiation.trim()) reject('REASON_REQUIRED');
      if (
        i.sellerAwardUnits > o.eligibleSellerUnits! ||
        i.sellerDeliveryUnits + i.driverAwardUnits > o.deliveryFeeUnits
      )
        reject('INVALID_ALLOCATION');
      const a = settlementAmounts(
        o.escrow_order.heldUnits,
        i.sellerAwardUnits,
        i.sellerDeliveryUnits,
        i.driverAwardUnits,
        o.commissionBpsSnapshot,
      );
      if (o.storeOrder_order) {
        const reservations = await tx.stockReservation.findMany({
          where: { orderItem: { storeOrderId: o.storeOrder_order.id } },
          orderBy: { productId: 'asc' },
        });
        if (i.outcome === 'COMPLETED' && reservations.some((x) => x.status === 'RESERVED'))
          reject('INVALID_TRANSITION');
        if (i.outcome !== 'COMPLETED') {
          if (
            i.inventoryReturns?.length !== reservations.length ||
            new Set(i.inventoryReturns.map((x) => x.reservationId)).size !== reservations.length
          )
            reject('INVALID_INPUT');
          for (const r of reservations) {
            const supplied = i.inventoryReturns.find((x) => x.reservationId === r.id);
            if (
              !supplied ||
              !Number.isInteger(supplied.reusableQuantity) ||
              !Number.isInteger(supplied.nonRestockableQuantity) ||
              supplied.reusableQuantity < 0 ||
              supplied.nonRestockableQuantity < 0 ||
              supplied.reusableQuantity + supplied.nonRestockableQuantity !== r.quantity ||
              !supplied.reason.trim() ||
              r.status === 'RELEASED'
            )
              reject('INVALID_INPUT');
            await tx.$queryRaw`SELECT "id" FROM "Product" WHERE "id"=${r.productId}::uuid FOR UPDATE`;
            await tx.product.update({
              where: { id: r.productId },
              data:
                r.status === 'RESERVED'
                  ? {
                      stockReserved: { decrement: r.quantity },
                      stockOnHand: { decrement: supplied.nonRestockableQuantity },
                    }
                  : { stockOnHand: { increment: supplied.reusableQuantity } },
            });
            await tx.stockReservation.update({ where: { id: r.id }, data: { status: 'RELEASED' } });
            await tx.stockReconciliation.create({
              data: {
                reservationId: r.id,
                actorId: i.actorId,
                reusableQuantity: supplied.reusableQuantity,
                nonRestockableQuantity: supplied.nonRestockableQuantity,
                reason: supplied.reason,
              },
            });
          }
        }
      }
      const d = await tx.adminDecision.create({
        data: {
          caseId: c.id,
          adminId: i.actorId,
          reason: i.reason,
          substantiation: i.substantiation,
          sellerAwardUnits: i.sellerAwardUnits,
          sellerDeliveryUnits: i.sellerDeliveryUnits,
          driverAwardUnits: i.driverAwardUnits,
          buyerRefundUnits: a.buyerRefund,
          commissionUnits: a.commission,
          outcome: i.outcome,
        },
      });
      await tx.caseRecord.update({
        where: { id: c.id },
        data: { status: 'RESOLVED', resolvedAt: now },
      });
      await tx.marketOrder.update({ where: { id: o.id }, data: { paused: false } });
      const intermediate = await this.transition(tx, o, 'RESOLVED', i.actorId, `resolved:${d.id}`);
      const result = await this.settle(
        tx,
        { ...o, state: intermediate.state, version: intermediate.version },
        i.actorId,
        'ADMIN_RESOLUTION',
        i.sellerAwardUnits,
        i.sellerDeliveryUnits,
        i.driverAwardUnits,
        i.driverUserId,
        i.reason,
        d.id,
        i.outcome,
      );
      return this.remember(tx, i.actorId, route, i.idempotencyKey, requestHash, result);
    });
  }
  private async settle(
    tx: Tx,
    o: Awaited<ReturnType<MarketplaceFinance['lock']>>,
    actorId: string | null,
    mode: SettlementMode,
    sellerAward: bigint,
    sellerDelivery: bigint,
    driverAward: bigint,
    driverUserId: string | undefined,
    reason: string,
    decisionId?: string,
    outcome: OrderState = 'COMPLETED',
  ): Promise<Receipt> {
    const e = o.escrow_order!,
      a = settlementAmounts(
        e.heldUnits,
        sellerAward,
        sellerDelivery,
        driverAward,
        o.commissionBpsSnapshot!,
      );
    const buyer = await tx.wallet.findUniqueOrThrow({
        where: { userId_currency: { userId: o.buyerId, currency: o.currency } },
      }),
      seller = await tx.wallet.findUniqueOrThrow({
        where: { userId_currency: { userId: o.sellerProfile.userId, currency: o.currency } },
      }),
      platform = await tx.ledgerAccount.findFirstOrThrow({
        where: { kind: 'COMMISSION', currency: o.currency },
      });
    let driver: string | undefined;
    if (driverAward > 0n) {
      if (
        !driverUserId ||
        !o.storeOrder_order?.delivery_storeOrder?.driverAssignment_delivery.some(
          (x) => x.driver.userId === driverUserId,
        )
      )
        reject('INVALID_DRIVER_AWARD');
      driver = (
        await tx.wallet.findUniqueOrThrow({
          where: { userId_currency: { userId: driverUserId, currency: o.currency } },
        })
      ).accountId;
    }
    const allocations = [
      { kind: 'BUYER_REFUND' as const, recipientId: buyer.accountId, units: a.buyerRefund },
      { kind: 'SELLER_NET' as const, recipientId: seller.accountId, units: a.sellerNet },
      { kind: 'SELLER_DELIVERY' as const, recipientId: seller.accountId, units: a.sellerDelivery },
      { kind: 'COMMISSION' as const, recipientId: platform.id, units: a.commission },
      ...(driver
        ? [{ kind: 'DRIVER_PAYOUT' as const, recipientId: driver, units: a.driverPayout }]
        : []),
    ].filter((x) => x.units > 0n);
    const key = `settle:${o.id}`,
      r = await this.gateway.release(
        {
          operationKey: key,
          requestHash: hash({
            mode,
            decisionId,
            sellerAward: sellerAward.toString(),
            sellerDelivery: sellerDelivery.toString(),
            driverAward: driverAward.toString(),
          }),
          orderId: o.id,
          actorId,
          currency: o.currency,
          kind: 'SETTLEMENT',
          postings: [
            { accountId: e.accountId, debitUnits: e.heldUnits, creditUnits: 0n },
            ...allocations.map((x) => ({
              accountId: x.recipientId,
              debitUnits: 0n,
              creditUnits: x.units,
            })),
          ],
        },
        tx,
      );
    if (r.status !== 'succeeded') reject('SETTLEMENT_POSTING_FAILED');
    const s = await tx.settlement.create({
      data: {
        orderId: o.id,
        currency: o.currency,
        heldUnits: e.heldUnits,
        mode,
        reason,
        operationKey: key,
        journalId: r.journalId,
        decisionId,
        allocation_settlement: { create: allocations.map((x) => ({ ...x, currency: o.currency })) },
      },
    });
    await tx.escrow.update({ where: { id: e.id }, data: { status: 'SETTLED' } });
    const next = await this.transition(tx, o, outcome, actorId, key);
    await tx.marketOrder.update({ where: { id: o.id }, data: { completedAt: await this.now(tx) } });
    if (o.serviceOrder_order)
      await tx.scheduleReservation.updateMany({
        where: { serviceOrderId: o.serviceOrder_order.id, status: 'RESERVED' },
        data: { status: 'RELEASED' },
      });
    await this.event(tx, next, actorId, key, 'order.updated', {
      orderId: o.id,
      state: next.state,
      settlementId: s.id,
      simulated: true,
    });
    return { id: s.id, status: 'SETTLED', simulated: true };
  }
}
