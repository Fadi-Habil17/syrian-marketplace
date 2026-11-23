import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PaymentsModule } from '../payments/payments.module';
import { OrderCoreModule } from './order-lifecycle.service';
import { OrdersReadModule } from './orders-read.module';
import { SchedulingModule } from '../scheduling/scheduling.service';

@Module({
  imports: [PaymentsModule, OrderCoreModule, OrdersReadModule, SchedulingModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
