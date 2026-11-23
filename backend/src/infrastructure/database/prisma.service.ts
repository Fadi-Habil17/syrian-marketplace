import { Global, Injectable, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

export type UnitOfWork = Prisma.TransactionClient;
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
  async atomic<T>(work: (tx: UnitOfWork) => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.$transaction(work, {
          isolationLevel: 'Serializable',
          maxWait: 5000,
          timeout: 20000,
        });
      } catch (e) {
        const retryable =
          e instanceof Prisma.PrismaClientKnownRequestError &&
          (['P2034', 'P2002'].includes(e.code) ||
            (e.code === 'P2010' && ['40001', '40P01'].includes(String(e.meta?.code))));
        if (!retryable || attempt >= 2) throw e;
      }
    }
  }
  async lockUsers(tx: UnitOfWork, users: string[]) {
    for (const id of [...new Set(users)].sort())
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id"=${id}::uuid FOR UPDATE`;
  }
}
@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class DatabaseModule {}
