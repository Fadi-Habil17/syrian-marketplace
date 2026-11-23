// Generated thin transport adapter. Edit service policies and route manifest configuration.
import { Controller, Get, Post, Patch, Delete, HttpCode, Req } from '@nestjs/common';
import { ApiRequest, Operation, Public, Roles } from '../../common/actor';
import { OrdersQueryService } from './orders-query.service';
@Controller()
export class OrdersQueryController {
  constructor(private readonly service: OrdersQueryService) {}

  @Get('orders')
  @HttpCode(200)
  @Operation('listOrders')
  listOrders(@Req() request: ApiRequest) {
    return this.service.listOrders(request);
  }

  @Get('orders/:orderId')
  @HttpCode(200)
  @Operation('getOrder')
  getOrder(@Req() request: ApiRequest) {
    return this.service.getOrder(request);
  }

  @Get('orders/:orderId/timeline')
  @HttpCode(200)
  @Operation('getOrderTimeline')
  getOrderTimeline(@Req() request: ApiRequest) {
    return this.service.getOrderTimeline(request);
  }

  @Get('orders/:orderId/milestones')
  @HttpCode(200)
  @Operation('listMilestones')
  listMilestones(@Req() request: ApiRequest) {
    return this.service.listMilestones(request);
  }

  @Get('orders/:orderId/submissions')
  @HttpCode(200)
  @Operation('listSubmissions')
  listSubmissions(@Req() request: ApiRequest) {
    return this.service.listSubmissions(request);
  }
}
