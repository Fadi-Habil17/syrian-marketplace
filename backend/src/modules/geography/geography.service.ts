import { centerOf, coverageWhere } from './public-location';
import { Injectable } from '@nestjs/common';
import { ApiRequest } from '../../common/actor';
import { CommandsService } from '../../common/commands.service';
import { requireValue, fail } from '../../common/errors';
import { page, pageArgs } from '../../common/pagination';
import { PrismaService, UnitOfWork } from '../../infrastructure/database/prisma.service';
type Pin = { latitude: number; longitude: number };
function pinFields({ pin, ...address }: ApiRequest['body']) {
  if (pin === undefined) return address;
  return {
    ...address,
    latitude: (pin as Pin | null)?.latitude ?? null,
    longitude: (pin as Pin | null)?.longitude ?? null,
  };
}
function addressDto({
  latitude,
  longitude,
  id,
  label,
  details,
  cityId,
  areaId,
  createdAt,
  contactName,
  contactPhone,
}: import('@prisma/client').Address) {
  return {
    id,
    label,
    details,
    cityId,
    areaId,
    createdAt,
    contactName,
    contactPhone,
    pin: latitude === null || longitude === null ? null : { latitude, longitude },
  };
}
@Injectable()
export class GeographyService {
  constructor(
    private readonly db: PrismaService,
    private readonly commands: CommandsService,
  ) {}
  async listGovernorates(r: ApiRequest) {
    return page(
      await this.db.governorate.findMany(
        pageArgs(r.query, 'governorates', [{ nameEn: 'asc' }, { id: 'asc' }]),
      ),
      r.query,
      'governorates',
    );
  }
  async listCities(r: ApiRequest) {
    return page(
      (
        await this.db.city.findMany({
          where: { governorateId: r.query.governorateId as string },
          ...pageArgs(r.query, 'cities', [{ nameEn: 'asc' }, { id: 'asc' }]),
        })
      ).map((c) => ({ ...c, center: centerOf(c) })),
      r.query,
      'cities',
    );
  }
  async listAreas(r: ApiRequest) {
    return page(
      (
        await this.db.area.findMany({
          where: { cityId: r.query.cityId as string },
          ...pageArgs(r.query, 'areas', [{ nameEn: 'asc' }, { id: 'asc' }]),
        })
      ).map((c) => ({ ...c, center: centerOf(c) })),
      r.query,
      'areas',
    );
  }
  async listAddresses(r: ApiRequest) {
    return page(
      (
        await this.db.address.findMany({
          where: { userId: r.actor.id, archivedAt: null },
          ...pageArgs(r.query, r.actor.id),
        })
      ).map(addressDto),
      r.query,
      r.actor.id,
    );
  }
  async validateLocation(cityId: string, areaId?: string | null, tx: UnitOfWork = this.db) {
    const city = requireValue(await tx.city.findUnique({ where: { id: cityId } }));
    const area = areaId ? await tx.area.findFirst({ where: { id: areaId, cityId } }) : null;
    if (areaId && !area) fail('INVALID_INPUT', 400);
    return { city, area, center: centerOf(area) ?? centerOf(city) };
  }
  async ownedAddress(id: string, userId: string, tx: UnitOfWork = this.db) {
    return addressDto(
      requireValue(await tx.address.findFirst({ where: { id, userId, archivedAt: null } })),
    );
  }
  async serviceable(
    profileId: string,
    cityId: string,
    areaId: string | null,
    tx: UnitOfWork = this.db,
  ) {
    if (
      !(await tx.serviceArea.findFirst({
        where: { profileId, ...coverageWhere(cityId, areaId) },
      }))
    )
      fail('UNSERVICEABLE_ADDRESS', 422);
  }
  createAddress(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      await this.validateLocation(r.body.cityId, r.body.areaId, tx);
      const a = await tx.address.create({ data: { ...pinFields(r.body), userId: r.actor.id } });
      await this.commands.audit(tx, r.actor.id, a.id, 'address.created');
      return addressDto(a);
    });
  }
  updateAddress(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const a = await this.ownedAddress(r.params.addressId!, r.actor.id, tx);
      const areaId =
        r.body.areaId === undefined && r.body.cityId === a.cityId
          ? a.areaId
          : (r.body.areaId ?? null);
      await this.validateLocation(r.body.cityId, areaId, tx);
      const result = await tx.address.update({
        where: { id: a.id },
        data: { ...pinFields(r.body), areaId },
      });
      await this.commands.audit(tx, r.actor.id, a.id, 'address.updated');
      return addressDto(result);
    });
  }
  archiveAddress(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const a = await this.ownedAddress(r.params.addressId!, r.actor.id, tx);
      await tx.address.update({ where: { id: a.id }, data: { archivedAt: new Date() } });
      await this.commands.audit(tx, r.actor.id, a.id, 'address.archived');
    });
  }
}
