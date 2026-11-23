// Generated thin transport adapter. Edit service policies and route manifest configuration.
import { Controller, Get, Post, Patch, Delete, HttpCode, Req } from '@nestjs/common';
import { ApiRequest, Operation, Public, Roles } from '../../common/actor';
import { AdminService } from './admin.service';
@Controller()
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Roles('ADMIN')
  @Get('admin/audit')
  @HttpCode(200)
  @Operation('listAuditHistory')
  listAuditHistory(@Req() request: ApiRequest) {
    return this.service.listAuditHistory(request);
  }

  @Roles('ADMIN')
  @Get('admin/cases')
  @HttpCode(200)
  @Operation('listAdminCases')
  listAdminCases(@Req() request: ApiRequest) {
    return this.service.listAdminCases(request);
  }

  @Roles('ADMIN')
  @Get('admin/commission-rates')
  @HttpCode(200)
  @Operation('listCommissionRates')
  listCommissionRates(@Req() request: ApiRequest) {
    return this.service.listCommissionRates(request);
  }

  @Roles('ADMIN')
  @Post('admin/commission-rates')
  @HttpCode(200)
  @Operation('configureCommission')
  configureCommission(@Req() request: ApiRequest) {
    return this.service.configureCommission(request);
  }

  @Roles('ADMIN')
  @Get('admin/delivery-rates')
  @HttpCode(200)
  @Operation('listDeliveryRates')
  listDeliveryRates(@Req() request: ApiRequest) {
    return this.service.listDeliveryRates(request);
  }

  @Roles('ADMIN')
  @Post('admin/delivery-rates')
  @HttpCode(200)
  @Operation('configureDeliveryRate')
  configureDeliveryRate(@Req() request: ApiRequest) {
    return this.service.configureDeliveryRate(request);
  }

  @Roles('ADMIN')
  @Get('admin/driver-zones')
  @HttpCode(200)
  @Operation('listDriverZones')
  listDriverZones(@Req() request: ApiRequest) {
    return this.service.listDriverZones(request);
  }

  @Roles('ADMIN')
  @Post('admin/driver-zones')
  @HttpCode(200)
  @Operation('assignDriverZone')
  assignDriverZone(@Req() request: ApiRequest) {
    return this.service.assignDriverZone(request);
  }

  @Roles('ADMIN')
  @Delete('admin/driver-zones/:zoneId')
  @HttpCode(204)
  @Operation('removeDriverZone')
  removeDriverZone(@Req() request: ApiRequest) {
    return this.service.removeDriverZone(request);
  }

  @Roles('ADMIN')
  @Get('admin/moderation')
  @HttpCode(200)
  @Operation('listModerationQueue')
  listModerationQueue(@Req() request: ApiRequest) {
    return this.service.listModerationQueue(request);
  }

  @Roles('ADMIN')
  @Post('admin/moderation/:resourceId/decision')
  @HttpCode(200)
  @Operation('moderateResource')
  moderateResource(@Req() request: ApiRequest) {
    return this.service.moderateResource(request);
  }

  @Roles('ADMIN')
  @Post('admin/reviews/:reviewId/moderate')
  @HttpCode(200)
  @Operation('moderateReview')
  moderateReview(@Req() request: ApiRequest) {
    return this.service.moderateReview(request);
  }

  @Roles('ADMIN')
  @Post('admin/users/:userId/restrictions')
  @HttpCode(200)
  @Operation('restrictAccount')
  restrictAccount(@Req() request: ApiRequest) {
    return this.service.restrictAccount(request);
  }

  @Roles('ADMIN')
  @Post('admin/restrictions/:restrictionId/revoke')
  @HttpCode(200)
  @Operation('revokeRestriction')
  revokeRestriction(@Req() request: ApiRequest) {
    return this.service.revokeRestriction(request);
  }

  @Roles('ADMIN')
  @Post('admin/cases/:caseId/assign')
  @HttpCode(200)
  @Operation('assignAdminCase')
  assignAdminCase(@Req() request: ApiRequest) {
    return this.service.assignAdminCase(request);
  }

  @Roles('ADMIN')
  @Post('admin/cases/:caseId/resolve')
  @HttpCode(200)
  @Operation('resolveAdminCase')
  resolveAdminCase(@Req() request: ApiRequest) {
    return this.service.resolveAdminCase(request);
  }

  @Roles('ADMIN')
  @Post('admin/cases/:caseId/resume-final-payment')
  @HttpCode(200)
  @Operation('resumeOverdueFinalPayment')
  resumeOverdueFinalPayment(@Req() request: ApiRequest) {
    return this.service.resumeOverdueFinalPayment(request);
  }
}
