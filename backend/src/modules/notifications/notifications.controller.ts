// Generated thin transport adapter. Edit service policies and route manifest configuration.
import { Controller, Get, Post, Patch, Delete, HttpCode, Req } from '@nestjs/common';
import { ApiRequest, Operation, Public, Roles } from '../../common/actor';
import { NotificationsService } from './notifications.service';
@Controller()
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get('notifications')
  @HttpCode(200)
  @Operation('listNotifications')
  listNotifications(@Req() request: ApiRequest) {
    return this.service.listNotifications(request);
  }

  @Post('notifications/:notificationId/read')
  @HttpCode(200)
  @Operation('readNotification')
  readNotification(@Req() request: ApiRequest) {
    return this.service.readNotification(request);
  }

  @Post('notifications/read-all')
  @HttpCode(200)
  @Operation('readAllNotifications')
  readAllNotifications(@Req() request: ApiRequest) {
    return this.service.readAllNotifications(request);
  }

  @Post('devices')
  @HttpCode(201)
  @Operation('registerDevice')
  registerDevice(@Req() request: ApiRequest) {
    return this.service.registerDevice(request);
  }

  @Delete('devices/:deviceId')
  @HttpCode(204)
  @Operation('revokeDevice')
  revokeDevice(@Req() request: ApiRequest) {
    return this.service.revokeDevice(request);
  }
}
