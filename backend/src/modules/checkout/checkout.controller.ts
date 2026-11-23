// Generated thin transport adapter. Edit service policies and route manifest configuration.
import { Controller, Get, Post, Patch, Delete, HttpCode, Req } from '@nestjs/common';
import { ApiRequest, Operation, Public, Roles } from '../../common/actor';
import { CheckoutService } from './checkout.service';
@Controller()
export class CheckoutController {
  constructor(private readonly service: CheckoutService) {}

  @Post('orders/store-preview')
  @HttpCode(201)
  @Operation('previewStoreCheckout')
  previewStoreCheckout(@Req() request: ApiRequest) {
    return this.service.previewStoreCheckout(request);
  }

  @Get('delivery-options')
  @HttpCode(200)
  @Operation('getDeliveryOptions')
  getDeliveryOptions(@Req() request: ApiRequest) {
    return this.service.getDeliveryOptions(request);
  }
}
