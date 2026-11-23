import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatAccessModule } from './chat-access.service';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [ChatAccessModule, FilesModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
