import { LedgerModule } from '../ledger/ledger-posting.service';
import { Module } from '@nestjs/common';
import { PAYMENT_GATEWAY_PROVIDER } from './domain/payment-gateway-provider';
import { LocalSimulatedGateway } from './infrastructure/local-simulated-gateway';
@Module({
  imports: [LedgerModule],
  providers: [{ provide: PAYMENT_GATEWAY_PROVIDER, useClass: LocalSimulatedGateway }],
  exports: [PAYMENT_GATEWAY_PROVIDER],
})
export class PaymentGatewayModule {}
