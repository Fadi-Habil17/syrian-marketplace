// Generated thin transport adapter. Edit service policies and route manifest configuration.
import { Controller, Get, Post, Patch, Delete, HttpCode, Req } from '@nestjs/common';
import { ApiRequest, Operation, Public, Roles } from '../../common/actor';
import { GeographyService } from './geography.service';
@Controller()
export class GeographyController {
  constructor(private readonly service: GeographyService) {}

  @Public()
  @Get('geography/governorates')
  @HttpCode(200)
  @Operation('listGovernorates')
  listGovernorates(@Req() request: ApiRequest) {
    return this.service.listGovernorates(request);
  }

  @Public()
  @Get('geography/cities')
  @HttpCode(200)
  @Operation('listCities')
  listCities(@Req() request: ApiRequest) {
    return this.service.listCities(request);
  }

  @Public()
  @Get('geography/areas')
  @HttpCode(200)
  @Operation('listAreas')
  listAreas(@Req() request: ApiRequest) {
    return this.service.listAreas(request);
  }

  @Get('me/addresses')
  @HttpCode(200)
  @Operation('listAddresses')
  listAddresses(@Req() request: ApiRequest) {
    return this.service.listAddresses(request);
  }

  @Post('me/addresses')
  @HttpCode(201)
  @Operation('createAddress')
  createAddress(@Req() request: ApiRequest) {
    return this.service.createAddress(request);
  }

  @Patch('me/addresses/:addressId')
  @HttpCode(200)
  @Operation('updateAddress')
  updateAddress(@Req() request: ApiRequest) {
    return this.service.updateAddress(request);
  }

  @Delete('me/addresses/:addressId')
  @HttpCode(204)
  @Operation('archiveAddress')
  archiveAddress(@Req() request: ApiRequest) {
    return this.service.archiveAddress(request);
  }
}
