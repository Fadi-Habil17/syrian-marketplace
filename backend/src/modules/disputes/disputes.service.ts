import { EscrowModule, EscrowService } from '../escrow/escrow.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiRequest } from '../../common/actor';
import { AccessService, OrderAggregate } from '../../common/access.service';
import { CommandsService, jsonValue } from '../../common/commands.service';
import { fail, requireValue } from '../../common/errors';
import { page, pageArgs } from '../../common/pagination';
import { PrismaService, UnitOfWork } from '../../infrastructure/database/prisma.service';
import { OrderLifecycle } from '../orders/order-lifecycle.service';
import { OrdersQueryService } from '../orders/orders-query.service';
import { terminalStates, beforeDeadline } from '../orders/domain/order-state-machine';
import { MarketplaceFinance } from '../payments/application/marketplace-finance';
import { settlementAmounts } from '../payments/domain/money';
import { SchedulingService } from '../scheduling/scheduling.service';
import { CaseAccess, caseInclude, evidenceDto } from './case-access.service';
import { CaseLifecycle } from './case-lifecycle.service';
@Injectable()
export class DisputesService {
  constructor(
    private readonly escrow: EscrowService,
    private readonly db: PrismaService,
    private readonly commands: CommandsService,
    private readonly access: AccessService,
    private readonly cases: CaseAccess,
    private readonly caseLife: CaseLifecycle,
    private readonly life: OrderLifecycle,
    private readonly orders: OrdersQueryService,
    private readonly finance: MarketplaceFinance,
    private readonly scheduling: SchedulingService,
  ) {}
  private async parent(tx: UnitOfWork, r: ApiRequest, id: string) {
    const o = await this.access.order(id, r.actor, tx, true);
    this.access.version(o, r.headers['if-match']);
    return o;
  }
  async listOrderCases(r: ApiRequest) {
    await this.access.order(r.params.orderId!, r.actor);
    return page(
      (
        await this.db.caseRecord.findMany({
          where: { orderId: r.params.orderId },
          include: caseInclude,
          ...pageArgs(r.query, r.actor.id),
        })
      ).map((c) => this.cases.dto(c, r.actor)),
      r.query,
      r.actor.id,
    );
  }
  async getCase(r: ApiRequest) {
    return this.cases.dto(await this.cases.read(this.db, r.params.caseId!, r.actor), r.actor);
  }
  async openCase(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const o = await this.parent(tx, r, r.params.orderId!);
      if (![o.buyerId, o.sellerProfile.userId].includes(r.actor.id)) fail('FORBIDDEN', 403);
      if (terminalStates.includes(o.state) && r.body.kind !== 'SUPPORT') fail('ALREADY_SETTLED');
      const c = await this.caseLife.open(
        tx,
        o,
        r.body.kind,
        r.body.reason,
        r.actor.id,
        r.body.kind === 'CANCELLATION' && !!o.workStartedAt ? 'CANCELLATION_PENDING' : 'DISPUTED',
      );
      if (r.body.evidenceFileIds?.length) {
        await this.access.cleanFiles(r.body.evidenceFileIds, r.actor, 'ORDER_SHARED', tx, o.id);
        for (const fileId of r.body.evidenceFileIds)
          await tx.caseEvidence.create({
            data: { caseId: c.id, submitterId: r.actor.id, fileId, visibility: 'SHARED' },
          });
      }
      return this.cases.dto(await this.cases.read(tx, c.id, r.actor), r.actor);
    });
  }
  async listEvidence(r: ApiRequest) {
    const c = await this.cases.read(this.db, r.params.caseId!, r.actor);
    return page(
      (
        await this.db.caseEvidence.findMany({
          where: {
            caseId: c.id,
            ...(c.handlingAdminId === r.actor.id && r.actor.roles.includes('ADMIN')
              ? {}
              : { OR: [{ visibility: 'SHARED' }, { submitterId: r.actor.id }] }),
          },
          include: { file: true },
          ...pageArgs(r.query, r.actor.id),
        })
      ).map(evidenceDto),
      r.query,
      r.actor.id,
    );
  }
  async submitEvidence(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const c = await this.cases.read(tx, r.params.caseId!, r.actor);
      await this.access.order(c.orderId, r.actor, tx, true);
      if (!['OPEN', 'ADMIN_REVIEW'].includes(c.status)) fail('INVALID_TRANSITION');
      const party = c.caseParty_case.find((p) => p.userId === r.actor.id),
        admin = c.handlingAdminId === r.actor.id && r.actor.roles.includes('ADMIN'),
        now = await this.life.deadlines.now(tx);
      if (!party && !admin) fail('FORBIDDEN', 403);
      if ((!party || now >= party.evidenceDeadlineAt) && (!admin || !r.body.lateReason))
        fail('EVIDENCE_WINDOW_CLOSED');
      const b = r.body,
        ids: string[] = b.fileIds ?? [];
      await this.access.cleanFiles(ids, r.actor, 'CASE_EVIDENCE', tx, c.orderId);
      if (
        ids.length &&
        (await tx.fileAsset.count({ where: { id: { in: ids }, caseId: { not: c.id } } }))
      )
        fail('NOT_FOUND', 404);
      const records = [];
      for (const fileId of ids.length ? ids : [undefined])
        records.push(
          await tx.caseEvidence.create({
            data: {
              caseId: c.id,
              submitterId: r.actor.id,
              text: b.text,
              fileId,
              visibility: b.visibility,
              lateReason: b.lateReason,
            },
            include: { file: true },
          }),
        );
      await this.commands.audit(tx, r.actor.id, c.id, 'case.evidence.submitted', {
        count: records.length,
        late: !!b.lateReason,
      });
      return evidenceDto(records[0]);
    });
  }
  private proposalDto(p: any, c: any) {
    return {
      ...p,
      buyerDecision:
        p.proposalApproval_proposal.find((a: any) => a.userId === c.order.buyerId)?.decision ??
        null,
      sellerDecision:
        p.proposalApproval_proposal.find((a: any) => a.userId === c.order.sellerProfile.userId)
          ?.decision ?? null,
    };
  }
  async listProposals(r: ApiRequest) {
    const c = await this.cases.read(this.db, r.params.caseId!, r.actor);
    return page(
      (
        await this.db.resolutionProposal.findMany({
          where: { caseId: c.id },
          include: { proposalApproval_proposal: true },
          ...pageArgs(r.query, r.actor.id, [{ version: 'desc' }, { id: 'desc' }]),
        })
      ).map((p) => this.proposalDto(p, c)),
      r.query,
      r.actor.id,
    );
  }
  private async proposal(tx: UnitOfWork, c: any, o: OrderAggregate, actorId: string, b: any) {
    if (!['OPEN', 'ADMIN_REVIEW'].includes(c.status)) fail('INVALID_TRANSITION');
    const last = await tx.resolutionProposal.findFirst({
        where: { caseId: c.id },
        orderBy: { version: 'desc' },
      }),
      now = await this.life.deadlines.now(tx);
    const amounts = {
      sellerAwardUnits: BigInt(b.sellerAwardUnits ?? '0'),
      sellerDeliveryUnits: BigInt(b.sellerDeliveryUnits ?? '0'),
      driverAwardUnits: BigInt(b.driverAwardUnits ?? '0'),
    };
    if (b.kind === 'CANCELLATION_SPLIT') {
      if (
        amounts.sellerAwardUnits > (o.eligibleSellerUnits ?? 0n) ||
        amounts.sellerDeliveryUnits + amounts.driverAwardUnits > o.deliveryFeeUnits
      )
        fail('INVALID_ALLOCATION', 400);
      settlementAmounts(
        o.escrow_order!.heldUnits,
        amounts.sellerAwardUnits,
        amounts.sellerDeliveryUnits,
        amounts.driverAwardUnits,
        o.commissionBpsSnapshot ?? 0,
      );
    } else {
      if (!b.newDueAt || new Date(b.newDueAt) <= now || (b.kind === 'REVISION' && !b.scope))
        fail('INVALID_INPUT', 400);
      if (Object.values(amounts).some((n) => n !== 0n)) fail('INVALID_ALLOCATION', 400);
    }
    const p = await tx.resolutionProposal.create({
      data: {
        caseId: c.id,
        proposedById: actorId,
        kind: b.kind,
        version: (last?.version ?? 0) + 1,
        reason: b.reason,
        scope: b.scope,
        inventoryReturns: b.inventoryReturns ? jsonValue(b.inventoryReturns) : undefined,
        newDueAt: b.newDueAt ? new Date(b.newDueAt) : undefined,
        agreementDeadlineAt: new Date(now.getTime() + 72 * 3600000),
        ...amounts,
        proposalApproval_proposal: { create: { userId: actorId, decision: 'ACCEPT' } },
      },
      include: { proposalApproval_proposal: true },
    });
    await this.life.deadlines.schedule(
      tx,
      o.id,
      'CANCELLATION_EXPIRY',
      p.agreementDeadlineAt,
      p.version,
      c.id,
    );
    await this.life.changed(tx, o, o.state, actorId, 'Resolution proposal recorded');
    return p;
  }
  async proposeResolution(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const c = await this.cases.read(tx, r.params.caseId!, r.actor);
      this.cases.party(c, r.actor);
      const o = await this.parent(tx, r, c.orderId),
        p = await this.proposal(tx, c, o, r.actor.id, r.body);
      return this.proposalDto(p, c);
    });
  }
  private async decide(tx: UnitOfWork, r: ApiRequest, proposalId: string, accept: boolean) {
    const p = requireValue(
        await tx.resolutionProposal.findUnique({
          where: { id: proposalId },
          include: { proposalApproval_proposal: true },
        }),
      ),
      c = await this.cases.read(tx, p.caseId, r.actor);
    this.cases.party(c, r.actor);
    if (r.params.caseId && r.params.caseId !== c.id) fail('NOT_FOUND', 404);
    let o = await this.parent(tx, r, c.orderId);
    if (
      !['OPEN', 'ADMIN_REVIEW'].includes(c.status) ||
      p.id !==
        (
          await tx.resolutionProposal.findFirst({
            where: { caseId: c.id },
            orderBy: { version: 'desc' },
          })
        )?.id
    )
      fail('VERSION_CONFLICT');
    beforeDeadline(await this.life.deadlines.now(tx), p.agreementDeadlineAt);
    const previous = p.proposalApproval_proposal.find((a) => a.userId === r.actor.id);
    if (previous && previous.decision !== (accept ? 'ACCEPT' : 'REJECT')) fail('VERSION_CONFLICT');
    if (!previous)
      await tx.proposalApproval.create({
        data: { proposalId: p.id, userId: r.actor.id, decision: accept ? 'ACCEPT' : 'REJECT' },
      });
    let settlementId: string | undefined;
    if (!accept) {
      await this.caseLife.escalate(tx, c, r.body.reason);
      await this.life.changed(
        tx,
        o,
        o.state,
        r.actor.id,
        'Resolution proposal rejected; admin review required',
      );
    } else if (
      (await tx.proposalApproval.count({ where: { proposalId: p.id, decision: 'ACCEPT' } })) === 2
    ) {
      const suspended =
        o.sellerProfile.status === 'SUSPENDED' ||
        (await tx.restriction.findFirst({
          where: {
            userId: { in: [o.buyerId, o.sellerProfile.userId] },
            kind: 'SUSPENSION',
            revokedAt: null,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        }));
      if (suspended) {
        await this.caseLife.escalate(tx, c, 'Suspended participant requires handling admin review');
        await this.life.changed(
          tx,
          o,
          o.state,
          r.actor.id,
          'Approvals recorded; restricted funds remain frozen',
        );
      } else if (p.kind === 'CANCELLATION_SPLIT')
        settlementId = (await this.finance.settleMutualInTransaction(tx, p.id, r.actor.id)).id;
      else if (c.kind === 'FINAL_PAYMENT_OVERDUE' || p.kind === 'DELIVERY_REMEDY') {
        await this.life.changed(
          tx,
          o,
          o.state,
          r.actor.id,
          'Both parties accepted plan; handling admin authorization pending',
        );
      } else {
        if (!o.serviceOrder_order || !p.newDueAt) fail('INVALID_TRANSITION');
        await tx.serviceOrder.update({
          where: { id: o.serviceOrder_order.id },
          data: { dueAt: p.newDueAt },
        });
        await this.life.deadlines.schedule(tx, o.id, 'SERVICE_DUE', p.newDueAt, o.version + 1);
        await tx.caseRecord.update({
          where: { id: c.id },
          data: {
            status: p.kind === 'REVISION' ? 'REVISION_ACCEPTED' : 'RESOLVED',
            resolvedAt: await this.life.deadlines.now(tx),
          },
        });
        await tx.marketOrder.update({ where: { id: o.id }, data: { paused: false } });
        await this.escrow.status(tx, o.id, 'OPEN');
        let state =
          p.kind === 'REVISION' ? 'REVISION_IN_PROGRESS' : (c.pausedState ?? 'IN_PROGRESS');
        if (state === 'EXTENSION_PENDING') state = o.workStartedAt ? 'IN_PROGRESS' : 'DEPOSIT_HELD';
        await this.life.changed(
          tx,
          o,
          state as any,
          r.actor.id,
          'Both parties approved exact recorded plan',
        );
      }
    } else await this.life.changed(tx, o, o.state, r.actor.id, 'Resolution approval recorded');
    return this.orders.action(o.id, tx, { caseId: c.id, settlementId });
  }
  acceptResolutionProposal(r: ApiRequest) {
    return this.commands.run(r, (tx) => this.decide(tx, r, r.params.proposalId!, true));
  }
  rejectResolutionProposal(r: ApiRequest) {
    return this.commands.run(r, (tx) => this.decide(tx, r, r.params.proposalId!, false));
  }
  acceptRevisionPlan(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const p = requireValue(
        await tx.resolutionProposal.findFirst({
          where: { caseId: r.params.caseId, kind: 'REVISION' },
          orderBy: { version: 'desc' },
        }),
      );
      return this.decide(tx, r, p.id, true);
    });
  }
  async cancelOrder(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      let o = await this.parent(tx, r, r.params.orderId!);
      if (![o.buyerId, o.sellerProfile.userId].includes(r.actor.id)) fail('FORBIDDEN', 403);
      if (terminalStates.includes(o.state)) fail('INVALID_TRANSITION');
      const governing = await tx.caseRecord.findFirst({
        where: {
          orderId: o.id,
          kind: { not: 'SUPPORT' },
          status: { in: ['OPEN', 'ADMIN_REVIEW'] },
        },
      });
      if (governing) return this.orders.action(o.id, tx, { caseId: governing.id });
      if (o.paused && o.state === 'EXTENSION_PENDING') {
        await tx.caseRecord.updateMany({
          where: { orderId: o.id, kind: 'SUPPORT', status: { in: ['OPEN', 'ADMIN_REVIEW'] } },
          data: { status: 'RESOLVED', resolvedAt: await this.life.deadlines.now(tx) },
        });
        await tx.marketOrder.update({ where: { id: o.id }, data: { paused: false } });
        await this.escrow.status(tx, o.id, 'OPEN');
        o = await this.access.order(o.id, r.actor, tx);
      }
      if (o.escrow_order!.heldUnits === 0n) {
        if (o.serviceOrder_order) await this.scheduling.release(tx, o.serviceOrder_order.id);
        await this.life.changed(tx, o, 'CANCELLED', r.actor.id, r.body.reason);
        return this.orders.action(o.id, tx);
      }
      if (
        r.actor.id === o.sellerProfile.userId ||
        (!o.workStartedAt && !o.storeOrder_order) ||
        o.state === 'PAID_IN_ESCROW'
      ) {
        const receipt = await this.finance.refundUncontestedInTransaction(tx, {
          orderId: o.id,
          actorId: r.actor.id,
          mode: r.actor.id === o.sellerProfile.userId ? 'PROVIDER_CANCEL' : 'PRESTART_CANCEL',
          reason: r.body.reason,
          inventoryReturns: r.body.inventoryReturns,
        });
        return this.orders.action(o.id, tx, { settlementId: receipt.id });
      }
      const c = await this.caseLife.open(
        tx,
        o,
        'CANCELLATION',
        r.body.reason,
        r.actor.id,
        'CANCELLATION_PENDING',
      );
      o = await this.access.order(o.id, r.actor, tx);
      if (r.body.proposal) {
        if (r.body.proposal.kind !== 'CANCELLATION_SPLIT') fail('INVALID_INPUT', 400);
        await this.proposal(tx, c, o, r.actor.id, r.body.proposal);
      }
      return this.orders.action(o.id, tx, { caseId: c.id });
    });
  }
  requestExtension(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      let o = await this.parent(tx, r, r.params.orderId!);
      if (![o.buyerId, o.sellerProfile.userId].includes(r.actor.id)) fail('FORBIDDEN', 403);
      const s = requireValue(o.serviceOrder_order),
        now = await this.life.deadlines.now(tx),
        existing = await tx.caseRecord.findFirst({
          where: { orderId: o.id, status: { in: ['OPEN', 'ADMIN_REVIEW'] } },
        });
      if (
        !s.dueAt ||
        s.dueAt > now ||
        !['DEPOSIT_HELD', 'IN_PROGRESS', 'EN_ROUTE', 'ON_SITE', 'EXTENSION_PENDING'].includes(
          o.state,
        ) ||
        (existing && (existing.kind !== 'SUPPORT' || o.state !== 'EXTENSION_PENDING'))
      )
        fail('INVALID_TRANSITION');
      const c = existing ?? (await this.caseLife.open(tx, o, 'SUPPORT', r.body.reason, r.actor.id));
      await tx.marketOrder.update({ where: { id: o.id }, data: { paused: true } });
      await this.escrow.status(tx, o.id, 'FROZEN');
      await this.life.changed(tx, o, 'EXTENSION_PENDING', r.actor.id, r.body.reason);
      o = await this.access.order(o.id, r.actor, tx);
      await this.proposal(tx, c, o, r.actor.id, {
        kind: 'EXTENSION',
        reason: r.body.reason,
        newDueAt: r.body.dueAt,
      });
      return this.orders.action(o.id, tx, { caseId: c.id });
    });
  }
  acceptExtension(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const p = requireValue(
        await tx.resolutionProposal.findFirst({
          where: {
            kind: 'EXTENSION',
            case: { orderId: r.params.orderId, status: { in: ['OPEN', 'ADMIN_REVIEW'] } },
          },
          orderBy: { createdAt: 'desc' },
        }),
      );
      return this.decide(tx, r, p.id, true);
    });
  }
}
