import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { ShippingPolicyModule } from '../delivery/shipping-policy.service';
import { GeographyModule } from '../geography/geography.module';
import { OrderCoreModule } from '../orders/order-lifecycle.service';
import { OrdersReadModule } from '../orders/orders-read.module';

@Module({
  imports: [ShippingPolicyModule, GeographyModule, OrderCoreModule, OrdersReadModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
