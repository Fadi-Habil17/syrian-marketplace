import { EscrowModule, EscrowService } from '../escrow/escrow.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiRequest, Actor } from '../../common/actor';
import { AccessService, orderInclude } from '../../common/access.service';
import { CommandsService } from '../../common/commands.service';
import { fail, requireValue } from '../../common/errors';
import { page, pageArgs } from '../../common/pagination';
import { PrismaService, UnitOfWork } from '../../infrastructure/database/prisma.service';
import { OrderLifecycle } from '../orders/order-lifecycle.service';
import { OrdersQueryService, money } from '../orders/orders-query.service';
import { InventoryService } from '../inventory/inventory.service';
import { MarketplaceFinance } from '../payments/application/marketplace-finance';
import { ShippingPolicy } from './shipping-policy.service';
import { CaseLifecycle } from '../disputes/case-lifecycle.service';
const include = {
  storeOrder: { include: { order: { include: orderInclude } } },
  driverAssignment_delivery: {
    include: { driver: true },
    orderBy: { acceptedAt: 'desc' as const },
  },
  deliveryEvent_delivery: { orderBy: { occurredAt: 'asc' as const }, take: 100 },
  city: true,
  area: true,
} satisfies Prisma.DeliveryInclude;
type Row = Prisma.DeliveryGetPayload<{ include: typeof include }>;
const active = (d: Row) =>
  d.driverAssignment_delivery.find((a) => ['ASSIGNED', 'PICKED_UP'].includes(a.status));
