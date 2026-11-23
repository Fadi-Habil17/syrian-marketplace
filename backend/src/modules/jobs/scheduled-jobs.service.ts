import { EscrowModule, EscrowService } from '../escrow/escrow.service';
import { Injectable } from '@nestjs/common';
import { ScheduledJob } from '@prisma/client';
import { PrismaService, UnitOfWork } from '../../infrastructure/database/prisma.service';
import { orderInclude } from '../../common/access.service';
import { OrderLifecycle } from '../orders/order-lifecycle.service';
import { CaseLifecycle } from '../disputes/case-lifecycle.service';
import { MarketplaceFinance } from '../payments/application/marketplace-finance';
import { SchedulingService } from '../scheduling/scheduling.service';
@Injectable()
export class ScheduledJobsService {
  constructor(
    private readonly escrow: EscrowService,
    private readonly db: PrismaService,
    private readonly life: OrderLifecycle,
    private readonly cases: CaseLifecycle,
    private readonly finance: MarketplaceFinance,
    private readonly scheduling: SchedulingService,
  ) {}
  async claim(limit = 20) {
    return this.db.atomic(async (tx) => {
      const rows = await tx.$queryRaw<
        { id: string }[]
      >`SELECT "id" FROM "ScheduledJob" WHERE "status" IN ('READY','RUNNING') AND "dueAt"<=transaction_timestamp() AND ("claimedUntil" IS NULL OR "claimedUntil"<transaction_timestamp()) ORDER BY "dueAt","id" LIMIT ${limit} FOR UPDATE SKIP LOCKED`;
      const lease = new Date(Date.now() + 60000);
      for (const row of rows)
        await tx.scheduledJob.update({
          where: { id: row.id },
          data: { status: 'RUNNING', claimedUntil: lease, attempts: { increment: 1 } },
        });
      return tx.scheduledJob.findMany({ where: { id: { in: rows.map((r) => r.id) } } });
    });
  }
  async process(job: ScheduledJob) {
    return this.db.atomic(async (tx) => {
      let o = await tx.marketOrder.findUniqueOrThrow({
        where: { id: job.orderId },
        include: orderInclude,
      });
      await this.db.lockUsers(tx, [
        o.buyerId,
        o.sellerProfile.userId,
        ...(o.storeOrder_order?.delivery_storeOrder?.driverAssignment_delivery
          .filter((a) => ['ASSIGNED', 'PICKED_UP'].includes(a.status))
          .map((a) => a.driver.userId) ?? []),
      ]);
      await tx.$queryRaw`SELECT "id" FROM "MarketOrder" WHERE "id"=${o.id}::uuid FOR UPDATE`;
      await tx.$queryRaw`SELECT "id" FROM "ScheduledJob" WHERE "id"=${job.id}::uuid FOR UPDATE`;
      const current = await tx.scheduledJob.findUniqueOrThrow({ where: { id: job.id } });
      if (
        current.status !== 'RUNNING' ||
        current.claimedUntil?.getTime() !== job.claimedUntil?.getTime()
      )
        return;
      o = await tx.marketOrder.findUniqueOrThrow({ where: { id: o.id }, include: orderInclude });
      await this.execute(tx, current, o);
      await tx.scheduledJob.update({
        where: { id: job.id },
        data: { status: 'DONE', claimedUntil: null },
      });
    });
  }
  private async event(
    tx: UnitOfWork,
    o: { id: string; version: number },
    job: ScheduledJob,
    type: string,
  ) {
    await tx.outboxEvent.upsert({
      where: { deduplicationKey: `job:${job.id}` },
      create: {
        aggregateId: o.id,
        aggregateVersion: o.version,
        type,
        deduplicationKey: `job:${job.id}`,
        payload: { orderId: o.id, kind: job.kind },
      },
      update: {},
    });
  }
  private async execute(
    tx: UnitOfWork,
    j: ScheduledJob,
    o: import('../../common/access.service').OrderAggregate,
  ) {
    const now = await this.life.deadlines.now(tx),
      s = o.serviceOrder_order,
      expired = (at: Date | null | undefined) =>
        !!at && at <= now && at.getTime() === j.dueAt.getTime();
    if (now < j.dueAt) return;
    if (
      j.kind === 'RESPONSE_EXPIRY' &&
      s &&
      [
        'AWAITING_AGREEMENT',
        'BOOKING_REQUESTED',
        'SCHEDULE_PROPOSED',
        'PENDING_QUOTE',
        'QUOTE_SENT',
      ].includes(o.state) &&
      expired(s.responseDeadlineAt) &&
      o.escrow_order!.heldUnits === 0n
    ) {
      await this.scheduling.release(tx, s.id);
      await tx.booking.updateMany({ where: { serviceOrderId: s.id }, data: { state: 'EXPIRED' } });
      await tx.quote.updateMany({
        where: { serviceOrderId: s.id, state: 'SENT' },
        data: { state: 'EXPIRED' },
      });
      await this.life.changed(
        tx,
        o,
        'EXPIRED',
        null,
        'Unanswered request or quote expired after 72 hours',
      );
    } else if (
      j.kind === 'DEPOSIT_EXPIRY' &&
      s &&
      o.state === 'AWAITING_DEPOSIT' &&
      expired(s.depositDeadlineAt) &&
      o.escrow_order!.heldUnits === 0n
    ) {
      await this.scheduling.release(tx, s.id);
      await this.life.changed(
        tx,
        o,
        'EXPIRED',
        null,
        'Deposit window expired after 48 hours; no charge',
      );
    } else if (
      j.kind === 'STORE_ACCEPTANCE_EXPIRY' &&
      o.state === 'PAID_IN_ESCROW' &&
      expired(o.storeOrder_order?.sellerAcceptanceDeadlineAt) &&
      !o.paused
    ) {
      await this.finance.refundUncontestedInTransaction(tx, {
        orderId: o.id,
        mode: 'STORE_TIMEOUT',
        reason: 'Seller did not accept within 24 hours; full items and delivery refund',
      });
    } else if (
      ['BALANCE_REMINDER_24', 'BALANCE_REMINDER_48'].includes(j.kind) &&
      s?.readyAt &&
      o.state === 'READY_FOR_FINAL_PAYMENT' &&
      !o.paused &&
      s.balanceDeadlineAt &&
      s.balanceDeadlineAt > now
    ) {
      const offset = j.kind === 'BALANCE_REMINDER_24' ? 24 : 48;
      if (j.dueAt.getTime() === (s.balanceResumedAt ?? s.readyAt).getTime() + offset * 3600000)
        await this.event(tx, o, j, 'order.payment.reminder');
    } else if (
      j.kind === 'BALANCE_EXPIRY' &&
      s &&
      o.state === 'READY_FOR_FINAL_PAYMENT' &&
      expired(s.balanceDeadlineAt) &&
      !o.paused &&
      !(await tx.paymentAttempt.findFirst({
        where: { orderId: o.id, installment: 'BALANCE', status: 'SUCCEEDED' },
      }))
    ) {
      await this.cases.open(
        tx,
        o,
        'FINAL_PAYMENT_OVERDUE',
        'Final payment window expired; deposit retained without forfeiture or extra charge',
        null,
        'FINAL_PAYMENT_OVERDUE',
      );
    } else if (
      j.kind === 'SERVICE_DUE' &&
      s &&
      expired(s.dueAt) &&
      ['DEPOSIT_HELD', 'IN_PROGRESS', 'EN_ROUTE', 'ON_SITE', 'REVISION_IN_PROGRESS'].includes(
        o.state,
      ) &&
      !o.paused
    ) {
      await this.cases.open(
        tx,
        o,
        'SUPPORT',
        'Agreed service due date missed; offer extension or cancellation',
        null,
      );
      await tx.marketOrder.update({ where: { id: o.id }, data: { paused: true } });
      await this.escrow.status(tx, o.id, 'FROZEN');
      await this.life.changed(
        tx,
        o,
        'EXTENSION_PENDING',
        null,
        'Agreed due date missed; no automatic award',
      );
    } else if (j.kind === 'EVIDENCE_EXPIRY' && j.caseId) {
      const c = await tx.caseRecord.findUnique({
        where: { id: j.caseId },
        include: { caseParty_case: true },
      });
      if (
        c &&
        ['OPEN', 'ADMIN_REVIEW'].includes(c.status) &&
        c.caseParty_case.length === 2 &&
        c.caseParty_case.every((p) => p.evidenceDeadlineAt <= now)
      ) {
        if (c.kind === 'SUPPORT' && o.state === 'EXTENSION_PENDING') {
          await tx.caseRecord.update({ where: { id: c.id }, data: { kind: 'DISPUTE' } });
          await this.life.changed(
            tx,
            o,
            'DISPUTED',
            null,
            'No agreed extension; handling admin review required',
          );
        }
        await this.cases.escalate(
          tx,
          c,
          'Each party received 72 hours for evidence; no automatic allocation',
        );
      }
    } else if (j.kind === 'CANCELLATION_EXPIRY' && j.caseId) {
      const c = await tx.caseRecord.findUnique({ where: { id: j.caseId } }),
        p = await tx.resolutionProposal.findFirst({
          where: { caseId: j.caseId },
          orderBy: { version: 'desc' },
        });
      if (
        c &&
        p &&
        p.version === j.deadlineVersion &&
        expired(p.agreementDeadlineAt) &&
        ['OPEN', 'ADMIN_REVIEW'].includes(c.status)
      ) {
        if (c.kind === 'SUPPORT' && o.state === 'EXTENSION_PENDING') {
          await tx.caseRecord.update({ where: { id: c.id }, data: { kind: 'DISPUTE' } });
          await this.life.changed(tx, o, 'DISPUTED', null, 'No mutual agreement within 72 hours');
        }
        await this.cases.escalate(tx, c, 'Proposal agreement window expired; funds remain held');
      }
    } else if (
      j.kind === 'DELIVERY_REVIEW' &&
      o.state === 'DELIVERED' &&
      o.deliveryVersion === j.deadlineVersion &&
      expired(o.reviewDeadlineAt) &&
      !o.paused &&
      !(await tx.settlement.findUnique({ where: { orderId: o.id } }))
    ) {
      const suspended =
        o.sellerProfile.status === 'SUSPENDED' ||
        (await tx.restriction.findFirst({
          where: {
            userId: { in: [o.buyerId, o.sellerProfile.userId] },
            kind: 'SUSPENSION',
            revokedAt: null,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        }));
      if (!o.deliveryVerified || suspended)
        await this.cases.open(
          tx,
          o,
          'DELIVERY_REVIEW',
          suspended
            ? 'Suspended participant requires review'
            : 'Physical handover lacks verified proof; buyer confirmation or admin decision required',
          null,
          'DELIVERY_REVIEW_REQUIRED',
        );
      else {
        try {
          await this.finance.completeInTransaction(tx, {
            orderId: o.id,
            automatic: true,
            idempotencyKey: `auto:${o.id}:${o.deliveryVersion}`,
          });
        } catch (e) {
          if (
            !(e instanceof Error) ||
            ![
              'DELIVERY_PROOF_REQUIRED',
              'NOT_ELIGIBLE_FOR_SETTLEMENT',
              'ACCOUNT_RESTRICTED',
            ].includes(e.message)
          )
            throw e;
          await this.cases.open(
            tx,
            o,
            'DELIVERY_REVIEW',
            'Completion proof did not meet settlement policy',
            null,
            'DELIVERY_REVIEW_REQUIRED',
          );
        }
      }
    } else if (
      j.kind === 'DISPATCH_ESCALATION' &&
      o.state === 'READY_FOR_DELIVERY' &&
      o.storeOrder_order?.delivery_storeOrder
    ) {
      const d = o.storeOrder_order.delivery_storeOrder;
      if (
        d.status === 'REQUESTED' &&
        d.requestedAt &&
        d.requestedAt.getTime() + 2 * 3600000 <= now.getTime()
      )
        await this.event(tx, o, j, 'delivery.dispatch.escalated');
    }
  }
  async tick(limit = 20) {
    let done = 0;
    for (const job of await this.claim(limit))
      try {
        await this.process(job);
        done++;
      } catch {
        await this.db.scheduledJob.updateMany({
          where: { id: job.id, claimedUntil: job.claimedUntil },
          data: {
            status: job.attempts >= 10 ? 'FAILED' : 'RUNNING',
            claimedUntil: new Date(Date.now() + Math.min(3600000, 1000 * 2 ** job.attempts)),
          },
        });
      }
    return done;
  }
}
