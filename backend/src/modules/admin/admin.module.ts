import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { EscrowModule } from '../escrow/escrow.service';
import { CaseAccessModule } from '../disputes/case-access.service';
import { CaseLifecycleModule } from '../disputes/case-lifecycle.service';
import { PaymentsModule } from '../payments/payments.module';
import { CommissionRatesModule } from '../payments/rates.service';
import { DeliveryConfigModule } from '../delivery/delivery-config.service';
import { OrderCoreModule } from '../orders/order-lifecycle.service';
import { OrdersReadModule } from '../orders/orders-read.module';
import { CatalogModule } from '../catalog/catalog.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { StoresModule } from '../stores/stores.module';
import { ProductsModule } from '../products/products.module';
import { ReviewsModule } from '../reviews/reviews.module';

@Module({
  imports: [
    EscrowModule,
    CaseAccessModule,
    CaseLifecycleModule,
    PaymentsModule,
    CommissionRatesModule,
    DeliveryConfigModule,
    OrderCoreModule,
    OrdersReadModule,
    CatalogModule,
    ProfilesModule,
    StoresModule,
    ProductsModule,
    ReviewsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
