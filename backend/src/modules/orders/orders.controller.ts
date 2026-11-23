// Generated thin transport adapter. Edit service policies and route manifest configuration.
import { Controller, Get, Post, Patch, Delete, HttpCode, Req } from '@nestjs/common';
import { ApiRequest, Operation, Public, Roles } from '../../common/actor';
import { OrdersService } from './orders.service';
@Controller()
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get('orders/:orderId/actions')
  @HttpCode(200)
  @Operation('getAllowedOrderActions')
  getAllowedOrderActions(@Req() request: ApiRequest) {
    return this.service.getAllowedOrderActions(request);
  }

  @Post('orders/:orderId/reject')
  @HttpCode(200)
  @Operation('rejectOrder')
  rejectOrder(@Req() request: ApiRequest) {
    return this.service.rejectOrder(request);
  }

  @Post('orders/:orderId/start')
  @HttpCode(200)
  @Operation('startWork')
  startWork(@Req() request: ApiRequest) {
    return this.service.startWork(request);
  }

  @Post('orders/:orderId/progress')
  @HttpCode(200)
  @Operation('recordProgress')
  recordProgress(@Req() request: ApiRequest) {
    return this.service.recordProgress(request);
  }

  @Post('orders/:orderId/ready')
  @HttpCode(200)
  @Operation('markReady')
  markReady(@Req() request: ApiRequest) {
    return this.service.markReady(request);
  }

  @Post('orders/:orderId/deliver')
  @HttpCode(200)
  @Operation('deliverService')
  deliverService(@Req() request: ApiRequest) {
    return this.service.deliverService(request);
  }

  @Post('orders/:orderId/milestones')
  @HttpCode(201)
  @Operation('createMilestone')
  createMilestone(@Req() request: ApiRequest) {
    return this.service.createMilestone(request);
  }

  @Post('orders/:orderId/accept-store')
  @HttpCode(200)
  @Operation('acceptStoreOrder')
  acceptStoreOrder(@Req() request: ApiRequest) {
    return this.service.acceptStoreOrder(request);
  }

  @Post('orders/:orderId/ready-for-delivery')
  @HttpCode(200)
  @Operation('markStoreReady')
  markStoreReady(@Req() request: ApiRequest) {
    return this.service.markStoreReady(request);
  }
}
