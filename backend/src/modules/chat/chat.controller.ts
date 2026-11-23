// Generated thin transport adapter. Edit service policies and route manifest configuration.
import { Controller, Get, Post, Patch, Delete, HttpCode, Req } from '@nestjs/common';
import { ApiRequest, Operation, Public, Roles } from '../../common/actor';
import { ChatService } from './chat.service';
@Controller()
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Get('orders/:orderId/chat-rooms')
  @HttpCode(200)
  @Operation('getOrderRooms')
  getOrderRooms(@Req() request: ApiRequest) {
    return this.service.getOrderRooms(request);
  }

  @Get('orders/:orderId/messages')
  @HttpCode(200)
  @Operation('listMessages')
  listMessages(@Req() request: ApiRequest) {
    return this.service.listMessages(request);
  }

  @Post('orders/:orderId/messages')
  @HttpCode(201)
  @Operation('sendMessage')
  sendMessage(@Req() request: ApiRequest) {
    return this.service.sendMessage(request);
  }
}
