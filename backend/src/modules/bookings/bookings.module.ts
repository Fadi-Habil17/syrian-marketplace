import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { CatalogModule } from '../catalog/catalog.module';
import { GeographyModule } from '../geography/geography.module';
import { OrderCoreModule } from '../orders/order-lifecycle.service';
import { OrdersReadModule } from '../orders/orders-read.module';
import { SchedulingModule } from '../scheduling/scheduling.service';

@Module({
  imports: [CatalogModule, GeographyModule, OrderCoreModule, OrdersReadModule, SchedulingModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
