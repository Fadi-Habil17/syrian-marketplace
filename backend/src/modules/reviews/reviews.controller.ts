// Generated thin transport adapter. Edit service policies and route manifest configuration.
import { Controller, Get, Post, Patch, Delete, HttpCode, Req } from '@nestjs/common';
import { ApiRequest, Operation, Public, Roles } from '../../common/actor';
import { ReviewsService } from './reviews.service';
@Controller()
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Public()
  @Get('profiles/:profileId/reviews')
  @HttpCode(200)
  @Operation('listVerifiedReviews')
  listVerifiedReviews(@Req() request: ApiRequest) {
    return this.service.listVerifiedReviews(request);
  }

  @Post('orders/:orderId/review')
  @HttpCode(201)
  @Operation('createReview')
  createReview(@Req() request: ApiRequest) {
    return this.service.createReview(request);
  }

  @Patch('reviews/:reviewId')
  @HttpCode(200)
  @Operation('editReview')
  editReview(@Req() request: ApiRequest) {
    return this.service.editReview(request);
  }
}
