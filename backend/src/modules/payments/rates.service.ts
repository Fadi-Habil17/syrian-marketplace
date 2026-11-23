import { Injectable, Module } from '@nestjs/common';
import type { Workspace } from '@prisma/client';
import { UnitOfWork } from '../../infrastructure/database/prisma.service';
@Injectable()
export class CommissionRates {
  async configure(
    tx: UnitOfWork,
    adminId: string,
    workspace: Workspace | null,
    basisPoints: number,
  ) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'commission:' + workspace}))`;
    const last = await tx.commissionRate.findFirst({
      where: { workspace },
      orderBy: { version: 'desc' },
    });
    return tx.commissionRate.create({
      data: { adminId, workspace, basisPoints, version: (last?.version ?? 0) + 1 },
    });
  }
}
@Module({ providers: [CommissionRates], exports: [CommissionRates] })
export class CommissionRatesModule {}
