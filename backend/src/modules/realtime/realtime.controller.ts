// Generated thin transport adapter. Edit service policies and route manifest configuration.
import { Controller, Get, Post, Patch, Delete, HttpCode, Req } from '@nestjs/common';
import { ApiRequest, Operation, Public, Roles } from '../../common/actor';
import { RealtimeService } from './realtime.service';
@Controller()
export class RealtimeController {
  constructor(private readonly service: RealtimeService) {}

  @Post('realtime/ticket')
  @HttpCode(200)
  @Operation('createRealtimeTicket')
  createRealtimeTicket(@Req() request: ApiRequest) {
    return this.service.createRealtimeTicket(request);
  }
}
