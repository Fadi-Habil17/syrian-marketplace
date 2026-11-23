import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiRequest } from '../../common/actor';
import { CommandsService } from '../../common/commands.service';
import { fail } from '../../common/errors';
import { page, pageArgs } from '../../common/pagination';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ChatAccess } from './chat-access.service';
import { FilesService } from '../files/files.service';
import { fileDto } from '../users/users.service';
const include = {
  messageAttachment_message: { include: { file: true } },
} satisfies Prisma.ChatMessageInclude;
export const messageDto = (m: Prisma.ChatMessageGetPayload<{ include: typeof include }>) => ({
  ...m,
  text: m.body,
  attachments: m.messageAttachment_message.map((a) => fileDto(a.file)),
});
@Injectable()
export class ChatService {
  constructor(
    private readonly db: PrismaService,
    private readonly commands: CommandsService,
    private readonly access: ChatAccess,
    private readonly files: FilesService,
  ) {}
  async getOrderRooms(r: ApiRequest) {
    const grant = await this.access.rooms(this.db, r.params.orderId!, r.actor);
    return { items: grant.rooms, nextCursor: null };
  }
  async listMessages(r: ApiRequest) {
    const grant = await this.access.room(this.db, r.query.roomId as string, r.actor);
    if (grant.room.orderId !== r.params.orderId) fail('NOT_FOUND', 404);
    if (
      r.actor.roles.includes('ADMIN') &&
      ![grant.order.buyerId, grant.order.sellerProfile.userId].includes(r.actor.id)
    )
      await this.commands.audit(this.db, r.actor.id, grant.order.id, 'case.chat_read', {
        roomId: grant.room.id,
      });
    return page(
      (
        await this.db.chatMessage.findMany({
          where: { roomId: grant.room.id },
          include,
          ...pageArgs(r.query, r.actor.id + ':' + grant.room.id),
        })
      ).map(messageDto),
      r.query,
      r.actor.id + ':' + grant.room.id,
    );
  }
  async sendMessage(r: ApiRequest) {
    const initial = await this.access.room(this.db, r.body.roomId, r.actor);
    if (r.params.orderId && initial.room.orderId !== r.params.orderId) fail('NOT_FOUND', 404);
    return this.commands.run(
      r,
      async (tx) => {
        if (r.actor.restrictions.includes('SUSPENSION')) fail('ACCOUNT_RESTRICTED', 403);
        const { room, order } = await this.access.room(tx, r.body.roomId, r.actor),
          b = r.body;
        if (
          ![order.buyerId, order.sellerProfile.userId].includes(r.actor.id) &&
          r.actor.roles.includes('ADMIN')
        )
          fail('FORBIDDEN', 403);
        const ids: string[] = b.attachmentIds ?? [];
        if (new Set(ids).size !== ids.length) fail('INVALID_INPUT', 400);
        for (const id of ids) {
          const f = await tx.fileAsset.findFirst({
            where: {
              id,
              ownerId: r.actor.id,
              orderId: order.id,
              scanStatus: 'CLEAN',
              accessClass:
                room.kind === 'DELIVERY'
                  ? 'DELIVERY_ONLY'
                  : { in: ['ORDER_SHARED', 'FINAL_DELIVERABLE'] },
            },
          });
          if (!f) fail('NOT_FOUND', 404);
          await this.files.authorize(f, r.actor, tx);
          if (
            f.accessClass === 'FINAL_DELIVERABLE' &&
            !(await tx.paymentAttempt.findFirst({
              where: { orderId: order.id, installment: 'BALANCE', status: 'SUCCEEDED' },
            }))
          )
            fail('HOLD_REQUIRED');
        }
        const previous = await tx.chatMessage.findUnique({
          where: {
            roomId_senderId_clientMessageId: {
              roomId: room.id,
              senderId: r.actor.id,
              clientMessageId: b.clientMessageId,
            },
          },
          include,
        });
        if (previous) {
          if (
            (previous.body ?? null) !== (b.text?.trim() || null) ||
            JSON.stringify(previous.messageAttachment_message.map((a) => a.fileId).sort()) !==
              JSON.stringify([...ids].sort())
          )
            fail('IDEMPOTENCY_CONFLICT');
          return messageDto(previous);
        }
        const m = await tx.chatMessage.create({
          data: {
            roomId: room.id,
            senderId: r.actor.id,
            clientMessageId: b.clientMessageId,
            body: b.text?.trim() || null,
            messageAttachment_message: { create: ids.map((fileId) => ({ fileId })) },
          },
          include,
        });
        await tx.outboxEvent.create({
          data: {
            aggregateId: order.id,
            aggregateVersion: order.version,
            type: 'chat.message.created',
            deduplicationKey: `message:${m.id}`,
            payload: { orderId: order.id, roomId: room.id, messageId: m.id, senderId: m.senderId },
          },
        });
        return messageDto(m);
      },
      [initial.order.buyerId, initial.order.sellerProfile.userId],
    );
  }
}
