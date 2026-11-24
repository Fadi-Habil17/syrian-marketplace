// Generated thin transport adapter. Edit service policies and route manifest configuration.
import { Controller, Get, Post, Patch, Delete, HttpCode, Req } from '@nestjs/common';
import { ApiRequest, Operation, Public, Roles } from '../../common/actor';
import { ProfilesService } from './profiles.service';
@Controller()
export class ProfilesController {
  constructor(private readonly service: ProfilesService) {}

  @Get('business-profiles/:profileId/public-venue')
  @HttpCode(200)
  @Operation('getPublicVenue')
  getPublicVenue(@Req() request: ApiRequest) {
    return this.service.getPublicVenue(request);
  }

  @Patch('business-profiles/:profileId/public-venue')
  @HttpCode(200)
  @Operation('setPublicVenue')
  setPublicVenue(@Req() request: ApiRequest) {
    return this.service.setPublicVenue(request);
  }

  @Public()
  @Post('discovery/local/search')
  @HttpCode(200)
  @Operation('searchLocal')
  searchLocal(@Req() request: ApiRequest) {
    return this.service.searchLocal(request);
  }

  @Get('me')
  @HttpCode(200)
  @Operation('getMe')
  getMe(@Req() request: ApiRequest) {
    return this.service.getMe(request);
  }

  @Patch('me')
  @HttpCode(200)
  @Operation('updateMe')
  updateMe(@Req() request: ApiRequest) {
    return this.service.updateMe(request);
  }

  @Get('business-profiles')
  @HttpCode(200)
  @Operation('listOwnBusinessProfiles')
  listOwnBusinessProfiles(@Req() request: ApiRequest) {
    return this.service.listOwnBusinessProfiles(request);
  }

  @Post('business-profiles')
  @HttpCode(201)
  @Operation('createBusinessProfile')
  createBusinessProfile(@Req() request: ApiRequest) {
    return this.service.createBusinessProfile(request);
  }

  @Patch('business-profiles/:profileId')
  @HttpCode(200)
  @Operation('updateBusinessProfile')
  updateBusinessProfile(@Req() request: ApiRequest) {
    return this.service.updateBusinessProfile(request);
  }

  @Post('business-profiles/switch')
  @HttpCode(200)
  @Operation('switchBusinessWorkspace')
  switchBusinessWorkspace(@Req() request: ApiRequest) {
    return this.service.switchBusinessWorkspace(request);
  }

  @Post('business-profiles/:profileId/reactivate')
  @HttpCode(200)
  @Operation('reactivateBusinessProfile')
  reactivateBusinessProfile(@Req() request: ApiRequest) {
    return this.service.reactivateBusinessProfile(request);
  }

  @Public()
  @Get('profiles/:profileId')
  @HttpCode(200)
  @Operation('getPublicProfile')
  getPublicProfile(@Req() request: ApiRequest) {
    return this.service.getPublicProfile(request);
  }

  @Post('business-profiles/:profileId/portfolio')
  @HttpCode(201)
  @Operation('createPortfolioItem')
  createPortfolioItem(@Req() request: ApiRequest) {
    return this.service.createPortfolioItem(request);
  }

  @Delete('business-profiles/:profileId/portfolio/:itemId')
  @HttpCode(204)
  @Operation('removePortfolioItem')
  removePortfolioItem(@Req() request: ApiRequest) {
    return this.service.removePortfolioItem(request);
  }

  @Get('business-profiles/:profileId/service-areas')
  @HttpCode(200)
  @Operation('listServiceAreas')
  listServiceAreas(@Req() request: ApiRequest) {
    return this.service.listServiceAreas(request);
  }

  @Post('business-profiles/:profileId/service-areas')
  @HttpCode(201)
  @Operation('addServiceArea')
  addServiceArea(@Req() request: ApiRequest) {
    return this.service.addServiceArea(request);
  }

  @Delete('business-profiles/:profileId/service-areas/:areaId')
  @HttpCode(204)
  @Operation('removeServiceArea')
  removeServiceArea(@Req() request: ApiRequest) {
    return this.service.removeServiceArea(request);
  }
}
