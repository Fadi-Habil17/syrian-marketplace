// Generated thin transport adapter. Edit service policies and route manifest configuration.
import { Controller, Get, Post, Patch, Delete, HttpCode, Req } from '@nestjs/common';
import { ApiRequest, Operation, Public, Roles } from '../../common/actor';
import { WalletsService } from './wallets.service';
@Controller()
export class WalletsController {
  constructor(private readonly service: WalletsService) {}

  @Get('wallets')
  @HttpCode(200)
  @Operation('listWallets')
  listWallets(@Req() request: ApiRequest) {
    return this.service.listWallets(request);
  }

  @Get('wallets/:currency/transactions')
  @HttpCode(200)
  @Operation('listWalletTransactions')
  listWalletTransactions(@Req() request: ApiRequest) {
    return this.service.listWalletTransactions(request);
  }

  @Get('orders/:orderId/payments')
  @HttpCode(200)
  @Operation('listOrderPayments')
  listOrderPayments(@Req() request: ApiRequest) {
    return this.service.listOrderPayments(request);
  }

  @Get('orders/:orderId/settlement')
  @HttpCode(200)
  @Operation('getSettlement')
  getSettlement(@Req() request: ApiRequest) {
    return this.service.getSettlement(request);
  }

  @Get('operations/:operationId')
  @HttpCode(200)
  @Operation('getOperation')
  getOperation(@Req() request: ApiRequest) {
    return this.service.getOperation(request);
  }

  @Roles('ADMIN')
  @Post('admin/simulator/topups')
  @HttpCode(200)
  @Operation('simulateWalletTopUp')
  simulateWalletTopUp(@Req() request: ApiRequest) {
    return this.service.simulateWalletTopUp(request);
  }
}
