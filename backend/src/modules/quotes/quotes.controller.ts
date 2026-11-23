// Generated thin transport adapter. Edit service policies and route manifest configuration.
import { Controller, Get, Post, Patch, Delete, HttpCode, Req } from '@nestjs/common';
import { ApiRequest, Operation, Public, Roles } from '../../common/actor';
import { QuotesService } from './quotes.service';
@Controller()
export class QuotesController {
  constructor(private readonly service: QuotesService) {}

  @Post('orders/inspection-requests')
  @HttpCode(201)
  @Operation('requestInspectionQuote')
  requestInspectionQuote(@Req() request: ApiRequest) {
    return this.service.requestInspectionQuote(request);
  }

  @Get('orders/:orderId/quotes')
  @HttpCode(200)
  @Operation('listOrderQuotes')
  listOrderQuotes(@Req() request: ApiRequest) {
    return this.service.listOrderQuotes(request);
  }

  @Post('orders/:orderId/quotes')
  @HttpCode(201)
  @Operation('sendQuote')
  sendQuote(@Req() request: ApiRequest) {
    return this.service.sendQuote(request);
  }

  @Post('quotes/:quoteId/approve')
  @HttpCode(200)
  @Operation('approveQuote')
  approveQuote(@Req() request: ApiRequest) {
    return this.service.approveQuote(request);
  }

  @Post('quotes/:quoteId/reject')
  @HttpCode(200)
  @Operation('rejectQuote')
  rejectQuote(@Req() request: ApiRequest) {
    return this.service.rejectQuote(request);
  }

  @Post('orders/:orderId/inspection-schedule')
  @HttpCode(200)
  @Operation('agreeInspectionSchedule')
  agreeInspectionSchedule(@Req() request: ApiRequest) {
    return this.service.agreeInspectionSchedule(request);
  }
}
