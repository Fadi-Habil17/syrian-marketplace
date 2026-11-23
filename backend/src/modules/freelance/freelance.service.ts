import { Injectable } from '@nestjs/common';
import { ApiRequest } from '../../common/actor';
import { AccessService } from '../../common/access.service';
import { CommandsService } from '../../common/commands.service';
import { fail, requireValue } from '../../common/errors';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CatalogService } from '../catalog/catalog.service';
import { OrderLifecycle } from '../orders/order-lifecycle.service';
import { OrdersQueryService } from '../orders/orders-query.service';
import { beforeDeadline } from '../orders/domain/order-state-machine';
@Injectable()
export class FreelanceService {
  constructor(
    private readonly db: PrismaService,
    private readonly commands: CommandsService,
    private readonly access: AccessService,
    private readonly catalog: CatalogService,
    private readonly lifecycle: OrderLifecycle,
    private readonly orders: OrdersQueryService,
  ) {}
  async createFreelanceOrder(r: ApiRequest) {
    const offer = await this.catalog.read(r.body.listingId);
    return this.commands.run(
      r,
      async (tx) => {
        const listing = await this.catalog.read(offer.id, tx);
        if (listing.kind !== 'FREELANCE') fail('INVALID_INPUT', 400);
        const now = await this.lifecycle.deadlines.now(tx),
          dueAt = new Date(now.getTime() + listing.deliveryDays! * 86400000),
          created = await this.lifecycle.initialize(tx, r.actor, {
            sellerProfileId: listing.profileId,
            sellerUserId: listing.profile.userId,
            workspace: 'FREELANCE',
            state: 'AWAITING_AGREEMENT',
            currency: listing.currency,
            total: listing.priceUnits,
            scope: r.body.description,
            listingId: listing.id,
            kind: 'FREELANCE',
            dueAt,
          });
        return this.orders.read(created.order.id, tx);
      },
      [offer.profile.userId],
    );
  }
  agreeOrder(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const o = await this.access.order(r.params.orderId!, r.actor, tx, true);
      this.access.version(o, r.headers['if-match']);
      if (
        o.workspace !== 'FREELANCE' ||
        o.state !== 'AWAITING_AGREEMENT' ||
        ![o.buyerId, o.sellerProfile.userId].includes(r.actor.id)
      )
        fail('INVALID_TRANSITION');
      const s = requireValue(o.serviceOrder_order),
        now = await this.lifecycle.deadlines.now(tx);
      beforeDeadline(now, s.responseDeadlineAt);
      const due = new Date(r.body.dueAt);
      if (due <= now) fail('INVALID_INPUT', 400);
      const snapshot = o.agreementSnapshot as Record<string, any>,
        old = snapshot.proposal,
        matching = old?.scope === r.body.scope && old?.dueAt === due.toISOString();
      const proposal = {
        scope: r.body.scope,
        dueAt: due.toISOString(),
        approvedBy: [...new Set<string>([...(matching ? old.approvedBy : []), r.actor.id])],
      };
      if (
        proposal.approvedBy.includes(o.buyerId) &&
        proposal.approvedBy.includes(o.sellerProfile.userId)
      ) {
        await tx.marketOrder.update({
          where: { id: o.id },
          data: { agreementSnapshot: { ...snapshot, scope: proposal.scope, proposal } },
        });
        await tx.serviceOrder.update({ where: { id: s.id }, data: { dueAt: due } });
        await this.lifecycle.awaitDeposit(tx, o, s.id, r.actor.id);
      } else {
        await tx.marketOrder.update({
          where: { id: o.id },
          data: { agreementSnapshot: { ...snapshot, proposal } },
        });
        await this.lifecycle.changed(
          tx,
          o,
          o.state,
          r.actor.id,
          'Scope and due-date proposal awaiting other participant',
        );
      }
      return this.orders.action(o.id, tx);
    });
  }
}
