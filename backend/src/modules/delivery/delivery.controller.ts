// Generated thin transport adapter. Edit service policies and route manifest configuration.
import { Controller, Get, Post, Patch, Delete, HttpCode, Req } from '@nestjs/common';
import { ApiRequest, Operation, Public, Roles } from '../../common/actor';
import { DeliveryService } from './delivery.service';
@Controller()
export class DeliveryController {
  constructor(private readonly service: DeliveryService) {}

  @Roles('ADMIN')
  @Post('admin/deliveries/:deliveryId/reassign')
  @HttpCode(200)
  @Operation('reassignDelivery')
  reassignDelivery(@Req() request: ApiRequest) {
    return this.service.reassignDelivery(request);
  }

  @Post('orders/:orderId/delivery/request-driver')
  @HttpCode(200)
  @Operation('requestPlatformDriver')
  requestPlatformDriver(@Req() request: ApiRequest) {
    return this.service.requestPlatformDriver(request);
  }

  @Get('deliveries/:deliveryId')
  @HttpCode(200)
  @Operation('getDelivery')
  getDelivery(@Req() request: ApiRequest) {
    return this.service.getDelivery(request);
  }

  @Get('driver/jobs')
  @HttpCode(200)
  @Operation('listDriverJobs')
  listDriverJobs(@Req() request: ApiRequest) {
    return this.service.listDriverJobs(request);
  }

  @Get('driver/assignments')
  @HttpCode(200)
  @Operation('listDriverAssignments')
  listDriverAssignments(@Req() request: ApiRequest) {
    return this.service.listDriverAssignments(request);
  }

  @Post('deliveries/:deliveryId/accept')
  @HttpCode(200)
  @Operation('acceptDeliveryJob')
  acceptDeliveryJob(@Req() request: ApiRequest) {
    return this.service.acceptDeliveryJob(request);
  }

  @Post('deliveries/:deliveryId/release-assignment')
  @HttpCode(200)
  @Operation('releaseDriverAssignment')
  releaseDriverAssignment(@Req() request: ApiRequest) {
    return this.service.releaseDriverAssignment(request);
  }

  @Post('deliveries/:deliveryId/pickup')
  @HttpCode(200)
  @Operation('recordPickup')
  recordPickup(@Req() request: ApiRequest) {
    return this.service.recordPickup(request);
  }

  @Post('deliveries/:deliveryId/dropoff')
  @HttpCode(200)
  @Operation('recordDropoff')
  recordDropoff(@Req() request: ApiRequest) {
    return this.service.recordDropoff(request);
  }

  @Post('deliveries/:deliveryId/exception')
  @HttpCode(200)
  @Operation('reportDeliveryException')
  reportDeliveryException(@Req() request: ApiRequest) {
    return this.service.reportDeliveryException(request);
  }

  @Post('deliveries/:deliveryId/terms')
  @HttpCode(201)
  @Operation('proposeDeliveryTerms')
  proposeDeliveryTerms(@Req() request: ApiRequest) {
    return this.service.proposeDeliveryTerms(request);
  }

  @Post('deliveries/:deliveryId/terms/:revisionId/approve')
  @HttpCode(200)
  @Operation('approveDeliveryTerms')
  approveDeliveryTerms(@Req() request: ApiRequest) {
    return this.service.approveDeliveryTerms(request);
  }

  @Post('deliveries/:deliveryId/fallback')
  @HttpCode(200)
  @Operation('chooseDeliveryFallback')
  chooseDeliveryFallback(@Req() request: ApiRequest) {
    return this.service.chooseDeliveryFallback(request);
  }
}
