// Generated thin transport adapter. Edit service policies and route manifest configuration.
import { Controller, Get, Post, Patch, Delete, HttpCode, Req } from '@nestjs/common';
import { ApiRequest, Operation, Public, Roles } from '../../common/actor';
import { ProductsService } from './products.service';
@Controller()
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Public()
  @Get('products')
  @HttpCode(200)
  @Operation('listProducts')
  listProducts(@Req() request: ApiRequest) {
    return this.service.listProducts(request);
  }

  @Post('products')
  @HttpCode(201)
  @Operation('createProduct')
  createProduct(@Req() request: ApiRequest) {
    return this.service.createProduct(request);
  }

  @Public()
  @Get('products/:productId')
  @HttpCode(200)
  @Operation('getProduct')
  getProduct(@Req() request: ApiRequest) {
    return this.service.getProduct(request);
  }

  @Patch('products/:productId')
  @HttpCode(200)
  @Operation('updateProduct')
  updateProduct(@Req() request: ApiRequest) {
    return this.service.updateProduct(request);
  }

  @Post('products/:productId/publish')
  @HttpCode(200)
  @Operation('publishProduct')
  publishProduct(@Req() request: ApiRequest) {
    return this.service.publishProduct(request);
  }

  @Post('products/:productId/deactivate')
  @HttpCode(200)
  @Operation('deactivateProduct')
  deactivateProduct(@Req() request: ApiRequest) {
    return this.service.deactivateProduct(request);
  }

  @Patch('products/:productId/stock')
  @HttpCode(200)
  @Operation('setProductStock')
  setProductStock(@Req() request: ApiRequest) {
    return this.service.setProductStock(request);
  }
}
