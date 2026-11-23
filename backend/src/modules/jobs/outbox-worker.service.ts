import { Injectable } from '@nestjs/common';
import { OutboxEvent } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { FilesService } from '../files/files.service';
import { EmailDelivery } from '../auth/email-delivery';
import { NotificationDispatcher } from '../notifications/notification-dispatcher.service';
@Injectable()
export class OutboxWorker {
  constructor(
    private readonly db: PrismaService,
    private readonly files: FilesService,
    private readonly mail: EmailDelivery,
    private readonly notices: NotificationDispatcher,
  ) {}
  async claim(limit = 20) {
    return this.db.atomic(async (tx) => {
      const ids = await tx.$queryRaw<
        { id: string }[]
      >`SELECT "id" FROM "OutboxEvent" WHERE "publishedAt" IS NULL AND "attempts"<10 AND ("claimedUntil" IS NULL OR "claimedUntil"<transaction_timestamp()) ORDER BY "createdAt","id" LIMIT ${limit} FOR UPDATE SKIP LOCKED`;
      const until = new Date(Date.now() + 60000);
      await tx.outboxEvent.updateMany({
        where: { id: { in: ids.map((x) => x.id) } },
        data: { claimedUntil: until, attempts: { increment: 1 } },
      });
      return tx.outboxEvent.findMany({ where: { id: { in: ids.map((x) => x.id) } } });
    });
  }
  async process(e: OutboxEvent) {
    const payload = e.payload as Record<string, any>;
    if (e.type === 'file.scan.requested') await this.files.scan(payload.fileId);
    else if (e.type === 'file.removal.requested') await this.files.removeRetained(payload.fileId);
    else if (e.type === 'identity.email') await this.mail.deliverOutbox(e.id);
    else if (e.type !== 'notification.created') await this.notices.materialize(e);
    await this.db.outboxEvent.updateMany({
      where: { id: e.id, publishedAt: null, claimedUntil: e.claimedUntil },
      data: { publishedAt: new Date(), claimedUntil: null },
    });
  }
  async tick(limit = 20) {
    let done = 0;
    for (const e of await this.claim(limit))
      try {
        await this.process(e);
        done++;
      } catch {
        await this.db.outboxEvent.updateMany({
          where: { id: e.id, publishedAt: null, claimedUntil: e.claimedUntil },
          data: { claimedUntil: new Date(Date.now() + Math.min(3600000, 1000 * 2 ** e.attempts)) },
        });
      }
    return done;
  }
}
