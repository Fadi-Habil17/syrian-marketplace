// Generated thin transport adapter. Edit service policies and route manifest configuration.
import { Controller, Get, Post, Patch, Delete, HttpCode, Req } from '@nestjs/common';
import { ApiRequest, Operation, Public, Roles } from '../../common/actor';
import { DisputesService } from './disputes.service';
@Controller()
export class DisputesController {
  constructor(private readonly service: DisputesService) {}

  @Get('orders/:orderId/cases')
  @HttpCode(200)
  @Operation('listOrderCases')
  listOrderCases(@Req() request: ApiRequest) {
    return this.service.listOrderCases(request);
  }

  @Get('cases/:caseId')
  @HttpCode(200)
  @Operation('getCase')
  getCase(@Req() request: ApiRequest) {
    return this.service.getCase(request);
  }

  @Post('orders/:orderId/cases')
  @HttpCode(201)
  @Operation('openCase')
  openCase(@Req() request: ApiRequest) {
    return this.service.openCase(request);
  }

  @Get('cases/:caseId/evidence')
  @HttpCode(200)
  @Operation('listEvidence')
  listEvidence(@Req() request: ApiRequest) {
    return this.service.listEvidence(request);
  }

  @Post('cases/:caseId/evidence')
  @HttpCode(201)
  @Operation('submitEvidence')
  submitEvidence(@Req() request: ApiRequest) {
    return this.service.submitEvidence(request);
  }

  @Get('cases/:caseId/proposals')
  @HttpCode(200)
  @Operation('listProposals')
  listProposals(@Req() request: ApiRequest) {
    return this.service.listProposals(request);
  }

  @Post('cases/:caseId/proposals')
  @HttpCode(201)
  @Operation('proposeResolution')
  proposeResolution(@Req() request: ApiRequest) {
    return this.service.proposeResolution(request);
  }

  @Post('cases/:caseId/proposals/:proposalId/accept')
  @HttpCode(200)
  @Operation('acceptResolutionProposal')
  acceptResolutionProposal(@Req() request: ApiRequest) {
    return this.service.acceptResolutionProposal(request);
  }

  @Post('cases/:caseId/proposals/:proposalId/reject')
  @HttpCode(200)
  @Operation('rejectResolutionProposal')
  rejectResolutionProposal(@Req() request: ApiRequest) {
    return this.service.rejectResolutionProposal(request);
  }

  @Post('cases/:caseId/revisions/accept')
  @HttpCode(200)
  @Operation('acceptRevisionPlan')
  acceptRevisionPlan(@Req() request: ApiRequest) {
    return this.service.acceptRevisionPlan(request);
  }

  @Post('orders/:orderId/cancel')
  @HttpCode(200)
  @Operation('cancelOrder')
  cancelOrder(@Req() request: ApiRequest) {
    return this.service.cancelOrder(request);
  }

  @Post('orders/:orderId/request-extension')
  @HttpCode(200)
  @Operation('requestExtension')
  requestExtension(@Req() request: ApiRequest) {
    return this.service.requestExtension(request);
  }

  @Post('orders/:orderId/accept-extension')
  @HttpCode(200)
  @Operation('acceptExtension')
  acceptExtension(@Req() request: ApiRequest) {
    return this.service.acceptExtension(request);
  }
}
