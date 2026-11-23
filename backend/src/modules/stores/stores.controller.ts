// Generated thin transport adapter. Edit service policies and route manifest configuration.
import { Controller, Get, Post, Patch, Delete, HttpCode, Req } from '@nestjs/common';
import { ApiRequest, Operation, Public, Roles } from '../../common/actor';
import { StoresService } from './stores.service';
@Controller()
export class StoresController {
  constructor(private readonly service: StoresService) {}

  @Public()
  @Get('stores')
  @HttpCode(200)
  @Operation('listStores')
  listStores(@Req() request: ApiRequest) {
    return this.service.listStores(request);
  }

  @Post('stores')
  @HttpCode(201)
  @Operation('createStore')
  createStore(@Req() request: ApiRequest) {
    return this.service.createStore(request);
  }

  @Public()
  @Get('stores/:storeId')
  @HttpCode(200)
  @Operation('getStore')
  getStore(@Req() request: ApiRequest) {
    return this.service.getStore(request);
  }

  @Patch('stores/:storeId')
  @HttpCode(200)
  @Operation('updateStore')
  updateStore(@Req() request: ApiRequest) {
    return this.service.updateStore(request);
  }

  @Post('stores/:storeId/publish')
  @HttpCode(200)
  @Operation('publishStore')
  publishStore(@Req() request: ApiRequest) {
    return this.service.publishStore(request);
  }

  @Post('stores/:storeId/deactivate')
  @HttpCode(200)
  @Operation('deactivateStore')
  deactivateStore(@Req() request: ApiRequest) {
    return this.service.deactivateStore(request);
  }
}
