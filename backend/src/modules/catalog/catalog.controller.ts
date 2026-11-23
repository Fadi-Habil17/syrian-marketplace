// Generated thin transport adapter. Edit service policies and route manifest configuration.
import { Controller, Get, Post, Patch, Delete, HttpCode, Req } from '@nestjs/common';
import { ApiRequest, Operation, Public, Roles } from '../../common/actor';
import { CatalogService } from './catalog.service';
@Controller()
export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  @Public()
  @Get('categories')
  @HttpCode(200)
  @Operation('listCategories')
  listCategories(@Req() request: ApiRequest) {
    return this.service.listCategories(request);
  }

  @Public()
  @Get('listings')
  @HttpCode(200)
  @Operation('listListings')
  listListings(@Req() request: ApiRequest) {
    return this.service.listListings(request);
  }

  @Post('listings')
  @HttpCode(201)
  @Operation('createListing')
  createListing(@Req() request: ApiRequest) {
    return this.service.createListing(request);
  }

  @Public()
  @Get('listings/:listingId')
  @HttpCode(200)
  @Operation('getListing')
  getListing(@Req() request: ApiRequest) {
    return this.service.getListing(request);
  }

  @Patch('listings/:listingId')
  @HttpCode(200)
  @Operation('updateListing')
  updateListing(@Req() request: ApiRequest) {
    return this.service.updateListing(request);
  }

  @Post('listings/:listingId/publish')
  @HttpCode(200)
  @Operation('publishListing')
  publishListing(@Req() request: ApiRequest) {
    return this.service.publishListing(request);
  }

  @Post('listings/:listingId/deactivate')
  @HttpCode(200)
  @Operation('deactivateListing')
  deactivateListing(@Req() request: ApiRequest) {
    return this.service.deactivateListing(request);
  }
}
