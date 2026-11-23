import { CatalogService } from '../catalog/catalog.service';
import { StoresService } from '../stores/stores.service';
import { Injectable } from '@nestjs/common';
import { ApiRequest } from '../../common/actor';
import { AccessService } from '../../common/access.service';
import { CommandsService } from '../../common/commands.service';
import { fail, requireValue } from '../../common/errors';
import { page, pageArgs } from '../../common/pagination';
import { PrismaService, UnitOfWork } from '../../infrastructure/database/prisma.service';
import { profileDto, profileInclude, UsersService } from '../users/users.service';
@Injectable()
export class ProfilesService {
  constructor(
    private readonly db: PrismaService,
    private readonly access: AccessService,
    private readonly commands: CommandsService,
    private readonly users: UsersService,
    private readonly catalog: CatalogService,
    private readonly stores: StoresService,
  ) {}
  getMe(r: ApiRequest) {
    return this.users.dto(r.actor.id);
  }
  updateMe(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      await tx.user.update({ where: { id: r.actor.id }, data: r.body });
      await this.commands.audit(tx, r.actor.id, r.actor.id, 'user.updated');
      return this.users.dto(r.actor.id, tx);
    });
  }
  async listOwnBusinessProfiles(r: ApiRequest) {
    const q = r.query;
    return page(
      (
        await this.db.businessProfile.findMany({
          where: { userId: r.actor.id },
          include: profileInclude,
          ...pageArgs(q, r.actor.id),
        })
      ).map(profileDto),
      q,
      r.actor.id,
    );
  }
  createBusinessProfile(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const { skills, languages, ...b } = r.body;
      if (await tx.businessProfile.findFirst({ where: { userId: r.actor.id, type: b.type } }))
        fail('INVALID_TRANSITION');
      const p = await tx.businessProfile.create({
        data: {
          ...b,
          userId: r.actor.id,
          status: 'DRAFT',
          profileSkill_profile: { create: skills.map((name: string) => ({ name })) },
          profileLanguage_profile: { create: languages },
        },
        include: profileInclude,
      });
      await this.commands.audit(tx, r.actor.id, p.id, 'profile.created');
      return profileDto(p);
    });
  }
  updateBusinessProfile(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const p = await this.access.ownedProfile(r.params.profileId!, r.actor, tx);
      if (p.status === 'SUSPENDED' || p.status === 'ARCHIVED') fail('WORKSPACE_INACTIVE', 403);
      const { skills, languages, ...data } = r.body;
      await tx.profileSkill.deleteMany({ where: { profileId: p.id } });
      await tx.profileLanguage.deleteMany({ where: { profileId: p.id } });
      const updated = await tx.businessProfile.update({
        where: { id: p.id },
        data: {
          ...data,
          profileSkill_profile: { create: skills.map((name: string) => ({ name })) },
          profileLanguage_profile: { create: languages },
        },
        include: profileInclude,
      });
      await this.commands.audit(tx, r.actor.id, p.id, 'profile.updated');
      return profileDto(updated);
    });
  }
  private async eligible(tx: UnitOfWork, userId: string) {
    const participant = { OR: [{ buyerId: userId }, { sellerProfile: { userId } }] };
    if (
      (await tx.marketOrder.count({
        where: {
          ...participant,
          state: { notIn: ['DRAFT', 'COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED', 'REFUNDED'] },
        },
      })) ||
      (await tx.escrow.count({ where: { heldUnits: { gt: 0 }, order: participant } })) ||
      (await tx.caseRecord.count({
        where: {
          kind: { not: 'SUPPORT' },
          status: { in: ['OPEN', 'ADMIN_REVIEW'] },
          order: participant,
        },
      })) ||
      (await tx.driverAssignment.count({
        where: {
          driver: { userId },
          OR: [
            { status: { in: ['ASSIGNED', 'PICKED_UP'] } },
            {
              status: 'COMPLETED',
              delivery: { storeOrder: { order: { settlement_order: null } } },
            },
          ],
        },
      }))
    )
      fail('WORKSPACE_SWITCH_BLOCKED');
  }
  private async switch(tx: UnitOfWork, r: ApiRequest, target: string, id?: string) {
    await this.eligible(tx, r.actor.id);
    const active = await tx.businessProfile.findFirst({
      where: { userId: r.actor.id, status: 'ACTIVE' },
    });
    let p =
      target === 'CUSTOMER'
        ? null
        : requireValue(
            await tx.businessProfile.findFirst({
              where: { userId: r.actor.id, ...(id ? { id } : { type: target as any }) },
              include: profileInclude,
            }),
          );
    if (p?.status === 'SUSPENDED') fail('ACCOUNT_RESTRICTED', 403);
    if (active && active.id !== p?.id) {
      await tx.businessProfile.update({
        where: { id: active.id },
        data: { status: 'ARCHIVED', archivedAt: new Date() },
      });
      await this.catalog.archiveOffers(tx, active.id);
      await this.stores.archiveForProfile(tx, active.id);
    }
    if (p) {
      if (
        !p.title.trim() ||
        !p.bio.trim() ||
        (p.type === 'PROFESSIONAL' && (!p.cityId || !p.trade))
      )
        fail('INVALID_INPUT', 400);
      p = await tx.businessProfile.update({
        where: { id: p.id },
        data: { status: 'ACTIVE', archivedAt: null },
        include: profileInclude,
      });
    }
    await this.users.setBusinessRole(tx, r.actor.id, p?.type);
    await this.commands.audit(tx, r.actor.id, p?.id ?? r.actor.id, 'workspace.switched', {
      target,
    });
    return {
      user: await this.users.dto(r.actor.id, tx),
      archivedProfileId: active && active.id !== p?.id ? active.id : null,
      blockers: [],
    };
  }
  switchBusinessWorkspace(r: ApiRequest) {
    return this.commands.run(r, (tx) => this.switch(tx, r, r.body.target));
  }
  reactivateBusinessProfile(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const p = await this.access.ownedProfile(r.params.profileId!, r.actor, tx);
      if (p.status !== 'ARCHIVED' && p.status !== 'DRAFT') fail('INVALID_TRANSITION');
      return this.switch(tx, r, p.type, p.id);
    });
  }
  async getPublicProfile(r: ApiRequest) {
    const p = requireValue(
      await this.db.businessProfile.findFirst({
        where: {
          id: r.params.profileId,
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
        include: profileInclude,
      }),
    );
    return { ...profileDto(p), ratingAverage: p.ratingAverage, reviewCount: p.reviewCount };
  }
  createPortfolioItem(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const p = await this.access.ownedProfile(r.params.profileId!, r.actor, tx);
      if (p.status !== 'ACTIVE') fail('WORKSPACE_INACTIVE', 403);
      if (r.body.url && !['http:', 'https:'].includes(new URL(r.body.url).protocol))
        fail('INVALID_INPUT', 400);
      if (r.body.fileId)
        await this.access.cleanFiles([r.body.fileId], r.actor, 'PUBLIC_CATALOG', tx);
      const item = await tx.portfolioItem.create({
        data: { ...r.body, profileId: p.id },
        include: { file: true },
      });
      await this.commands.audit(tx, r.actor.id, p.id, 'portfolio.created');
      return { ...item, file: item.file };
    });
  }
  removePortfolioItem(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      await this.access.ownedProfile(r.params.profileId!, r.actor, tx);
      const p = requireValue(
        await tx.portfolioItem.findFirst({
          where: { id: r.params.itemId, profileId: r.params.profileId },
        }),
      );
      await tx.portfolioItem.update({ where: { id: p.id }, data: { archivedAt: new Date() } });
      await this.commands.audit(tx, r.actor.id, r.params.profileId!, 'portfolio.removed', {
        itemId: p.id,
      });
    });
  }
  async listServiceAreas(r: ApiRequest) {
    await this.access.ownedProfile(r.params.profileId!, r.actor);
    return page(
      await this.db.serviceArea.findMany({
        where: { profileId: r.params.profileId },
        ...pageArgs(r.query, r.actor.id),
      }),
      r.query,
      r.actor.id,
    );
  }
  addServiceArea(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const p = await this.access.ownedProfile(r.params.profileId!, r.actor, tx);
      if (p.status !== 'ACTIVE') fail('WORKSPACE_INACTIVE', 403);
      const a = await tx.serviceArea.create({ data: { ...r.body, profileId: p.id } });
      await this.commands.audit(tx, r.actor.id, p.id, 'service-area.added');
      return a;
    });
  }
  removeServiceArea(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      await this.access.ownedProfile(r.params.profileId!, r.actor, tx);
      const a = requireValue(
        await tx.serviceArea.findFirst({
          where: { id: r.params.areaId, profileId: r.params.profileId },
        }),
      );
      await tx.serviceArea.delete({ where: { id: a.id } });
      await this.commands.audit(tx, r.actor.id, r.params.profileId!, 'service-area.removed');
    });
  }
  async moderate(tx: UnitOfWork, id: string, outcome: string) {
    const p = requireValue(await tx.businessProfile.findUnique({ where: { id } }));
    return tx.businessProfile.update({
      where: { id },
      data: {
        status: ['HIDE', 'REJECT'].includes(outcome)
          ? 'SUSPENDED'
          : p.status === 'SUSPENDED'
            ? 'DRAFT'
            : p.status,
      },
    });
  }
  async inspect(tx: UnitOfWork, id: string) {
    return profileDto(
      requireValue(await tx.businessProfile.findUnique({ where: { id }, include: profileInclude })),
    );
  }
}
