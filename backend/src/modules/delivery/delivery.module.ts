import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { EscrowModule } from '../escrow/escrow.service';
import { ShippingPolicyModule } from './shipping-policy.service';
import { CaseLifecycleModule } from '../disputes/case-lifecycle.service';
import { PaymentsModule } from '../payments/payments.module';
import { InventoryModule } from '../inventory/inventory.service';
import { OrderCoreModule } from '../orders/order-lifecycle.service';
import { OrdersReadModule } from '../orders/orders-read.module';

@Module({
  imports: [
    EscrowModule,
    ShippingPolicyModule,
    CaseLifecycleModule,
    PaymentsModule,
    InventoryModule,
    OrderCoreModule,
    OrdersReadModule,
  ],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
