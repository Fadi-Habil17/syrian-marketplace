import { Injectable, Module } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Actor } from '../../common/actor';
import { UnitOfWork } from '../../infrastructure/database/prisma.service';
import { fail, requireValue } from '../../common/errors';
import { randomUUID } from 'node:crypto';
import { requestContext } from '../../common/request-context';
import { fileDto } from '../users/users.service';
export const caseInclude = {
  caseParty_case: true,
  caseEvidence_case: { include: { file: true }, orderBy: { createdAt: 'asc' as const }, take: 100 },
  order: { include: { sellerProfile: true } },
} satisfies Prisma.CaseRecordInclude;
export type CaseRow = Prisma.CaseRecordGetPayload<{ include: typeof caseInclude }>;
export const evidenceDto = (e: any) => ({ ...e, files: e.file ? [fileDto(e.file)] : [] });
@Injectable()
export class CaseAccess {
  async read(tx: UnitOfWork, id: string, actor: Actor) {
    const c = requireValue(await tx.caseRecord.findUnique({ where: { id }, include: caseInclude }));
    if (
      ![c.order.buyerId, c.order.sellerProfile.userId].includes(actor.id) &&
      !(actor.roles.includes('ADMIN') && c.handlingAdminId === actor.id)
    )
      fail('NOT_FOUND', 404);
    if (c.handlingAdminId === actor.id && actor.roles.includes('ADMIN'))
      await tx.auditRecord.create({
        data: {
          actorId: actor.id,
          aggregateId: c.id,
          action: 'case.private_read',
          requestId: requestContext.getStore()?.requestId ?? randomUUID(),
          metadata: { orderId: c.orderId },
        },
      });
    return c;
  }
  party(c: CaseRow, actor: Actor) {
    if (![c.order.buyerId, c.order.sellerProfile.userId].includes(actor.id)) fail('FORBIDDEN', 403);
  }
  dto(c: CaseRow, actor: Actor) {
    return {
      ...c,
      parties: c.caseParty_case,
      evidence: c.caseEvidence_case
        .filter(
          (e) =>
            e.visibility === 'SHARED' ||
            e.submitterId === actor.id ||
            (c.handlingAdminId === actor.id && actor.roles.includes('ADMIN')),
        )
        .map(evidenceDto),
    };
  }
}
@Module({ providers: [CaseAccess], exports: [CaseAccess] })
export class CaseAccessModule {}
