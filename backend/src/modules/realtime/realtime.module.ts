import { Module } from '@nestjs/common';
import { RealtimeService } from './realtime.service';
import { RealtimeController } from './realtime.controller';
import { RealtimeGateway } from './realtime.gateway';
import { ChatModule } from '../chat/chat.module';
import { ChatAccessModule } from '../chat/chat-access.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { DeliveryModule } from '../delivery/delivery.module';
@Module({
  imports: [ChatModule, ChatAccessModule, NotificationsModule, DeliveryModule],
  controllers: [RealtimeController],
  providers: [RealtimeService, RealtimeGateway],
})
export class RealtimeModule {}
