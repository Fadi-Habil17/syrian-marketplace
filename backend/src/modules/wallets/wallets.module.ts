import { Module } from '@nestjs/common';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { LedgerModule } from '../ledger/ledger-posting.service';
import { PaymentGatewayModule } from '../payments/gateway.module';

@Module({
  imports: [LedgerModule, PaymentGatewayModule],
  controllers: [WalletsController],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}
