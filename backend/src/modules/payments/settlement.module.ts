import { Module } from '@nestjs/common';
import { PrismaService, UnitOfWork } from '../../infrastructure/database/prisma.service';
import { InventoryModule, InventoryService } from '../inventory/inventory.service';
import { LedgerModule, LedgerPostingService } from '../ledger/ledger-posting.service';
import { EscrowModule, EscrowService } from '../escrow/escrow.service';
import { DeadlinesModule, DeadlinesService } from '../jobs/deadlines.service';
import { PaymentGatewayModule } from './gateway.module';
import {
  PAYMENT_GATEWAY_PROVIDER,
  PaymentGatewayProvider,
} from './domain/payment-gateway-provider';
import { MarketplaceFinance } from './application/marketplace-finance';
import { CommissionRatesModule } from './rates.service';
@Module({
  imports: [
    PaymentGatewayModule,
    InventoryModule,
    DeadlinesModule,
    LedgerModule,
    EscrowModule,
    CommissionRatesModule,
  ],
  providers: [
    {
      provide: MarketplaceFinance,
      useFactory: (
        db: PrismaService,
        gateway: PaymentGatewayProvider<UnitOfWork>,
        inventory: InventoryService,
        deadlines: DeadlinesService,
        ledger: LedgerPostingService,
        escrow: EscrowService,
      ) => new MarketplaceFinance(db, gateway, inventory, deadlines, ledger, escrow),
      inject: [
        PrismaService,
        PAYMENT_GATEWAY_PROVIDER,
        InventoryService,
        DeadlinesService,
        LedgerPostingService,
        EscrowService,
      ],
    },
  ],
  exports: [MarketplaceFinance, CommissionRatesModule],
})
export class SettlementModule {}
