import { LedgerModule, LedgerPostingService } from '../ledger/ledger-posting.service';
import { Injectable, Module } from '@nestjs/common';
import type { Prisma, RoleCode } from '@prisma/client';
import { PrismaService, UnitOfWork } from '../../infrastructure/database/prisma.service';
import { requireValue } from '../../common/errors';
export const profileInclude = {
  profileSkill_profile: true,
  profileLanguage_profile: true,
  portfolioItem_profile: {
    where: { archivedAt: null },
    include: { file: true },
    orderBy: { position: 'asc' as const },
  },
} satisfies Prisma.BusinessProfileInclude;
export type ProfileRow = Prisma.BusinessProfileGetPayload<{ include: typeof profileInclude }>;
export function profileDto(p: ProfileRow) {
  return {
    id: p.id,
    userId: p.userId,
    type: p.type,
    status: p.status,
    title: p.title,
    bio: p.bio,
    cityId: p.cityId,
    trade: p.trade,
    experienceYears: p.experienceYears,
    skills: p.profileSkill_profile.map((s) => s.name),
    languages: p.profileLanguage_profile.map((l) => ({
      languageCode: l.languageCode,
      proficiency: l.proficiency,
    })),
    portfolio: p.portfolioItem_profile.map((x) => ({
      id: x.id,
      kind: x.kind,
      title: x.title,
      caption: x.caption,
      url: x.url,
      file: x.file ? fileDto(x.file) : null,
      position: x.position,
    })),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}
export function fileDto(f: {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: bigint;
  accessClass: string;
  scanStatus: string;
  createdAt: Date;
}) {
  return {
    id: f.id,
    originalName: f.originalName,
    mimeType: f.mimeType,
    sizeBytes: f.sizeBytes.toString(),
    accessClass: f.accessClass,
    scanStatus: f.scanStatus,
    createdAt: f.createdAt,
  };
}
@Injectable()
export class UsersService {
  async setBusinessRole(tx: UnitOfWork, userId: string, code?: RoleCode) {
    await tx.userRole.updateMany({
      where: {
        userId,
        role: { code: { in: ['FREELANCER', 'PROFESSIONAL', 'STORE_OWNER', 'DELIVERY_DRIVER'] } },
      },
      data: { revokedAt: new Date() },
    });
    if (code) {
      const role = await tx.role.upsert({
        where: { code },
        create: { code, name: code },
        update: {},
      });
      await tx.userRole.upsert({
        where: { userId_roleId: { userId, roleId: role.id } },
        create: { userId, roleId: role.id },
        update: { revokedAt: null },
      });
    }
  }
  constructor(
    private readonly db: PrismaService,
    private readonly ledger: LedgerPostingService,
  ) {}
  async dto(id: string, tx: UnitOfWork = this.db) {
    const u = requireValue(
      await tx.user.findUnique({
        where: { id },
        include: {
          userRole_user: { where: { revokedAt: null }, include: { role: true } },
          restriction_user: {
            where: {
              revokedAt: null,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
          },
          businessProfile_user: { where: { status: 'ACTIVE' }, include: profileInclude },
        },
      }),
    );
    return {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      locale: u.locale,
      restrictions: u.restriction_user,
      roles: u.userRole_user.map((r) => r.role.code),
      activeBusinessProfile: u.businessProfile_user[0]
        ? profileDto(u.businessProfile_user[0])
        : null,
    };
  }
  async initialize(tx: UnitOfWork, id: string, businessRole?: RoleCode | null) {
    for (const code of new Set<RoleCode>(['CUSTOMER', ...(businessRole ? [businessRole] : [])])) {
      const role = await tx.role.upsert({
        where: { code },
        update: {},
        create: { code, name: code },
      });
      await tx.userRole.create({ data: { userId: id, roleId: role.id } });
    }
    for (const currency of ['SYP', 'USD'] as const) {
      await this.ledger.wallet(tx, id, currency);
    }
  }
  async update(id: string, b: { displayName?: string; locale?: string }) {
    await this.db.user.update({ where: { id }, data: b });
    return this.dto(id);
  }
}
@Module({ imports: [LedgerModule], providers: [UsersService], exports: [UsersService] })
export class UsersModule {}
