import { Injectable } from '@nestjs/common';
import { ApiRequest } from '../../common/actor';
import { AccessService } from '../../common/access.service';
import { CommandsService, jsonValue } from '../../common/commands.service';
import { fail, requireValue } from '../../common/errors';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { GeographyService } from '../geography/geography.service';
import { ShippingPolicy } from '../delivery/shipping-policy.service';
import { OrdersQueryService } from '../orders/orders-query.service';
import { OrderLifecycle } from '../orders/order-lifecycle.service';
@Injectable()
export class CheckoutService {
  constructor(
    private readonly db: PrismaService,
    private readonly commands: CommandsService,
    private readonly access: AccessService,
    private readonly geo: GeographyService,
    private readonly shipping: ShippingPolicy,
    private readonly orders: OrdersQueryService,
    private readonly life: OrderLifecycle,
  ) {}
  async getDeliveryOptions(r: ApiRequest) {
    const a = await this.geo.ownedAddress(r.query.addressId as string, r.actor.id);
    const result = await this.shipping.options(
      this.db,
      r.query.storeId as string,
      a.cityId,
      a.areaId,
      r.query.currency as any,
    );
    return { serviceable: result.methods.length > 0, cityId: a.cityId, methods: result.methods };
  }
  async previewStoreCheckout(r: ApiRequest) {
    const seller = requireValue(
      await this.db.storefront.findUnique({
        where: { id: r.body.storeId },
        include: { profile: true },
      }),
    );
    return this.commands.run(
      r,
      async (tx) => {
        if (r.actor.id === seller.profile.userId) fail('INVALID_INPUT', 400);
        if (r.actor.restrictions.includes('PURCHASING')) fail('ACCOUNT_RESTRICTED', 403);
        const b = r.body,
          a = await this.geo.ownedAddress(b.addressId, r.actor.id, tx);
        if (new Set(b.items.map((i: any) => i.productId)).size !== b.items.length)
          fail('INVALID_INPUT', 400);
        const products = await tx.product.findMany({
          where: {
            id: { in: b.items.map((i: any) => i.productId) },
            storefrontId: b.storeId,
            status: 'PUBLISHED',
          },
        });
        if (products.length !== b.items.length) fail('NOT_FOUND', 404);
        const currency = products[0]!.currency;
        if (products.some((p) => p.currency !== currency)) fail('CURRENCY_MISMATCH', 422);
        let subtotal = 0n;
        const items = b.items.map((i: any) => {
          const p = products.find((p) => p.id === i.productId)!;
          if (p.stockOnHand - p.stockReserved < i.quantity) fail('STOCK_UNAVAILABLE');
          subtotal += p.priceUnits * BigInt(i.quantity);
          return {
            productId: p.id,
            quantity: i.quantity,
            unitPriceUnits: p.priceUnits,
            currency,
            productSnapshot: { titleAr: p.titleAr, titleEn: p.titleEn },
          };
        });
        const { selected, methods } = await this.shipping.selected(
            tx,
            b.storeId,
            a.cityId,
            a.areaId,
            currency,
            b.method,
          ),
          now = await this.life.deadlines.now(tx),
          expiresAt = new Date(now.getTime() + 15 * 60000),
          fee = selected.rate.feeUnits;
        if (subtotal < 1n || subtotal + fee > 9000000000000n) fail('INVALID_INPUT', 400);
        const o = await tx.marketOrder.create({
          data: {
            workspace: 'HOME_STORE',
            state: 'DRAFT',
            currency,
            buyerId: r.actor.id,
            sellerProfileId: seller.profileId,
            agreedTotalUnits: subtotal + fee,
            eligibleSellerUnits: subtotal,
            deliveryFeeUnits: fee,
            checkoutExpiresAt: expiresAt,
            agreementSnapshot: {
              scope: 'Store purchase: immutable product and delivery snapshots',
            },
            addressSnapshot: jsonValue(a),
          },
        });
        const store = await tx.storeOrder.create({
          data: { orderId: o.id, storefrontId: b.storeId, orderItem_storeOrder: { create: items } },
        });
        await tx.delivery.create({
          data: {
            storeOrderId: store.id,
            method: b.method,
            currency,
            feeUnits: fee,
            rateId: selected.rate.id,
            cityId: a.cityId,
            areaId: a.areaId,
            termsSnapshot: {
              method: b.method,
              promisedAt: selected.promisedAt.toISOString(),
              feeUnits: fee.toString(),
              rateId: selected.rate.id,
            },
          },
        });
        await this.life.escrowAndRooms(tx, o.id, currency, true);
        await this.life.created(
          tx,
          o,
          r.actor.id,
          'Server priced checkout preview; no funds or stock held',
        );
        return {
          order: await this.orders.read(o.id, tx),
          expiresAt,
          serviceable: true,
          options: methods,
          termsText:
            'Simulated payment. Full item price and agreed delivery fee are held at checkout. Seller acceptance is required within 24 hours.',
        };
      },
      [seller.profile.userId],
    );
  }
}
