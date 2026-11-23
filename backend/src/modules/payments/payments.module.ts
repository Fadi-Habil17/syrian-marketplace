import { Module } from '@nestjs/common';
import { OrdersReadModule } from '../orders/orders-read.module';
import { ShippingPolicyModule } from '../delivery/shipping-policy.service';
import { PaymentGatewayModule } from './gateway.module';
import { SettlementModule } from './settlement.module';
import { FinanceHttpService } from './finance-http.service';
import { PaymentsController } from './payments.controller';
@Module({
  imports: [OrdersReadModule, ShippingPolicyModule, PaymentGatewayModule, SettlementModule],
  controllers: [PaymentsController],
  providers: [FinanceHttpService],
  exports: [SettlementModule, FinanceHttpService, PaymentGatewayModule],
})
export class PaymentsModule {}
