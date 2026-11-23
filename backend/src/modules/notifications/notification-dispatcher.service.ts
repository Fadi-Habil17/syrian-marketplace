import { Injectable } from '@nestjs/common';
import { OutboxEvent, Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ExpoPush } from './expo-push.service';
@Injectable()
export class NotificationDispatcher {
  constructor(
    private readonly db: PrismaService,
    private readonly push: ExpoPush,
  ) {}
  async materialize(e: OutboxEvent) {
    return this.db.atomic(async (tx) => {
      const payload = e.payload as Record<string, any>,
        o = await tx.marketOrder.findUnique({
          where: { id: e.aggregateId },
          include: {
            sellerProfile: true,
            storeOrder_order: {
              include: {
                delivery_storeOrder: {
                  include: {
                    city: true,
                    driverAssignment_delivery: {
                      where: { status: { in: ['ASSIGNED', 'PICKED_UP'] } },
                      include: { driver: true },
                    },
                  },
                },
              },
            },
          },
        });
      if (!o) return;
      const recipients = new Set([o.buyerId, o.sellerProfile.userId]),
        d = o.storeOrder_order?.delivery_storeOrder;
      if (d && e.type !== 'case.updated')
        for (const a of d.driverAssignment_delivery) recipients.add(a.driver.userId);
      if (e.type === 'chat.message.created') {
        const room = await tx.chatRoom.findUnique({ where: { id: payload.roomId } });
        if (room?.kind !== 'DELIVERY' && d)
          for (const a of d.driverAssignment_delivery) recipients.delete(a.driver.userId);
        recipients.delete(payload.senderId);
      }
      if (e.type === 'case.updated') {
        const c = await tx.caseRecord.findUnique({ where: { id: payload.caseId } });
        if (c?.handlingAdminId) recipients.add(c.handlingAdminId);
        else
          for (const a of await tx.userRole.findMany({
            where: { revokedAt: null, role: { code: 'ADMIN' }, user: { archivedAt: null } },
          }))
            recipients.add(a.userId);
      }
      if (e.type === 'order.updated' && d?.status === 'REQUESTED') {
        const zones = await tx.driverZone.findMany({
          where: {
            governorateId: d.city.governorateId,
            OR: [{ cityId: null }, { cityId: d.cityId }],
            profile: {
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
          },
          include: { profile: true },
        });
        for (const z of zones) recipients.add(z.profile.userId);
      }
      for (const userId of recipients) {
        const resourceId = e.type === 'case.updated' ? payload.caseId : o.id;
        const n = await tx.notification.upsert({
          where: { userId_eventId_channel: { userId, eventId: e.id, channel: 'IN_APP' } },
          create: { userId, eventId: e.id, channel: 'IN_APP', category: e.type, resourceId },
          update: {},
        });
        await tx.outboxEvent.upsert({
          where: { deduplicationKey: `notice:${n.id}` },
          create: {
            aggregateId: o.id,
            aggregateVersion: e.aggregateVersion,
            type: 'notification.created',
            deduplicationKey: `notice:${n.id}`,
            payload: { notificationId: n.id },
          },
          update: {},
        });
        const devices = await tx.deviceToken.findMany({ where: { userId, revokedAt: null } });
        for (const device of devices)
          await tx.notificationDelivery.upsert({
            where: {
              notificationId_channel_deviceId: {
                notificationId: n.id,
                channel: 'PUSH',
                deviceId: device.id,
              },
            },
            create: { notificationId: n.id, channel: 'PUSH', deviceId: device.id },
            update: {},
          });
      }
    });
  }
  async pushTick(limit = 20) {
    const rows = await this.db.atomic(async (tx) => {
      const ids = await tx.$queryRaw<
        { id: string }[]
      >`SELECT "id" FROM "NotificationDelivery" WHERE "status"='PENDING' AND "nextAttemptAt"<=transaction_timestamp() ORDER BY "nextAttemptAt","id" LIMIT ${limit} FOR UPDATE SKIP LOCKED`;
      const lease = new Date(Date.now() + 60000);
      await tx.notificationDelivery.updateMany({
        where: { id: { in: ids.map((x) => x.id) } },
        data: { nextAttemptAt: lease, attempts: { increment: 1 } },
      });
      return tx.notificationDelivery.findMany({
        where: { id: { in: ids.map((x) => x.id) } },
        include: { notification: true, device: true },
      });
    });
    for (const row of rows) {
      try {
        if (!row.device || row.device.revokedAt || process.env.EXPO_PUSH_ENABLED !== 'true') {
          await this.db.notificationDelivery.update({
            where: { id: row.id },
            data: {
              status: 'DISABLED',
              errorCode: row.device?.revokedAt ? 'DEVICE_REVOKED' : 'PUSH_NOT_CONFIGURED',
            },
          });
          continue;
        }
        if (row.providerTicketId) {
          const receipt = await this.push.receipt(row.providerTicketId);
          if (
            receipt.pending &&
            row.providerAcceptedAt &&
            row.providerAcceptedAt.getTime() + 24 * 3600000 > Date.now()
          ) {
            await this.db.notificationDelivery.update({
              where: { id: row.id },
              data: {
                nextAttemptAt: new Date(Date.now() + 15 * 60000),
                receiptCheckedAt: new Date(),
              },
            });
            continue;
          }
          const code = receipt.errorCode ?? (receipt.pending ? 'PUSH_RECEIPT_EXPIRED' : null);
          await this.db.notificationDelivery.update({
            where: { id: row.id },
            data: {
              status: code ? 'FAILED' : 'SENT',
              errorCode: code,
              receiptCheckedAt: new Date(),
            },
          });
          if (code === 'DeviceNotRegistered')
            await this.db.deviceToken.update({
              where: { id: row.device.id },
              data: { revokedAt: new Date() },
            });
        } else {
          const result = await this.push.send(row.device.token, row.notification);
          if (result.ticketId)
            await this.db.notificationDelivery.update({
              where: { id: row.id },
              data: {
                providerTicketId: result.ticketId,
                providerAcceptedAt: new Date(),
                nextAttemptAt: new Date(Date.now() + 15 * 60000),
              },
            });
          else {
            await this.db.notificationDelivery.update({
              where: { id: row.id },
              data: { status: 'FAILED', errorCode: result.errorCode },
            });
            if (result.errorCode === 'DeviceNotRegistered')
              await this.db.deviceToken.update({
                where: { id: row.device.id },
                data: { revokedAt: new Date() },
              });
          }
        }
      } catch {
        await this.db.notificationDelivery.update({
          where: { id: row.id },
          data: {
            status: row.attempts >= 10 ? 'FAILED' : 'PENDING',
            errorCode: 'PUSH_TEMPORARILY_UNAVAILABLE',
            nextAttemptAt: new Date(Date.now() + Math.min(3600000, 1000 * 2 ** row.attempts)),
          },
        });
      }
    }
    return rows.length;
  }
}
