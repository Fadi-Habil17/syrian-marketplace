import { EscrowModule } from '../escrow/escrow.service';
import { Module } from '@nestjs/common';
import { ScheduledJobsService } from './scheduled-jobs.service';
import { OutboxWorker } from './outbox-worker.service';
import { NotificationDispatcher } from '../notifications/notification-dispatcher.service';
import { ExpoPush } from '../notifications/expo-push.service';
import { FilesModule } from '../files/files.module';
import { CaseLifecycleModule } from '../disputes/case-lifecycle.service';
import { PaymentsModule } from '../payments/payments.module';
import { SchedulingModule } from '../scheduling/scheduling.service';
import { OrderCoreModule } from '../orders/order-lifecycle.service';
@Module({
  imports: [
    EscrowModule,
    FilesModule,
    CaseLifecycleModule,
    PaymentsModule,
    SchedulingModule,
    OrderCoreModule,
  ],
  providers: [ScheduledJobsService, OutboxWorker, NotificationDispatcher, ExpoPush],
  exports: [ScheduledJobsService, OutboxWorker, NotificationDispatcher],
})
export class JobsModule {}
