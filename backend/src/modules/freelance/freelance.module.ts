import { Module } from '@nestjs/common';
import { FreelanceController } from './freelance.controller';
import { FreelanceService } from './freelance.service';
import { CatalogModule } from '../catalog/catalog.module';
import { OrderCoreModule } from '../orders/order-lifecycle.service';
import { OrdersReadModule } from '../orders/orders-read.module';

@Module({
  imports: [CatalogModule, OrderCoreModule, OrdersReadModule],
  controllers: [FreelanceController],
  providers: [FreelanceService],
  exports: [FreelanceService],
})
export class FreelanceModule {}
