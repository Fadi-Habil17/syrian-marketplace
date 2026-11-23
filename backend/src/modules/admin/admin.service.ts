import { EscrowModule, EscrowService } from '../escrow/escrow.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiRequest } from '../../common/actor';
import { AccessService, orderInclude } from '../../common/access.service';
import { CommandsService } from '../../common/commands.service';
import { fail, requireValue } from '../../common/errors';
import { page, pageArgs } from '../../common/pagination';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CaseAccess, caseInclude } from '../disputes/case-access.service';
import { CaseLifecycle } from '../disputes/case-lifecycle.service';
import { OrderLifecycle } from '../orders/order-lifecycle.service';
import { OrdersQueryService } from '../orders/orders-query.service';
import { MarketplaceFinance } from '../payments/application/marketplace-finance';
import { CommissionRates } from '../payments/rates.service';
import { DeliveryConfig } from '../delivery/delivery-config.service';
import { CatalogService } from '../catalog/catalog.service';
import { StoresService } from '../stores/stores.service';
import { ProductsService } from '../products/products.service';
import { ProfilesService } from '../profiles/profiles.service';
import { ReviewsService } from '../reviews/reviews.service';
@Injectable()
export class AdminService {
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
    private readonly commission: CommissionRates,
    private readonly shipping: DeliveryConfig,
    private readonly catalog: CatalogService,
    private readonly stores: StoresService,
    private readonly products: ProductsService,
    private readonly profiles: ProfilesService,
    private readonly reviews: ReviewsService,
  ) {}
  async listAuditHistory(r: ApiRequest) {
    return page(
      await this.db.auditRecord.findMany(pageArgs(r.query, 'admin:audit')),
      r.query,
      'admin:audit',
    );
  }
  async listAdminCases(r: ApiRequest) {
    return page(
      (
        await this.db.caseRecord.findMany({
          include: caseInclude,
          ...pageArgs(r.query, 'admin:cases'),
        })
      ).map((c) => ({
        ...this.cases.dto(c, r.actor),
        evidence: c.handlingAdminId === r.actor.id ? this.cases.dto(c, r.actor).evidence : [],
      })),
      r.query,
      'admin:cases',
    );
  }
  async listCommissionRates(r: ApiRequest) {
    return page(
      await this.db.commissionRate.findMany(pageArgs(r.query, 'admin:commission')),
      r.query,
      'admin:commission',
    );
  }
  configureCommission(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const rate = await this.commission.configure(
        tx,
        r.actor.id,
        r.body.workspace,
        r.body.basisPoints,
      );
      await this.commands.audit(tx, r.actor.id, rate.id, 'commission.configured', {
        workspace: rate.workspace,
        basisPoints: rate.basisPoints,
        version: rate.version,
      });
      return rate;
    });
  }
  async listDeliveryRates(r: ApiRequest) {
    return page(
      await this.db.deliveryRate.findMany(pageArgs(r.query, 'admin:rates')),
      r.query,
      'admin:rates',
    );
  }
  configureDeliveryRate(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const rate = await this.shipping.rate(tx, r.actor.id, r.body);
      await this.commands.audit(tx, r.actor.id, rate.id, 'delivery.rate.configured', {
        feeUnits: rate.feeUnits.toString(),
        currency: rate.currency,
        version: rate.version,
      });
      return rate;
    });
  }
  async listDriverZones(r: ApiRequest) {
    return page(
      (await this.db.driverZone.findMany(pageArgs(r.query, 'admin:zones'))).map((z) => ({
        ...z,
        driverProfileId: z.profileId,
      })),
      r.query,
      'admin:zones',
    );
  }
  assignDriverZone(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const z = await this.shipping.zone(tx, r.body);
      await this.commands.audit(tx, r.actor.id, z.id, 'driver.zone.assigned', {
        profileId: z.profileId,
      });
      return { ...z, driverProfileId: z.profileId };
    });
  }
  removeDriverZone(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const z = await this.shipping.remove(tx, r.params.zoneId!);
      await this.commands.audit(tx, r.actor.id, z.id, 'driver.zone.removed');
    });
  }
  async listModerationQueue(r: ApiRequest) {
    const args = pageArgs(r.query, 'admin:moderation'),
      cursor = args.cursor?.id;
    const all = Prisma.sql`(SELECT "id",'PROFILE' AS "resourceType","status"::text,"createdAt" FROM "BusinessProfile" UNION ALL SELECT "id",'LISTING',"status"::text,"createdAt" FROM "Listing" UNION ALL SELECT "id",'STORE',"status"::text,"createdAt" FROM "Storefront" UNION ALL SELECT "id",'PRODUCT',"status"::text,"createdAt" FROM "Product" UNION ALL SELECT "id",'REVIEW',CASE WHEN "hidden" THEN 'HIDDEN' ELSE 'VISIBLE' END,"createdAt" FROM "Review")`;
    const rows = await this.db.$queryRaw<
      { id: string; resourceType: string; status: string; createdAt: Date }[]
    >(
      Prisma.sql`WITH resources AS ${all} SELECT * FROM resources ${cursor ? Prisma.sql`WHERE ("createdAt","id") < (SELECT "createdAt","id" FROM resources WHERE "id"=${cursor}::uuid)` : Prisma.empty} ORDER BY "createdAt" DESC,"id" DESC LIMIT ${args.take}`,
    );
    const items = [];
    for (const x of rows) {
      const owner =
        x.resourceType === 'PROFILE'
          ? this.profiles
          : x.resourceType === 'LISTING'
            ? this.catalog
            : x.resourceType === 'STORE'
              ? this.stores
              : x.resourceType === 'PRODUCT'
                ? this.products
                : this.reviews;
      items.push({ ...x, resourceId: x.id, content: await owner.inspect(this.db, x.id) });
    }
    await this.commands.audit(this.db, r.actor.id, r.actor.id, 'admin.moderation.read', {
      resourceIds: items.map((i) => i.id),
    });
    return page(items, r.query, 'admin:moderation');
  }

  moderateResource(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const id = r.params.resourceId!,
        outcome = r.body.outcome;
      let type: string, field: string, row: any;
      if (await tx.listing.findUnique({ where: { id } })) {
        type = 'LISTING';
        field = 'listingId';
        row = await this.catalog.moderate(tx, id, outcome);
      } else if (await tx.storefront.findUnique({ where: { id } })) {
        type = 'STORE';
        field = 'storefrontId';
        row = await this.stores.moderate(tx, id, outcome);
      } else if (await tx.product.findUnique({ where: { id } })) {
        type = 'PRODUCT';
        field = 'productId';
        row = await this.products.moderate(tx, id, outcome);
      } else if (await tx.businessProfile.findUnique({ where: { id } })) {
        type = 'PROFILE';
        field = 'profileId';
        row = await this.profiles.moderate(tx, id, outcome);
      } else if (await tx.review.findUnique({ where: { id } })) {
        type = 'REVIEW';
        field = 'reviewId';
        row = await this.reviews.moderate(tx, id, outcome);
      } else fail('NOT_FOUND', 404);
      if (type === 'PROFILE' && ['HIDE', 'REJECT'].includes(outcome)) {
        const orders = await tx.marketOrder.findMany({
          where: {
            sellerProfileId: id,
            escrow_order: { heldUnits: { gt: 0 } },
            settlement_order: null,
          },
          include: orderInclude,
        });
        for (const o of orders)
          await this.caseLife.open(
            tx,
            o,
            'DISPUTE',
            'Business profile suspended: ' + r.body.reason,
            r.actor.id,
          );
      }
      await tx.moderationDecision.create({
        data: { adminId: r.actor.id, outcome, reason: r.body.reason, [field]: id },
      });
      await this.commands.audit(tx, r.actor.id, id, 'moderation.' + outcome.toLowerCase(), {
        resourceType: type,
        reason: r.body.reason,
      });
      return {
        id,
        resourceId: id,
        resourceType: type,
        status: row.status ?? (['HIDE', 'REJECT'].includes(outcome) ? 'HIDDEN' : 'VISIBLE'),
        createdAt: row.createdAt,
      };
    });
  }
  moderateReview(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const id = r.params.reviewId!,
        result = await this.reviews.moderate(tx, id, r.body.outcome);
      await tx.moderationDecision.create({
        data: { adminId: r.actor.id, reviewId: id, ...r.body },
      });
      await this.commands.audit(tx, r.actor.id, id, 'review.moderated', {
        outcome: r.body.outcome,
        reason: r.body.reason,
      });
      return result;
    });
  }
  restrictAccount(r: ApiRequest) {
    return this.commands.run(
      r,
      async (tx) => {
        const id = r.params.userId!;
        requireValue(await tx.user.findUnique({ where: { id } }));
        if (id === r.actor.id) fail('FORBIDDEN', 403);
        if (r.body.expiresAt && new Date(r.body.expiresAt) <= new Date())
          fail('INVALID_INPUT', 400);
        const result = await tx.restriction.create({
          data: {
            userId: id,
            adminId: r.actor.id,
            kind: r.body.kind,
            reason: r.body.reason,
            expiresAt: r.body.expiresAt ? new Date(r.body.expiresAt) : null,
          },
        });
        if (result.kind === 'SUSPENSION') {
          const orders = await tx.marketOrder.findMany({
            where: {
              OR: [
                { buyerId: id },
                { sellerProfile: { userId: id } },
                {
                  storeOrder_order: {
                    delivery_storeOrder: {
                      driverAssignment_delivery: {
                        some: {
                          driver: { userId: id },
                          status: { in: ['ASSIGNED', 'PICKED_UP', 'COMPLETED'] },
                        },
                      },
                    },
                  },
                },
              ],
              escrow_order: { heldUnits: { gt: 0 } },
              settlement_order: null,
            },
            include: orderInclude,
            orderBy: { id: 'asc' },
          });
          for (const o of orders)
            await this.caseLife.open(
              tx,
              o,
              'DISPUTE',
              'Account suspension requires controlled review: ' + r.body.reason,
              r.actor.id,
            );
        }
        await this.commands.audit(tx, r.actor.id, id, 'account.restricted', {
          restrictionId: result.id,
          kind: result.kind,
          reason: result.reason,
        });
        return result;
      },
      [r.params.userId!],
    );
  }
  revokeRestriction(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const row = requireValue(
        await tx.restriction.findUnique({ where: { id: r.params.restrictionId } }),
      );
      const result = row.revokedAt
        ? row
        : await tx.restriction.update({ where: { id: row.id }, data: { revokedAt: new Date() } });
      await this.commands.audit(tx, r.actor.id, row.userId, 'account.restriction.revoked', {
        restrictionId: row.id,
        reason: r.body.reason,
      });
      return result;
    });
  }
  assignAdminCase(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const c = requireValue(await tx.caseRecord.findUnique({ where: { id: r.params.caseId } }));
      if (c.handlingAdminId && c.handlingAdminId !== r.actor.id) fail('FORBIDDEN', 403);
      if (c.status === 'RESOLVED') fail('INVALID_TRANSITION');
      await tx.caseRecord.update({ where: { id: c.id }, data: { handlingAdminId: r.actor.id } });
      await this.commands.audit(tx, r.actor.id, c.id, 'case.assigned', { reason: r.body.reason });
      return this.cases.dto(await this.cases.read(tx, c.id, r.actor), r.actor);
    });
  }
  resolveAdminCase(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const c = await this.cases.read(tx, r.params.caseId!, r.actor),
        o = await this.access.order(c.orderId, r.actor, tx, true);
      if (c.handlingAdminId !== r.actor.id) fail('FORBIDDEN', 403);
      this.access.version(o, r.headers['if-match']);
      if (c.kind === 'SUPPORT') {
        if (
          o.paused ||
          [r.body.sellerAwardUnits, r.body.sellerDeliveryUnits, r.body.driverAwardUnits].some(
            (n) => BigInt(n) !== 0n,
          )
        )
          fail('INVALID_ALLOCATION', 400);
        await tx.caseRecord.update({
          where: { id: c.id },
          data: { status: 'RESOLVED', resolvedAt: new Date() },
        });
        await this.commands.audit(tx, r.actor.id, c.id, 'support.resolved', {
          reason: r.body.reason,
          substantiation: r.body.substantiation,
        });
        return this.orders.action(o.id, tx, { caseId: c.id });
      }
      let driverUserId: string | undefined;
      if (BigInt(r.body.driverAwardUnits) > 0n) {
        if (!r.body.driverAssignmentId) fail('INVALID_INPUT', 400);
        const a = requireValue(
          await tx.driverAssignment.findFirst({
            where: { id: r.body.driverAssignmentId, delivery: { storeOrder: { orderId: o.id } } },
            include: { driver: true },
          }),
        );
        driverUserId = a.driver.userId;
      }
      const receipt = await this.finance.resolveDisputeInTransaction(tx, {
        ...r.body,
        orderId: o.id,
        caseId: c.id,
        actorId: r.actor.id,
        expectedVersion: o.version,
        idempotencyKey: String(r.headers['idempotency-key']),
        sellerAwardUnits: BigInt(r.body.sellerAwardUnits),
        sellerDeliveryUnits: BigInt(r.body.sellerDeliveryUnits),
        driverAwardUnits: BigInt(r.body.driverAwardUnits),
        driverUserId,
      });
      return this.orders.action(o.id, tx, { caseId: c.id, settlementId: receipt.id });
    });
  }
  resumeOverdueFinalPayment(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const c = await this.cases.read(tx, r.params.caseId!, r.actor),
        o = await this.access.order(c.orderId, r.actor, tx, true);
      this.access.version(o, r.headers['if-match']);
      if (
        c.handlingAdminId !== r.actor.id ||
        c.kind !== 'FINAL_PAYMENT_OVERDUE' ||
        !['OPEN', 'ADMIN_REVIEW'].includes(c.status) ||
        !o.serviceOrder_order ||
        o.state !== 'FINAL_PAYMENT_OVERDUE' ||
        (await tx.settlement.findUnique({ where: { orderId: o.id } }))
      )
        fail('INVALID_TRANSITION');
      const p = requireValue(
          await tx.resolutionProposal.findFirst({
            where: { caseId: c.id, kind: 'EXTENSION' },
            orderBy: { version: 'desc' },
            include: { proposalApproval_proposal: true },
          }),
        ),
        now = await this.life.deadlines.now(tx),
        deadline = new Date(r.body.dueAt);
      if (
        !p.newDueAt ||
        p.newDueAt.getTime() !== deadline.getTime() ||
        deadline <= now ||
        deadline.getTime() > now.getTime() + 72 * 3600000 ||
        p.agreementDeadlineAt <= now ||
        p.proposalApproval_proposal.length !== 2 ||
        p.proposalApproval_proposal.some((a) => a.decision !== 'ACCEPT')
      )
        fail('AGREEMENT_REQUIRED');
      await tx.caseRecord.update({
        where: { id: c.id },
        data: { status: 'RESOLVED', resolvedAt: now },
      });
      await this.escrow.status(tx, o.id, 'OPEN');
      await tx.marketOrder.update({ where: { id: o.id }, data: { paused: false } });
      await tx.serviceOrder.update({
        where: { id: o.serviceOrder_order.id },
        data: { balanceDeadlineAt: deadline, balanceResumedAt: now, balanceResumptionCaseId: c.id },
      });
      const next = await this.life.changed(
        tx,
        o,
        'READY_FOR_FINAL_PAYMENT',
        r.actor.id,
        r.body.reason,
      );
      await this.life.deadlines.schedule(tx, o.id, 'BALANCE_EXPIRY', deadline, next.version);
      for (const [hours, kind] of [
        [24, 'BALANCE_REMINDER_24'],
        [48, 'BALANCE_REMINDER_48'],
      ] as const) {
        const at = new Date(now.getTime() + hours * 3600000);
        if (at < deadline) await this.life.deadlines.schedule(tx, o.id, kind, at, next.version);
      }
      return this.orders.action(o.id, tx, { caseId: c.id });
    });
  }
}
