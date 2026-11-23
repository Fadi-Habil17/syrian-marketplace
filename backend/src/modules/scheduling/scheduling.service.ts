import { Injectable, Module } from '@nestjs/common';
import { fail } from '../../common/errors';
import { UnitOfWork } from '../../infrastructure/database/prisma.service';
@Injectable()
export class SchedulingService {
  validate(startsAt: Date, endsAt: Date, now: Date) {
    if (
      !Number.isFinite(startsAt.getTime()) ||
      startsAt <= now ||
      endsAt <= startsAt ||
      [startsAt, endsAt].some(
        (d) =>
          d.getUTCMinutes() % 30 !== 0 || d.getUTCSeconds() !== 0 || d.getUTCMilliseconds() !== 0,
      )
    )
      fail('INVALID_INPUT', 400);
  }
  async reserve(
    tx: UnitOfWork,
    serviceOrderId: string,
    providerId: string,
    startsAt: Date,
    endsAt: Date,
  ) {
    if (
      await tx.scheduleReservation.findFirst({
        where: {
          providerId,
          serviceOrderId: { not: serviceOrderId },
          status: 'RESERVED',
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
        },
      })
    )
      fail('BOOKING_NOT_CONFIRMED');
    await this.release(tx, serviceOrderId);
    return tx.scheduleReservation.create({
      data: { serviceOrderId, providerId, startsAt, endsAt },
    });
  }
  async release(tx: UnitOfWork, serviceOrderId: string) {
    await tx.scheduleReservation.updateMany({
      where: { serviceOrderId, status: 'RESERVED' },
      data: { status: 'RELEASED' },
    });
  }
}
@Module({ providers: [SchedulingService], exports: [SchedulingService] })
export class SchedulingModule {}
