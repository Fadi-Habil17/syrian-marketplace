import { Injectable } from '@nestjs/common';
import { ApiRequest } from '../../common/actor';
import { CommandsService } from '../../common/commands.service';
import { fail, requireValue } from '../../common/errors';
import { page, pageArgs } from '../../common/pagination';
import { PrismaService } from '../../infrastructure/database/prisma.service';
@Injectable()
export class NotificationsService {
  constructor(
    private readonly db: PrismaService,
    private readonly commands: CommandsService,
  ) {}
  async listNotifications(r: ApiRequest) {
    return page(
      await this.db.notification.findMany({
        where: {
          userId: r.actor.id,
          channel: 'IN_APP',
          ...((r.query.unread as unknown) === true
            ? { readAt: null }
            : (r.query.unread as unknown) === false
              ? { readAt: { not: null } }
              : {}),
        },
        ...pageArgs(r.query, r.actor.id),
      }),
      r.query,
      r.actor.id,
    );
  }
  readNotification(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const n = requireValue(
        await tx.notification.findFirst({
          where: { id: r.params.notificationId, userId: r.actor.id },
        }),
      );
      return n.readAt
        ? n
        : tx.notification.update({ where: { id: n.id }, data: { readAt: new Date() } });
    });
  }
  readAllNotifications(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      await tx.notification.updateMany({
        where: { userId: r.actor.id, readAt: null },
        data: { readAt: new Date() },
      });
      return {
        id: r.actor.id,
        status: 'SUCCEEDED',
        resourceId: r.actor.id,
        errorCode: null,
        simulated: true,
      };
    });
  }
  registerDevice(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const b = r.body;
      if (!/^ExponentPushToken\[[\w-]+\]$|^ExpoPushToken\[[\w-]+\]$/.test(b.token))
        fail('INVALID_INPUT', 400);
      const existing = await tx.deviceToken.findUnique({ where: { token: b.token } });
      if (existing && existing.userId !== r.actor.id && !existing.revokedAt) fail('FORBIDDEN', 403);
      const d = await tx.deviceToken.upsert({
        where: { token: b.token },
        create: { userId: r.actor.id, token: b.token, platform: b.platform },
        update: { userId: r.actor.id, platform: b.platform, revokedAt: null },
      });
      await this.commands.audit(tx, r.actor.id, d.id, 'device.registered');
      return d;
    });
  }
  revokeDevice(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const d = requireValue(
        await tx.deviceToken.findFirst({ where: { id: r.params.deviceId, userId: r.actor.id } }),
      );
      await tx.deviceToken.update({ where: { id: d.id }, data: { revokedAt: new Date() } });
      await this.commands.audit(tx, r.actor.id, d.id, 'device.revoked');
    });
  }
}
