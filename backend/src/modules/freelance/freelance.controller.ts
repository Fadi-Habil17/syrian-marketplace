// Generated thin transport adapter. Edit service policies and route manifest configuration.
import { Controller, Get, Post, Patch, Delete, HttpCode, Req } from '@nestjs/common';
import { ApiRequest, Operation, Public, Roles } from '../../common/actor';
import { FreelanceService } from './freelance.service';
@Controller()
export class FreelanceController {
  constructor(private readonly service: FreelanceService) {}

  @Post('orders/freelance')
  @HttpCode(201)
  @Operation('createFreelanceOrder')
  createFreelanceOrder(@Req() request: ApiRequest) {
    return this.service.createFreelanceOrder(request);
  }

  @Post('orders/:orderId/agree')
  @HttpCode(200)
  @Operation('agreeOrder')
  agreeOrder(@Req() request: ApiRequest) {
    return this.service.agreeOrder(request);
  }
}
