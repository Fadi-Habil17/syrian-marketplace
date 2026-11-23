import { Injectable, Module } from '@nestjs/common';
import type { Currency, DeliveryMethod } from '@prisma/client';
import { UnitOfWork } from '../../infrastructure/database/prisma.service';
import { fail, requireValue } from '../../common/errors';
@Injectable()
export class DeliveryConfig {
  async rate(
    tx: UnitOfWork,
    adminId: string,
    b: { cityId: string; method: DeliveryMethod; currency: Currency; feeUnits: string },
  ) {
    requireValue(await tx.city.findUnique({ where: { id: b.cityId } }));
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'shipping:' + b.cityId + ':' + b.method + ':' + b.currency}))`;
    const last = await tx.deliveryRate.findFirst({
      where: { cityId: b.cityId, method: b.method, currency: b.currency },
      orderBy: { version: 'desc' },
    });
    return tx.deliveryRate.create({
      data: { ...b, feeUnits: BigInt(b.feeUnits), adminId, version: (last?.version ?? 0) + 1 },
    });
  }
  async zone(
    tx: UnitOfWork,
    b: { driverProfileId: string; governorateId: string; cityId?: string | null },
  ) {
    const p = requireValue(
      await tx.businessProfile.findFirst({
        where: { id: b.driverProfileId, type: 'DELIVERY_DRIVER' },
      }),
    );
    requireValue(await tx.governorate.findUnique({ where: { id: b.governorateId } }));
    if (
      b.cityId &&
      !(await tx.city.findFirst({ where: { id: b.cityId, governorateId: b.governorateId } }))
    )
      fail('INVALID_INPUT', 400);
    const data = { profileId: p.id, governorateId: b.governorateId, cityId: b.cityId ?? null };
    return (await tx.driverZone.findFirst({ where: data })) ?? tx.driverZone.create({ data });
  }
  async remove(tx: UnitOfWork, id: string) {
    const z = requireValue(await tx.driverZone.findUnique({ where: { id } }));
    if (
      await tx.driverAssignment.findFirst({
        where: { driverId: z.profileId, status: { in: ['ASSIGNED', 'PICKED_UP'] } },
      })
    )
      fail('DRIVER_UNAVAILABLE');
    await tx.driverZone.delete({ where: { id } });
    return z;
  }
}
@Module({ providers: [DeliveryConfig], exports: [DeliveryConfig] })
export class DeliveryConfigModule {}
