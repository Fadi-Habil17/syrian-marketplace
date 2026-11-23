import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { GeographyModule } from '../geography/geography.module';
import { OrderCoreModule } from '../orders/order-lifecycle.service';
import { OrdersReadModule } from '../orders/orders-read.module';
import { SchedulingModule } from '../scheduling/scheduling.service';

@Module({
  imports: [GeographyModule, OrderCoreModule, OrdersReadModule, SchedulingModule],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
