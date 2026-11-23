import { Injectable, Module } from '@nestjs/common';
import type { Currency, DeliveryMethod } from '@prisma/client';
import { UnitOfWork } from '../../infrastructure/database/prisma.service';
import { fail, requireValue } from '../../common/errors';
import { money } from '../orders/orders-query.service';
@Injectable()
export class ShippingPolicy {
  async options(
    tx: UnitOfWork,
    storeId: string,
    cityId: string,
    areaId: string | null,
    currency: Currency,
  ) {
    const s = requireValue(
      await tx.storefront.findFirst({
        where: {
          id: storeId,
          status: 'PUBLISHED',
          profile: {
            status: 'ACTIVE',
            user: {
              archivedAt: null,
              restriction_user: {
                none: {
                  kind: 'SUSPENSION',
                  revokedAt: null,
                  OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                },
              },
            },
          },
        },
      }),
    );
    if (
      !(await tx.serviceArea.findFirst({
        where: {
          profileId: s.profileId,
          cityId,
          OR: [{ areaId: null }, ...(areaId ? [{ areaId }] : [])],
        },
      }))
    )
      return { store: s, methods: [] };
    const now = (await tx.$queryRaw<{ now: Date }[]>`SELECT transaction_timestamp() AS now`)[0]!
        .now,
      methods = [];
    for (const method of ['SELLER', 'PLATFORM_DRIVER'] as DeliveryMethod[]) {
      if (method === 'SELLER' ? !s.supportsSellerDelivery : !s.supportsPlatformDelivery) continue;
      const rate = await tx.deliveryRate.findFirst({
        where: { cityId, currency, method, effectiveAt: { lte: now } },
        orderBy: [{ effectiveAt: 'desc' }, { version: 'desc' }],
      });
      if (!rate) continue;
      if (method === 'PLATFORM_DRIVER') {
        const city = requireValue(await tx.city.findUnique({ where: { id: cityId } }));
        if (
          !(await tx.driverZone.findFirst({
            where: {
              governorateId: city.governorateId,
              OR: [{ cityId: null }, { cityId }],
              profile: {
                status: 'ACTIVE',
                user: {
                  archivedAt: null,
                  restriction_user: {
                    none: {
                      kind: 'SUSPENSION',
                      revokedAt: null,
                      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
                    },
                  },
                },
              },
            },
          }))
        )
          continue;
      }
      methods.push({
        method,
        fee: money(currency, rate.feeUnits)!,
        promisedAt: new Date(now.getTime() + 48 * 3600000),
        rate,
      });
    }
    return { store: s, methods };
  }
  async selected(
    tx: UnitOfWork,
    storeId: string,
    cityId: string,
    areaId: string | null,
    currency: Currency,
    method: DeliveryMethod,
  ) {
    const options = await this.options(tx, storeId, cityId, areaId, currency);
    const selected = options.methods.find((x) => x.method === method);
    if (!selected) fail('UNSERVICEABLE_ADDRESS', 422);
    return { ...options, selected };
  }
}
@Module({ providers: [ShippingPolicy], exports: [ShippingPolicy] })
export class ShippingPolicyModule {}
