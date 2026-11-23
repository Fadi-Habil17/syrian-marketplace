import { Injectable } from '@nestjs/common';
import { ApiRequest } from '../../common/actor';
import { AccessService } from '../../common/access.service';
import { CommandsService } from '../../common/commands.service';
import { DomainError, fail, requireValue } from '../../common/errors';
import { ShippingPolicy } from '../delivery/shipping-policy.service';
import { OrdersQueryService } from '../orders/orders-query.service';
import { MarketplaceFinance } from './application/marketplace-finance';
export function expectedVersion(r: ApiRequest) {
  const match = /^"([1-9][0-9]*)"$/.exec(String(r.headers['if-match'] ?? ''));
  if (!match || !Number.isSafeInteger(Number(match[1]))) fail('INVALID_INPUT', 400);
  return Number(match[1]);
}
@Injectable()
export class FinanceHttpService {
  constructor(
    private readonly commands: CommandsService,
    private readonly access: AccessService,
    private readonly finance: MarketplaceFinance,
    private readonly orders: OrdersQueryService,
    private readonly shipping: ShippingPolicy,
  ) {}
  private async hold(
    r: ApiRequest,
    installment: 'DEPOSIT' | 'BALANCE' | 'FULL',
    orderId = r.params.orderId!,
  ) {
    const outcome = await this.commands.run(r, async (tx) => {
      const order = await this.access.order(orderId, r.actor, tx, true);
      if (installment === 'FULL') {
        const store = requireValue(order.storeOrder_order),
          delivery = requireValue(store.delivery_storeOrder),
          address = order.addressSnapshot as { cityId: string; areaId: string | null };
        await this.shipping.selected(
          tx,
          store.storefrontId,
          address.cityId,
          address.areaId,
          order.currency,
          delivery.method,
        );
      }
      this.access.verified(r.actor);
      const receipt = await this.finance.holdInTransaction(tx, {
        orderId,
        actorId: r.actor.id,
        installment,
        expectedVersion: expectedVersion(r),
        idempotencyKey: String(r.headers['idempotency-key']),
        termsAccepted: r.body.termsAccepted,
        simulateFailure: r.body.simulateFailure,
      });
      if (receipt.status === 'FAILED')
        return {
          failure: { id: receipt.id, code: receipt.errorCode ?? 'SIMULATED_PAYMENT_FAILED' },
          result: null,
        };
      return {
        failure: null,
        result: await this.orders.action(orderId, tx, { paymentId: receipt.id }),
      };
    });
    if (outcome.failure)
      throw new DomainError(outcome.failure.code, 422, [
        { field: 'operationId', code: 'REFERENCE', message: outcome.failure.id },
      ]);
    return outcome.result;
  }
  holdDeposit(r: ApiRequest) {
    return this.hold(r, 'DEPOSIT');
  }
  holdBalance(r: ApiRequest) {
    return this.hold(r, 'BALANCE');
  }
  checkoutStore(r: ApiRequest) {
    return this.hold(r, 'FULL', r.body.draftOrderId);
  }
  confirmReceipt(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      await this.access.order(r.params.orderId!, r.actor, tx, true);
      const receipt = await this.finance.completeInTransaction(tx, {
        orderId: r.params.orderId!,
        actorId: r.actor.id,
        expectedVersion: expectedVersion(r),
        idempotencyKey: String(r.headers['idempotency-key']),
      });
      return this.orders.action(r.params.orderId!, tx, { settlementId: receipt.id });
    });
  }
}
