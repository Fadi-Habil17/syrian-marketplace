import { Injectable, Module } from '@nestjs/common';
import type { JobKind } from '@prisma/client';
import { UnitOfWork } from '../../infrastructure/database/prisma.service';
@Injectable()
export class DeadlinesService {
  async now(tx: UnitOfWork) {
    return (await tx.$queryRaw<{ now: Date }[]>`SELECT transaction_timestamp() AS now`)[0]!.now;
  }
  async schedule(
    tx: UnitOfWork,
    orderId: string,
    kind: JobKind,
    dueAt: Date,
    version: number,
    caseId?: string,
  ) {
    const operationKey = `${orderId}:${kind}:${dueAt.getTime()}:${caseId ?? ''}`;
    return tx.scheduledJob.upsert({
      where: { operationKey },
      update: {},
      create: { orderId, kind, dueAt, deadlineVersion: version, caseId, operationKey },
    });
  }
}
@Module({ providers: [DeadlinesService], exports: [DeadlinesService] })
export class DeadlinesModule {}
