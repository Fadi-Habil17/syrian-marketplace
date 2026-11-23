import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from './infrastructure/config/environment';
import { HealthModule } from './modules/health/health.module';
import { DatabaseModule } from './infrastructure/database/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ApiExceptionFilter } from './common/errors';
import { JwtAccessGuard, PolicyGuard } from './modules/auth/access.strategy';
import {
  ContractsService,
  ContractValidationInterceptor,
} from './infrastructure/http/contracts.service';
import { CoreModule } from './infrastructure/core.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { GeographyModule } from './modules/geography/geography.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { FilesModule } from './modules/files/files.module';
import { StoresModule } from './modules/stores/stores.module';
import { ProductsModule } from './modules/products/products.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { FreelanceModule } from './modules/freelance/freelance.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ChatModule } from './modules/chat/chat.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { RateLimitGuard } from './common/rate-limit.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    DatabaseModule,
    CoreModule,
    AuthModule,
    ProfilesModule,
    GeographyModule,
    CatalogModule,
    FilesModule,
    StoresModule,
    ProductsModule,
    PaymentsModule,
    WalletsModule,
    FreelanceModule,
    BookingsModule,
    QuotesModule,
    OrdersModule,
    CheckoutModule,
    DisputesModule,
    DeliveryModule,
    ReviewsModule,
    ChatModule,
    NotificationsModule,
    AdminModule,
    RealtimeModule,
    JobsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAccessGuard },
    { provide: APP_GUARD, useClass: PolicyGuard },
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ContractValidationInterceptor },
  ],
})
export class AppModule {}
