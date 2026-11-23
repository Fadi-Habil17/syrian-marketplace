import { Module } from '@nestjs/common';
import { DisputesController } from './disputes.controller';
import { DisputesService } from './disputes.service';
import { EscrowModule } from '../escrow/escrow.service';
import { CaseAccessModule } from './case-access.service';
import { CaseLifecycleModule } from './case-lifecycle.service';
import { PaymentsModule } from '../payments/payments.module';
import { OrderCoreModule } from '../orders/order-lifecycle.service';
import { OrdersReadModule } from '../orders/orders-read.module';
import { SchedulingModule } from '../scheduling/scheduling.service';

@Module({
  imports: [
    EscrowModule,
    CaseAccessModule,
    CaseLifecycleModule,
    PaymentsModule,
    OrderCoreModule,
    OrdersReadModule,
    SchedulingModule,
  ],
  controllers: [DisputesController],
  providers: [DisputesService],
  exports: [DisputesService],
})
export class DisputesModule {}
