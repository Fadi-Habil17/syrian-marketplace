import { Module } from '@nestjs/common';
import { OrdersQueryService } from './orders-query.service';
import { OrdersQueryController } from './orders-query.controller';
@Module({
  controllers: [OrdersQueryController],
  providers: [OrdersQueryService],
  exports: [OrdersQueryService],
})
export class OrdersReadModule {}
