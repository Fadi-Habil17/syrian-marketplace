import { Injectable } from '@nestjs/common';
import { ApiRequest } from '../../common/actor';
import { CommandsService } from '../../common/commands.service';
import { requireValue, fail } from '../../common/errors';
import { page, pageArgs } from '../../common/pagination';
import { PrismaService, UnitOfWork } from '../../infrastructure/database/prisma.service';
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
      await this.db.city.findMany({
        where: { governorateId: r.query.governorateId as string },
        ...pageArgs(r.query, 'cities', [{ nameEn: 'asc' }, { id: 'asc' }]),
      }),
      r.query,
      'cities',
    );
  }
  async listAreas(r: ApiRequest) {
    return page(
      await this.db.area.findMany({
        where: { cityId: r.query.cityId as string },
        ...pageArgs(r.query, 'areas', [{ nameEn: 'asc' }, { id: 'asc' }]),
      }),
      r.query,
      'areas',
    );
  }
  async listAddresses(r: ApiRequest) {
    return page(
      await this.db.address.findMany({
        where: { userId: r.actor.id, archivedAt: null },
        ...pageArgs(r.query, r.actor.id),
      }),
      r.query,
      r.actor.id,
    );
  }
  async validateLocation(cityId: string, areaId?: string | null, tx: UnitOfWork = this.db) {
    requireValue(await tx.city.findUnique({ where: { id: cityId } }));
    if (areaId && !(await tx.area.findFirst({ where: { id: areaId, cityId } })))
      fail('INVALID_INPUT', 400);
  }
  async ownedAddress(id: string, userId: string, tx: UnitOfWork = this.db) {
    return requireValue(await tx.address.findFirst({ where: { id, userId, archivedAt: null } }));
  }
  async serviceable(
    profileId: string,
    cityId: string,
    areaId: string | null,
    tx: UnitOfWork = this.db,
  ) {
    if (
      !(await tx.serviceArea.findFirst({
        where: { profileId, cityId, OR: [{ areaId: null }, ...(areaId ? [{ areaId }] : [])] },
      }))
    )
      fail('UNSERVICEABLE_ADDRESS', 422);
  }
  createAddress(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      await this.validateLocation(r.body.cityId, r.body.areaId, tx);
      const a = await tx.address.create({ data: { ...r.body, userId: r.actor.id } });
      await this.commands.audit(tx, r.actor.id, a.id, 'address.created');
      return a;
    });
  }
  updateAddress(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const a = await this.ownedAddress(r.params.addressId!, r.actor.id, tx);
      await this.validateLocation(r.body.cityId, r.body.areaId, tx);
      const result = await tx.address.update({ where: { id: a.id }, data: r.body });
      await this.commands.audit(tx, r.actor.id, a.id, 'address.updated');
      return result;
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
