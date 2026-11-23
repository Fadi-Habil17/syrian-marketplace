import { EscrowModule, EscrowService } from '../escrow/escrow.service';
import { Injectable, Module } from '@nestjs/common';
import type { CaseKind, OrderState } from '@prisma/client';
import { UnitOfWork } from '../../infrastructure/database/prisma.service';
import { OrderAggregate } from '../../common/access.service';
import { fail } from '../../common/errors';
import { OrderLifecycle, OrderCoreModule } from '../orders/order-lifecycle.service';
@Injectable()
export class CaseLifecycle {
  constructor(
    private readonly escrow: EscrowService,
    private readonly life: OrderLifecycle,
  ) {}
  async open(
    tx: UnitOfWork,
    o: OrderAggregate,
    kind: CaseKind,
    reason: string,
    actorId: string | null,
    state: OrderState = 'DISPUTED',
  ) {
    if (kind !== 'SUPPORT') {
      if (await tx.settlement.findUnique({ where: { orderId: o.id } })) fail('ALREADY_SETTLED');
      if (!o.escrow_order || o.escrow_order.heldUnits <= 0n) fail('HOLD_REQUIRED');
      const existing = await tx.caseRecord.findFirst({
        where: {
          orderId: o.id,
          kind: { not: 'SUPPORT' },
          status: { in: ['OPEN', 'ADMIN_REVIEW'] },
        },
      });
      if (existing) return existing;
    }
    const now = await this.life.deadlines.now(tx),
      deadline = new Date(now.getTime() + 72 * 3600000),
      c = await tx.caseRecord.create({
        data: {
          orderId: o.id,
          openerId:
            actorId && [o.buyerId, o.sellerProfile.userId].includes(actorId) ? actorId : null,
          kind,
          reason,
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
    if (kind !== 'SUPPORT') {
      await tx.marketOrder.update({ where: { id: o.id }, data: { paused: true } });
      await this.escrow.status(tx, o.id, 'FROZEN');
      await this.life.changed(tx, o, state, actorId, reason);
    }
    await this.life.deadlines.schedule(tx, o.id, 'EVIDENCE_EXPIRY', deadline, o.version, c.id);
    await tx.outboxEvent.create({
      data: {
        aggregateId: o.id,
        aggregateVersion: o.version,
        type: 'case.updated',
        deduplicationKey: `case:${c.id}:opened`,
        payload: { orderId: o.id, caseId: c.id, status: c.status },
      },
    });
    return c;
  }
  async escalate(
    tx: UnitOfWork,
    c: { id: string; orderId: string; status: string },
    reason: string,
  ) {
    if (!['OPEN', 'ADMIN_REVIEW'].includes(c.status)) return;
    await tx.caseRecord.update({ where: { id: c.id }, data: { status: 'ADMIN_REVIEW' } });
    await tx.outboxEvent.upsert({
      where: { deduplicationKey: `case:${c.id}:review` },
      create: {
        aggregateId: c.orderId,
        aggregateVersion: 1,
        type: 'case.updated',
        deduplicationKey: `case:${c.id}:review`,
        payload: { caseId: c.id, orderId: c.orderId, status: 'ADMIN_REVIEW', reason },
      },
      update: {},
    });
  }
}
@Module({
  imports: [OrderCoreModule, EscrowModule],
  providers: [CaseLifecycle],
  exports: [CaseLifecycle],
})
export class CaseLifecycleModule {}
