import { Injectable } from '@nestjs/common';
import { ApiRequest } from '../../common/actor';
import { AccessService } from '../../common/access.service';
import { CommandsService, jsonValue } from '../../common/commands.service';
import { fail, requireValue } from '../../common/errors';
import { CatalogService } from '../catalog/catalog.service';
import { GeographyService } from '../geography/geography.service';
import { OrderLifecycle } from '../orders/order-lifecycle.service';
import { OrdersQueryService } from '../orders/orders-query.service';
import { SchedulingService } from '../scheduling/scheduling.service';
import { beforeDeadline } from '../orders/domain/order-state-machine';
@Injectable()
export class BookingsService {
  constructor(
    private readonly commands: CommandsService,
    private readonly access: AccessService,
    private readonly catalog: CatalogService,
    private readonly geography: GeographyService,
    private readonly lifecycle: OrderLifecycle,
    private readonly orders: OrdersQueryService,
    private readonly scheduling: SchedulingService,
  ) {}
  async createBooking(r: ApiRequest) {
    const offer = await this.catalog.read(r.body.listingId);
    return this.commands.run(
      r,
      async (tx) => {
        const l = await this.catalog.read(offer.id, tx);
        if (l.kind !== 'PROFESSIONAL_PACKAGE' || !l.durationMinutes) fail('INVALID_INPUT', 400);
        const address = await this.geography.ownedAddress(r.body.addressId, r.actor.id, tx);
        await this.geography.serviceable(l.profileId, address.cityId, address.areaId, tx);
        const now = await this.lifecycle.deadlines.now(tx),
          start = new Date(r.body.startsAt),
          end = new Date(start.getTime() + l.durationMinutes * 60000);
        this.scheduling.validate(start, end, now);
        const result = await this.lifecycle.initialize(tx, r.actor, {
          sellerProfileId: l.profileId,
          sellerUserId: l.profile.userId,
          workspace: 'PROFESSIONALS',
          state: 'BOOKING_REQUESTED',
          currency: l.currency,
          total: l.priceUnits,
          scope: r.body.description ?? l.titleEn,
          listingId: l.id,
          kind: 'FIXED_BOOKING',
          dueAt: end,
          addressSnapshot: jsonValue(address) as any,
        });
        await tx.booking.create({
          data: {
            serviceOrderId: result.service.id,
            requestedStartsAt: start,
            requestedEndsAt: end,
          },
        });
        return this.orders.read(result.order.id, tx);
      },
      [offer.profile.userId],
    );
  }
  acceptBooking(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const o = await this.access.order(r.params.orderId!, r.actor, tx, true);
      this.access.version(o, r.headers['if-match']);
      this.access.seller(o, r.actor);
      const s = requireValue(o.serviceOrder_order),
        b = requireValue(s.booking_serviceOrder),
        now = await this.lifecycle.deadlines.now(tx);
      if (o.state !== 'BOOKING_REQUESTED') fail('INVALID_TRANSITION');
      beforeDeadline(now, s.responseDeadlineAt);
      this.scheduling.validate(b.requestedStartsAt, b.requestedEndsAt, now);
      await this.scheduling.reserve(
        tx,
        s.id,
        o.sellerProfileId,
        b.requestedStartsAt,
        b.requestedEndsAt,
      );
      await tx.booking.update({
        where: { id: b.id },
        data: { state: 'CONFIRMED', providerAcceptedAt: now, buyerAcceptedAt: now },
      });
      await this.lifecycle.awaitDeposit(tx, o, s.id, r.actor.id);
      return this.orders.action(o.id, tx);
    });
  }
  proposeSchedule(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const o = await this.access.order(r.params.orderId!, r.actor, tx, true);
      this.access.version(o, r.headers['if-match']);
      this.access.seller(o, r.actor);
      const s = requireValue(o.serviceOrder_order),
        b = requireValue(s.booking_serviceOrder),
        now = await this.lifecycle.deadlines.now(tx);
      if (!['BOOKING_REQUESTED', 'SCHEDULE_PROPOSED'].includes(o.state)) fail('INVALID_TRANSITION');
      beforeDeadline(now, s.responseDeadlineAt);
      const start = new Date(r.body.startsAt),
        end = new Date(
          start.getTime() + b.requestedEndsAt.getTime() - b.requestedStartsAt.getTime(),
        ),
        deadline = new Date(now.getTime() + 72 * 3600000);
      this.scheduling.validate(start, end, now);
      await tx.booking.update({
        where: { id: b.id },
        data: {
          state: 'COUNTER_PROPOSED',
          proposedStartsAt: start,
          proposedEndsAt: end,
          providerAcceptedAt: now,
          buyerAcceptedAt: null,
        },
      });
      await tx.serviceOrder.update({ where: { id: s.id }, data: { responseDeadlineAt: deadline } });
      const next = await this.lifecycle.changed(
        tx,
        o,
        'SCHEDULE_PROPOSED',
        r.actor.id,
        r.body.reason ?? 'Alternative schedule proposed',
      );
      await this.lifecycle.deadlines.schedule(tx, o.id, 'RESPONSE_EXPIRY', deadline, next.version);
      return this.orders.action(o.id, tx);
    });
  }
  acceptSchedule(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const o = await this.access.order(r.params.orderId!, r.actor, tx, true);
      this.access.version(o, r.headers['if-match']);
      this.access.buyer(o, r.actor);
      const s = requireValue(o.serviceOrder_order),
        b = requireValue(s.booking_serviceOrder),
        now = await this.lifecycle.deadlines.now(tx);
      if (o.state !== 'SCHEDULE_PROPOSED' || !b.proposedStartsAt || !b.proposedEndsAt)
        fail('INVALID_TRANSITION');
      beforeDeadline(now, s.responseDeadlineAt);
      this.scheduling.validate(b.proposedStartsAt, b.proposedEndsAt, now);
      await this.scheduling.reserve(
        tx,
        s.id,
        o.sellerProfileId,
        b.proposedStartsAt,
        b.proposedEndsAt,
      );
      await tx.booking.update({
        where: { id: b.id },
        data: { state: 'CONFIRMED', buyerAcceptedAt: now },
      });
      await tx.serviceOrder.update({ where: { id: s.id }, data: { dueAt: b.proposedEndsAt } });
      await this.lifecycle.awaitDeposit(tx, o, s.id, r.actor.id);
      return this.orders.action(o.id, tx);
    });
  }
}
