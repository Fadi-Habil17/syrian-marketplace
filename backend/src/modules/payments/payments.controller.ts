// Generated thin transport adapter. Edit service policies and route manifest configuration.
import { Controller, Get, Post, Patch, Delete, HttpCode, Req } from '@nestjs/common';
import { ApiRequest, Operation, Public, Roles } from '../../common/actor';
import { FinanceHttpService } from './finance-http.service';
@Controller()
export class PaymentsController {
  constructor(private readonly service: FinanceHttpService) {}

  @Post('orders/:orderId/payments/deposit')
  @HttpCode(200)
  @Operation('holdDeposit')
  holdDeposit(@Req() request: ApiRequest) {
    return this.service.holdDeposit(request);
  }

  @Post('orders/:orderId/payments/balance')
  @HttpCode(200)
  @Operation('holdBalance')
  holdBalance(@Req() request: ApiRequest) {
    return this.service.holdBalance(request);
  }

  @Post('orders/store-checkout')
  @HttpCode(200)
  @Operation('checkoutStore')
  checkoutStore(@Req() request: ApiRequest) {
    return this.service.checkoutStore(request);
  }

  @Post('orders/:orderId/confirm')
  @HttpCode(200)
  @Operation('confirmReceipt')
  confirmReceipt(@Req() request: ApiRequest) {
    return this.service.confirmReceipt(request);
  }
}