@Injectable()
export class DeliveryService {
  constructor(
    private readonly escrow: EscrowService,
    private readonly db: PrismaService,
    private readonly commands: CommandsService,
    private readonly access: AccessService,
    private readonly life: OrderLifecycle,
    private readonly orders: OrdersQueryService,
    private readonly stock: InventoryService,
    private readonly finance: MarketplaceFinance,
    private readonly shipping: ShippingPolicy,
    private readonly cases: CaseLifecycle,
  ) {}
  async reassignDelivery(r: ApiRequest) {
    if (!r.actor.roles.includes('ADMIN')) fail('FORBIDDEN', 403);
    const initial = await this.row(this.db, r.params.deliveryId!),
      target = requireValue(
        await this.db.businessProfile.findFirst({
          where: { id: r.body.driverProfileId, type: 'DELIVERY_DRIVER', status: 'ACTIVE' },
          include: { user: true },
        }),
      );
    return this.deliveryCommand(
      r,
      async (tx) => {
        let d = await this.row(tx, initial.id);
        await tx.$queryRaw`SELECT "id" FROM "MarketOrder" WHERE "id"=${d.storeOrder.orderId}::uuid FOR UPDATE`;
        d = await this.row(tx, d.id);
        const o = d.storeOrder.order,
          old = active(d),
          picked = old?.status === 'PICKED_UP';
        this.access.version(o, r.headers['if-match']);
        const driver = requireValue(
          await tx.businessProfile.findFirst({
            where: {
              id: target.id,
              status: 'ACTIVE',
              type: 'DELIVERY_DRIVER',
              user: {
                archivedAt: null,
                userRole_user: { some: { revokedAt: null, role: { code: 'DELIVERY_DRIVER' } } },
                restriction_user: {
                  none: {
                    kind: 'SUSPENSION',
                    revokedAt: null,
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                  },
                },
              },
            },
          }),
        );
        if (
          d.method !== 'PLATFORM_DRIVER' ||
          old?.driverId === driver.id ||
          [o.buyerId, o.sellerProfile.userId].includes(driver.userId) ||
          (await tx.driverAssignment.findFirst({
            where: { driverId: driver.id, status: { in: ['ASSIGNED', 'PICKED_UP'] } },
          }))
        )
          fail('DRIVER_UNAVAILABLE');
        if (
          !(await tx.driverZone.findFirst({
            where: {
              profileId: driver.id,
              governorateId: d.city.governorateId,
              OR: [{ cityId: null }, { cityId: d.cityId }],
            },
          }))
        )
          fail('FORBIDDEN', 403);
        if (picked) {
          const c = requireValue(
              await tx.caseRecord.findFirst({
                where: {
                  orderId: o.id,
                  handlingAdminId: r.actor.id,
                  kind: 'DELIVERY_REVIEW',
                  status: { in: ['OPEN', 'ADMIN_REVIEW'] },
                },
              }),
            ),
            p = await tx.resolutionProposal.findFirst({
              where: { caseId: c.id, kind: 'DELIVERY_REMEDY' },
              orderBy: { version: 'desc' },
              include: { proposalApproval_proposal: true },
            });
          if (
            !p ||
            p.proposalApproval_proposal.length !== 2 ||
            p.proposalApproval_proposal.some((a) => a.decision !== 'ACCEPT') ||
            !r.body.custodyEvidenceFileIds?.length
          )
            fail('AGREEMENT_REQUIRED');
          await this.access.cleanFiles(
            r.body.custodyEvidenceFileIds,
            r.actor,
            'CASE_EVIDENCE',
            tx,
            o.id,
          );
          if (
            await tx.fileAsset.count({
              where: { id: { in: r.body.custodyEvidenceFileIds }, caseId: { not: c.id } },
            })
          )
            fail('NOT_FOUND', 404);
          await tx.caseRecord.update({
            where: { id: c.id },
            data: { status: 'RESOLVED', resolvedAt: await this.life.deadlines.now(tx) },
          });
          await tx.marketOrder.update({ where: { id: o.id }, data: { paused: false } });
          await this.escrow.status(tx, o.id, 'OPEN');
        } else if (o.paused || !['READY_FOR_DELIVERY', 'DELIVERY_EXCEPTION'].includes(o.state))
          fail('INVALID_TRANSITION');
        const now = await this.life.deadlines.now(tx);
        if (old)
          await tx.driverAssignment.update({
            where: { id: old.id },
            data: { status: picked ? 'CANCELLED' : 'RELEASED', endedAt: now },
          });
        const a = await tx.driverAssignment.create({
          data: {
            deliveryId: d.id,
            driverId: driver.id,
            status: picked ? 'PICKED_UP' : 'ASSIGNED',
          },
        });
        await tx.delivery.update({
          where: { id: d.id },
          data: { status: picked ? 'PICKED_UP' : 'ASSIGNED' },
        });
        await tx.deliveryEvent.create({
          data: {
            deliveryId: d.id,
            assignmentId: a.id,
            type: 'REASSIGNED',
            actorId: r.actor.id,
            notes: r.body.reason,
          },
        });
        if (picked)
          await tx.deliveryEvent.create({
            data: {
              deliveryId: d.id,
              assignmentId: a.id,
              type: 'PICKUP',
              actorId: r.actor.id,
              notes: 'Admin approved documented custody transfer',
            },
          });
        await this.commands.audit(tx, r.actor.id, d.id, 'delivery.reassigned', {
          fromAssignmentId: old?.id ?? null,
          toAssignmentId: a.id,
          reason: r.body.reason,
          custodyEvidenceFileIds: r.body.custodyEvidenceFileIds ?? [],
        });
        await this.life.changed(
          tx,
          o,
          picked ? 'OUT_FOR_DELIVERY' : 'READY_FOR_DELIVERY',
          r.actor.id,
          r.body.reason,
        );
        return this.dto(await this.row(tx, d.id));
      },
      [
        target.userId,
        ...initial.driverAssignment_delivery
          .filter((a) => ['ASSIGNED', 'PICKED_UP'].includes(a.status))
          .map((a) => a.driver.userId),
      ],
    );
  }
  private async row(tx: UnitOfWork, id: string) {
    return requireValue(await tx.delivery.findUnique({ where: { id }, include }));
  }
  private async canRead(tx: UnitOfWork, d: Row, actor: Actor) {
    const o = d.storeOrder.order;
    return Boolean(
      [o.buyerId, o.sellerProfile.userId].includes(actor.id) ||
      (actor.roles.includes('DELIVERY_DRIVER') &&
        active(d)?.driver.status === 'ACTIVE' &&
        active(d)?.driver.userId === actor.id) ||
      (actor.roles.includes('ADMIN') &&
        (await tx.caseRecord.findFirst({ where: { orderId: o.id, handlingAdminId: actor.id } }))),
    );
  }
  private async allowed(tx: UnitOfWork, d: Row, actor: Actor) {
    if (!(await this.canRead(tx, d, actor))) fail('NOT_FOUND', 404);
  }
  private dto(d: Row, includeDestination = false) {
    const a = active(d),
      o = d.storeOrder.order;
    return {
      id: d.id,
      method: d.method,
      status: d.status,
      termsVersion: d.termsVersion,
      droppedOffAt: d.droppedOffAt,
      orderId: o.id,
      orderVersion: o.version,
      fee: money(d.currency, d.feeUnits),
      address: includeDestination ? o.addressSnapshot : null,
      assignmentId: a?.id ?? null,
      driverProfileId: a?.driverId ?? null,
      events: d.deliveryEvent_delivery.map((e) => ({ ...e, proofFileId: e.proofId })),
    };
  }
  // Keep destinations out of idempotency receipts. Recheck the current assignment even on a replay.
  private async deliveryCommand(
    r: ApiRequest,
    work: (tx: UnitOfWork) => Promise<ReturnType<DeliveryService['dto']>>,
    participants: string[] = [],
  ) {
    const receipt = await this.commands.run(r, work, participants);
    const current = await this.row(this.db, receipt.id);
    const authorized = await this.canRead(this.db, current, r.actor);
    return { ...receipt, address: authorized ? current.storeOrder.order.addressSnapshot : null };
  }
  async getDelivery(r: ApiRequest) {
    const d = await this.row(this.db, r.params.deliveryId!);
    await this.allowed(this.db, d, r.actor);
    return this.dto(
      d,
      d.storeOrder.order.state !== 'DRAFT' || d.storeOrder.order.buyerId === r.actor.id,
    );
  }
  private async locked(tx: UnitOfWork, r: ApiRequest, id = r.params.deliveryId!) {
    let d = await this.row(tx, id);
    await tx.$queryRaw`SELECT "id" FROM "MarketOrder" WHERE "id"=${d.storeOrder.orderId}::uuid FOR UPDATE`;
    d = await this.row(tx, id);
    await this.allowed(tx, d, r.actor);
    this.access.version(d.storeOrder.order, r.headers['if-match']);
    if (d.storeOrder.order.paused) fail('FUNDS_FROZEN');
    return d;
  }
  async requestPlatformDriver(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const o = await this.access.order(r.params.orderId!, r.actor, tx, true);
      this.access.seller(o, r.actor);
      this.access.version(o, r.headers['if-match']);
      if (o.state !== 'READY_FOR_DELIVERY' || o.paused) fail('INVALID_TRANSITION');
      const d = requireValue(o.storeOrder_order?.delivery_storeOrder);
      if (
        d.method !== 'PLATFORM_DRIVER' ||
        !['PENDING', 'EXCEPTION'].includes(d.status) ||
        (await tx.driverAssignment.findFirst({
          where: { deliveryId: d.id, status: { in: ['ASSIGNED', 'PICKED_UP'] } },
        }))
      )
        fail('INVALID_TRANSITION');
      const now = await this.life.deadlines.now(tx);
      await tx.delivery.update({
        where: { id: d.id },
        data: { status: 'REQUESTED', requestedAt: now },
      });
      await tx.deliveryEvent.create({
        data: {
          deliveryId: d.id,
          type: 'REQUESTED',
          actorId: r.actor.id,
          notes: 'Seller requested agreed platform delivery',
        },
      });
      const next = await this.life.changed(tx, o, o.state, r.actor.id, 'Platform driver requested');
      await this.life.deadlines.schedule(
        tx,
        o.id,
        'DISPATCH_ESCALATION',
        new Date(now.getTime() + 2 * 3600000),
        next.version,
      );
      return this.orders.action(o.id, tx);
    });
  }
  async listDriverJobs(r: ApiRequest) {
    const p = await this.access.profile(r.actor, 'DELIVERY_DRIVER'),
      zones = await this.db.driverZone.findMany({ where: { profileId: p.id } });
    const where: Prisma.DeliveryWhereInput = {
      method: 'PLATFORM_DRIVER',
      status: 'REQUESTED',
      storeOrder: { order: { state: 'READY_FOR_DELIVERY', paused: false } },
      driverAssignment_delivery: { none: { status: { in: ['ASSIGNED', 'PICKED_UP'] } } },
      OR: zones.map((z) => ({
        city: { governorateId: z.governorateId },
        ...(z.cityId ? { cityId: z.cityId } : {}),
      })),
    };
    return page(
      (await this.db.delivery.findMany({ where, include, ...pageArgs(r.query, r.actor.id) })).map(
        (d) => this.job(d),
      ),
      r.query,
      r.actor.id,
    );
  }
  private job(d: Row) {
    return {
      id: d.id,
      orderId: d.storeOrder.orderId,
      orderVersion: d.storeOrder.order.version,
      city: d.city,
      area: d.area,
      summary: 'Store goods ready for delivery',
      fee: money(d.currency, d.feeUnits),
      readyAt: d.requestedAt ?? d.createdAt,
    };
  }
  async listDriverAssignments(r: ApiRequest) {
    const p = requireValue(
      await this.db.businessProfile.findFirst({
        where: { userId: r.actor.id, type: 'DELIVERY_DRIVER' },
      }),
    );
    return page(
      (
        await this.db.delivery.findMany({
          where: { driverAssignment_delivery: { some: { driverId: p.id } } },
          include,
          ...pageArgs(r.query, r.actor.id),
        })
      ).map((d) => this.job(d)),
      r.query,
      r.actor.id,
    );
  }
  acceptDeliveryJob(r: ApiRequest) {
    return this.deliveryCommand(r, async (tx) => {
      const p = await this.access.profile(r.actor, 'DELIVERY_DRIVER', tx);
      await tx.$queryRaw`SELECT "id" FROM "BusinessProfile" WHERE "id"=${p.id}::uuid FOR UPDATE`;
      let d = await this.row(tx, r.params.deliveryId!);
      await tx.$queryRaw`SELECT "id" FROM "MarketOrder" WHERE "id"=${d.storeOrder.orderId}::uuid FOR UPDATE`;
      d = await this.row(tx, d.id);
      const o = d.storeOrder.order;
      this.access.version(o, r.headers['if-match']);
      if (
        o.paused ||
        o.state !== 'READY_FOR_DELIVERY' ||
        d.method !== 'PLATFORM_DRIVER' ||
        d.status !== 'REQUESTED' ||
        active(d) ||
        [o.buyerId, o.sellerProfile.userId].includes(r.actor.id)
      )
        fail('INVALID_TRANSITION');
      if (
        await tx.driverAssignment.findFirst({
          where: { driverId: p.id, status: { in: ['ASSIGNED', 'PICKED_UP'] } },
        })
      )
        fail('DRIVER_UNAVAILABLE');
      if (
        !(await tx.driverZone.findFirst({
          where: {
            profileId: p.id,
            governorateId: d.city.governorateId,
            OR: [{ cityId: null }, { cityId: d.cityId }],
          },
        }))
      )
        fail('FORBIDDEN', 403);
      const a = await tx.driverAssignment.create({ data: { deliveryId: d.id, driverId: p.id } });
      await tx.delivery.update({ where: { id: d.id }, data: { status: 'ASSIGNED' } });
      await tx.deliveryEvent.create({
        data: {
          deliveryId: d.id,
          assignmentId: a.id,
          type: 'ASSIGNED',
          actorId: r.actor.id,
          notes: 'Eligible driver accepted job',
        },
      });
      await this.life.changed(tx, o, o.state, r.actor.id, 'Driver assignment accepted');
      return this.dto(await this.row(tx, d.id));
    });
  }
  releaseDriverAssignment(r: ApiRequest) {
    return this.deliveryCommand(r, async (tx) => {
      const d = await this.locked(tx, r),
        a = active(d);
      if (!a || a.driver.userId !== r.actor.id) fail('FORBIDDEN', 403);
      if (a.status !== 'ASSIGNED') fail('INVALID_TRANSITION');
      const now = await this.life.deadlines.now(tx);
      await tx.driverAssignment.update({
        where: { id: a.id },
        data: { status: 'RELEASED', endedAt: now },
      });
      await tx.delivery.update({
        where: { id: d.id },
        data: { status: 'REQUESTED', requestedAt: now },
      });
      await tx.deliveryEvent.create({
        data: {
          deliveryId: d.id,
          assignmentId: a.id,
          type: 'RELEASED',
          actorId: r.actor.id,
          notes: r.body.reason,
        },
      });
      const next = await this.life.changed(
        tx,
        d.storeOrder.order,
        d.storeOrder.order.state,
        r.actor.id,
        r.body.reason,
      );
      await this.life.deadlines.schedule(
        tx,
        d.storeOrder.order.id,
        'DISPATCH_ESCALATION',
        new Date(now.getTime() + 2 * 3600000),
        next.version,
      );
      return this.dto(await this.row(tx, d.id));
    });
  }
  private executor(d: Row, actor: Actor) {
    const a = active(d);
    if (d.method === 'SELLER') {
      this.access.seller(d.storeOrder.order, actor);
      return undefined;
    }
    if (
      !a ||
      a.driver.userId !== actor.id ||
      !actor.roles.includes('DELIVERY_DRIVER') ||
      a.driver.status !== 'ACTIVE'
    )
      fail('FORBIDDEN', 403);
    return a;
  }
  private async event(tx: UnitOfWork, r: ApiRequest, type: 'PICKUP' | 'DROPOFF') {
    const d = await this.locked(tx, r),
      o = d.storeOrder.order,
      a = this.executor(d, r.actor);
    if (
      type === 'PICKUP'
        ? o.state !== 'READY_FOR_DELIVERY' || !['PENDING', 'ASSIGNED'].includes(d.status)
        : o.state !== 'OUT_FOR_DELIVERY' ||
          d.status !== 'PICKED_UP' ||
          (a && a.status !== 'PICKED_UP')
    )
      fail('INVALID_TRANSITION');
    const proof = r.body.proofFileId;
    if (proof) await this.access.cleanFiles([proof], r.actor, 'DELIVERY_ONLY', tx, o.id);
    const now = await this.life.deadlines.now(tx);
    await tx.deliveryEvent.create({
      data: {
        deliveryId: d.id,
        assignmentId: a?.id,
        actorId: r.actor.id,
        type,
        proofId: proof,
        verified: !!proof,
        notes: r.body.notes,
      },
    });
    if (type === 'PICKUP') {
      await this.stock.consume(tx, d.storeOrderId);
      await tx.delivery.update({ where: { id: d.id }, data: { status: 'PICKED_UP' } });
      if (a)
        await tx.driverAssignment.update({ where: { id: a.id }, data: { status: 'PICKED_UP' } });
      await this.life.changed(tx, o, 'OUT_FOR_DELIVERY', r.actor.id, 'Goods collected');
    } else {
      await tx.delivery.update({
        where: { id: d.id },
        data: { status: 'DROPPED_OFF', droppedOffAt: now },
      });
      if (a)
        await tx.driverAssignment.update({
          where: { id: a.id },
          data: { status: 'COMPLETED', endedAt: now },
        });
      const deadline = new Date(now.getTime() + 72 * 3600000);
      await tx.marketOrder.update({
        where: { id: o.id },
        data: {
          deliveredAt: now,
          reviewDeadlineAt: deadline,
          deliveryVersion: { increment: 1 },
          deliveryVerified: !!proof,
        },
      });
      const next = await this.life.changed(
        tx,
        o,
        'DELIVERED',
        r.actor.id,
        'Goods handed over; buyer review opened',
      );
      await this.life.deadlines.schedule(
        tx,
        o.id,
        'DELIVERY_REVIEW',
        deadline,
        next.deliveryVersion,
      );
    }
    return this.dto(await this.row(tx, d.id));
  }
  recordPickup(r: ApiRequest) {
    return this.deliveryCommand(r, (tx) => this.event(tx, r, 'PICKUP'));
  }
  recordDropoff(r: ApiRequest) {
    return this.deliveryCommand(r, (tx) => this.event(tx, r, 'DROPOFF'));
  }
  reportDeliveryException(r: ApiRequest) {
    return this.deliveryCommand(r, async (tx) => {
      const d = await this.locked(tx, r),
        o = d.storeOrder.order;
      if (
        !['PREPARING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERY_EXCEPTION'].includes(
          o.state,
        )
      )
        fail('INVALID_TRANSITION');
      if (![o.buyerId, o.sellerProfile.userId, active(d)?.driver.userId].includes(r.actor.id))
        fail('FORBIDDEN', 403);
      await this.access.cleanFiles(r.body.evidenceFileIds, r.actor, 'DELIVERY_ONLY', tx, o.id);
      await tx.delivery.update({ where: { id: d.id }, data: { status: 'EXCEPTION' } });
      await tx.deliveryEvent.create({
        data: {
          deliveryId: d.id,
          assignmentId: active(d)?.id,
          type: 'EXCEPTION',
          actorId: r.actor.id,
          notes: `${r.body.kind}: ${r.body.reason}`,
          proofId: r.body.evidenceFileIds[0],
        },
      });
      await this.life.changed(tx, o, 'DELIVERY_EXCEPTION', r.actor.id, r.body.reason);
      if (['CUSTODY', 'LOST_GOODS'].includes(r.body.kind)) {
        const current = requireValue(
          await tx.marketOrder.findUnique({ where: { id: o.id }, include: orderInclude }),
        );
        await this.cases.open(tx, current, 'DELIVERY_REVIEW', r.body.reason, r.actor.id);
      }
      return this.dto(await this.row(tx, d.id));
    });
  }
  proposeDeliveryTerms(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const d = await this.locked(tx, r),
        o = d.storeOrder.order;
      this.access.seller(o, r.actor);
      if (!['PREPARING', 'READY_FOR_DELIVERY', 'DELIVERY_EXCEPTION'].includes(o.state) || active(d))
        fail('INVALID_TRANSITION');
      const now = await this.life.deadlines.now(tx);
      if (new Date(r.body.promisedAt) <= now) fail('INVALID_INPUT', 400);
      const { selected } = await this.shipping.selected(
        tx,
        d.storeOrder.storefrontId,
        d.cityId,
        d.areaId,
        d.currency,
        r.body.method,
      );
      const last = await tx.deliveryTermsRevision.findFirst({
        where: { deliveryId: d.id },
        orderBy: { version: 'desc' },
      });
      const v = await tx.deliveryTermsRevision.create({
        data: {
          deliveryId: d.id,
          proposedById: r.actor.id,
          version: Math.max(last?.version ?? 1, d.termsVersion) + 1,
          method: r.body.method,
          currency: d.currency,
          feeUnits: selected.rate.feeUnits,
          previousFeeUnits: d.feeUnits,
          promisedAt: new Date(r.body.promisedAt),
          reason: r.body.reason,
        },
      });
      await this.life.changed(
        tx,
        o,
        o.state,
        r.actor.id,
        'Buyer approval requested for changed delivery terms',
      );
      return { ...v, fee: money(v.currency, v.feeUnits) };
    });
  }
  approveDeliveryTerms(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const d = await this.locked(tx, r);
      this.access.buyer(d.storeOrder.order, r.actor);
      const revision = requireValue(
          await tx.deliveryTermsRevision.findFirst({
            where: { id: r.params.revisionId, deliveryId: d.id },
          }),
        ),
        last = await tx.deliveryTermsRevision.findFirst({
          where: { deliveryId: d.id },
          orderBy: { version: 'desc' },
        });
      if (last?.id !== revision.id) fail('VERSION_CONFLICT');
      const result = await this.finance.applyDeliveryTermsInTransaction(
        tx,
        revision.id,
        r.actor.id,
      );
      await this.life.changed(
        tx,
        d.storeOrder.order,
        d.storeOrder.order.state,
        r.actor.id,
        'Buyer approved delivery terms and exact fee delta',
      );
      return this.orders.action(d.storeOrder.orderId, tx, result);
    });
  }
  chooseDeliveryFallback(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const d = await this.locked(tx, r),
        o = d.storeOrder.order;
      this.access.seller(o, r.actor);
      if (!['READY_FOR_DELIVERY', 'DELIVERY_EXCEPTION'].includes(o.state) || active(d))
        fail('INVALID_TRANSITION');
      if (r.body.choice === 'UNFULFILLABLE_REFUND') {
        const result = await this.finance.refundUncontestedInTransaction(tx, {
          orderId: o.id,
          actorId: r.actor.id,
          mode: 'UNFULFILLABLE',
          reason: r.body.reason,
        });
        return this.orders.action(o.id, tx, { settlementId: result.id });
      }
      if (r.body.choice === 'SELLER_SAME_TERMS') {
        await tx.delivery.update({
          where: { id: d.id },
          data: { method: 'SELLER', status: 'PENDING' },
        });
      } else {
        const rev = requireValue(
          await tx.deliveryTermsRevision.findFirst({
            where: {
              id: r.body.termsRevisionId,
              deliveryId: d.id,
              appliedAt: { not: null },
              version: d.termsVersion,
            },
          }),
        );
        if (rev.promisedAt <= (await this.life.deadlines.now(tx))) fail('DEADLINE_EXPIRED');
        await tx.delivery.update({ where: { id: d.id }, data: { status: 'PENDING' } });
      }
      await this.life.changed(tx, o, 'READY_FOR_DELIVERY', r.actor.id, r.body.reason);
      return this.orders.action(o.id, tx);
    });
  }
}
