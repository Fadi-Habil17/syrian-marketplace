// Generated thin transport adapter. Edit service policies and route manifest configuration.
import { Controller, Get, Post, Patch, Delete, HttpCode, Req } from '@nestjs/common';
import { ApiRequest, Operation, Public, Roles } from '../../common/actor';
import { BookingsService } from './bookings.service';
@Controller()
export class BookingsController {
  constructor(private readonly service: BookingsService) {}

  @Post('orders/professional-bookings')
  @HttpCode(201)
  @Operation('createBooking')
  createBooking(@Req() request: ApiRequest) {
    return this.service.createBooking(request);
  }

  @Post('orders/:orderId/accept-booking')
  @HttpCode(200)
  @Operation('acceptBooking')
  acceptBooking(@Req() request: ApiRequest) {
    return this.service.acceptBooking(request);
  }

  @Post('orders/:orderId/propose-schedule')
  @HttpCode(200)
  @Operation('proposeSchedule')
  proposeSchedule(@Req() request: ApiRequest) {
    return this.service.proposeSchedule(request);
  }

  @Post('orders/:orderId/accept-schedule')
  @HttpCode(200)
  @Operation('acceptSchedule')
  acceptSchedule(@Req() request: ApiRequest) {
    return this.service.acceptSchedule(request);
  }
}
