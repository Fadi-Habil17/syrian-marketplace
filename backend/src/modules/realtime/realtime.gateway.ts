import { OnModuleDestroy } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import { randomUUID } from 'node:crypto';
import { OutboxEvent } from '@prisma/client';
import { ApiRequest, Actor } from '../../common/actor';
import { apiFailure, fail, requireValue } from '../../common/errors';
import { ContractsService } from '../../infrastructure/http/contracts.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ChatAccess } from '../chat/chat-access.service';
import { ChatService } from '../chat/chat.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService, SocketClaims } from './realtime.service';
import { RequestLimiter } from '../../common/request-limiter';
import { DeliveryService } from '../delivery/delivery.service';
type Grant = { claims: SocketClaims; orders: Set<string>; window: number; count: number };
@WebSocketGateway({
  namespace: '/orders',
  maxHttpBufferSize: 32768,
  cors: {
    origin: (origin: string | undefined, cb: (e: Error | null, allowed?: boolean) => void) => {
      const origins = (process.env.WEB_ORIGINS ?? 'http://localhost:3000').split(',');
      cb(origin && !origins.includes(origin) ? new Error('Origin denied') : null, true);
    },
  },
  transports: ['websocket', 'polling'],
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy {
  @WebSocketServer() server!: Namespace;
  private readonly grants = new Map<string, Grant>();
  private timer?: NodeJS.Timeout;
  private busy = false;
  private readonly seen = new Map<string, number>();
  private since = new Date();
  constructor(
    private readonly realtime: RealtimeService,
    private readonly chats: ChatAccess,
    private readonly chat: ChatService,
    private readonly notices: NotificationsService,
    private readonly contracts: ContractsService,
    private readonly db: PrismaService,
    private readonly delivery: DeliveryService,
    private readonly limiter: RequestLimiter,
  ) {}
  afterInit(server: Namespace) {
    server.use(async (s, next) => {
      try {
        this.limiter.hit('socket-connect:' + s.handshake.address, 60);
        if (s.handshake.headers.origin && s.handshake.auth.accessToken) fail('AUTH_REQUIRED', 401);
        s.data.marketplaceClaims = await this.realtime.handshake(s.handshake.auth);
        next();
      } catch {
        next(new Error('AUTH_REQUIRED'));
      }
    });
    this.timer = setInterval(() => void this.poll().catch(() => undefined), 1000);
    this.timer.unref();
  }
  handleConnection(s: Socket) {
    const claims = s.data.marketplaceClaims as SocketClaims | undefined;
    if (!claims) {
      s.disconnect(true);
      return;
    }
    this.grants.set(s.id, { claims, orders: new Set(), window: Date.now(), count: 0 });
  }
  handleDisconnect(s: Socket) {
    this.grants.delete(s.id);
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    for (const s of this.server?.sockets.values() ?? []) s.disconnect(true);
  }
  private request(
    actor: Actor,
    path: string,
    body: any,
    params: Record<string, string> = {},
  ): ApiRequest {
    return {
      actor,
      path,
      body,
      params,
      query: {},
      headers: {},
      requestId: randomUUID(),
      method: 'POST',
    } as ApiRequest;
  }
  @SubscribeMessage('command')
  async command(@ConnectedSocket() s: Socket, @MessageBody() command: any) {
    const requestId = randomUUID();
    try {
      const g = requireValue(this.grants.get(s.id));
      if (Buffer.byteLength(JSON.stringify(command)) > 32768) fail('FILE_TOO_LARGE', 413);
      if (Date.now() - g.window >= 60000) {
        g.window = Date.now();
        g.count = 0;
      }
      if (++g.count > 60) fail('RATE_LIMITED', 429);
      this.contracts.schema('RealtimeCommand', command);
      const actor = await this.realtime.actor(g.claims);
      this.limiter.hit('socket-command:' + actor.id, 60);
      let data: any;
      const b = command.data;
      if (command.type === 'order.subscribe') {
        if (g.claims.orderId && g.claims.orderId !== b.orderId) fail('FORBIDDEN', 403);
        if (g.orders.size >= 20) fail('RATE_LIMITED', 429);
        await this.chats.rooms(this.db, b.orderId, actor);
        g.orders.add(b.orderId);
        data = { subscribed: true };
      } else if (command.type === 'order.unsubscribe') {
        g.orders.delete(b.orderId);
        data = { subscribed: false };
      } else if (command.type === 'chat.send') {
        const grant = await this.chats.room(this.db, b.roomId, actor);
        if (g.claims.orderId && grant.order.id !== g.claims.orderId) fail('FORBIDDEN', 403);
        const m = await this.chat.sendMessage(
          this.request(actor, `/api/v1/orders/${grant.order.id}/messages`, b, {
            orderId: grant.order.id,
          }),
        );
        data = this.contracts.project({ $ref: '#/components/schemas/Message' }, m);
      } else {
        const n = requireValue(
          await this.db.notification.findFirst({
            where: { id: b.notificationId, userId: actor.id },
            include: { event: true },
          }),
        );
        if (g.claims.orderId && n.event.aggregateId !== g.claims.orderId) fail('FORBIDDEN', 403);
        await this.notices.readNotification(
          this.request(actor, `/api/v1/notifications/${n.id}/read`, {}, { notificationId: n.id }),
        );
        data = { acknowledged: true };
      }
      const ack = { ok: true, requestId, data };
      this.contracts.schema('RealtimeAck', ack);
      return ack;
    } catch (e) {
      const error = apiFailure(e);
      return {
        ok: false,
        requestId,
        error: {
          error: { code: error.code, message: error.code, details: error.details, requestId },
        },
      };
    }
  }
  private emit(s: Socket, e: OutboxEvent, type: string, data: any, aggregateId = e.aggregateId) {
    const envelope = JSON.parse(
      JSON.stringify(
        {
          eventId: e.id,
          type,
          version: 1,
          aggregateId,
          aggregateVersion: e.aggregateVersion,
          occurredAt: e.createdAt,
          data,
        },
        (_k, v) => (typeof v === 'bigint' ? v.toString() : v),
      ),
    );
    this.contracts.schema('RealtimeEvent', envelope);
    s.emit('event', envelope);
  }
  private async project(s: Socket, g: Grant, actor: Actor, e: OutboxEvent) {
    const p = e.payload as Record<string, any>;
    if (e.type === 'notification.created') {
      const n = await this.db.notification.findFirst({
        where: { id: p.notificationId, userId: actor.id, channel: 'IN_APP' },
      });
      if (n && (!g.claims.orderId || e.aggregateId === g.claims.orderId))
        this.emit(s, e, e.type, {
          notificationId: n.id,
          category: n.category,
          resourceId: n.resourceId,
        });
      return;
    }
    if (!g.orders.has(e.aggregateId)) return;
    const grant = await this.chats.rooms(this.db, e.aggregateId, actor),
      o = grant.order;
    if (e.type === 'chat.message.created') {
      if (grant.rooms.some((r) => r.id === p.roomId))
        this.emit(s, e, e.type, { roomId: p.roomId, messageId: p.messageId, senderId: p.senderId });
    } else if (e.type === 'case.updated') {
      if (!grant.driver) {
        const c = await this.db.caseRecord.findFirst({ where: { id: p.caseId, orderId: o.id } });
        if (c)
          this.emit(s, e, e.type, {
            caseId: c.id,
            status: c.status,
            evidenceDeadlineAt: c.evidenceDeadlineAt,
          });
      }
    } else if (e.type === 'payment.updated') {
      if (!grant.driver) {
        const pay = await this.db.paymentAttempt.findFirst({
          where: { id: p.paymentId ?? p.operationId, orderId: o.id },
          orderBy: { createdAt: 'desc' },
        });
        if (pay)
          this.emit(s, e, e.type, {
            operationId: pay.id,
            status: pay.status,
            installment: pay.installment,
            amount: { currency: pay.currency, units: pay.units.toString() },
            simulated: true,
          });
      }
    } else if (e.type === 'order.updated') {
      if (!grant.driver)
        this.emit(s, e, 'order.updated', {
          orderId: o.id,
          state: o.state,
          deadlineAt:
            o.reviewDeadlineAt ??
            o.serviceOrder_order?.balanceDeadlineAt ??
            o.serviceOrder_order?.depositDeadlineAt ??
            null,
        });
      const d = o.storeOrder_order?.delivery_storeOrder;
      if (d)
        this.emit(s, e, 'delivery.updated', {
          deliveryId: d.id,
          status: d.status,
          proofAvailable: o.deliveryVerified,
        });
    }
  }
  private async poll() {
    if (this.busy || !this.server) return;
    this.busy = true;
    try {
      for (const [id, g] of this.grants) {
        const s = this.server.sockets.get(id);
        if (!s) {
          this.grants.delete(id);
          continue;
        }
        try {
          const actor = await this.realtime.actor(g.claims);
          for (const orderId of g.orders)
            try {
              await this.chats.rooms(this.db, orderId, actor);
            } catch {
              g.orders.delete(orderId);
              s.emit('event', {
                eventId: randomUUID(),
                version: 1,
                aggregateId: orderId,
                aggregateVersion: 1,
                occurredAt: new Date().toISOString(),
                type: 'permissions.revoked',
                data: { roomId: orderId, reasonCode: 'FORBIDDEN' },
              });
            }
        } catch {
          s.disconnect(true);
        }
      }
      const events = await this.db.outboxEvent.findMany({
        where: { publishedAt: { gte: new Date(this.since.getTime() - 30000) } },
        orderBy: [{ publishedAt: 'asc' }, { id: 'asc' }],
        take: 2000,
      });
      for (const e of events) {
        if (this.seen.has(e.id)) continue;
        for (const [id, g] of this.grants) {
          const s = this.server.sockets.get(id);
          if (s)
            try {
              const actor = await this.realtime.actor(g.claims);
              await this.project(s, g, actor, e);
              if (
                e.type === 'order.updated' &&
                actor.roles.includes('DELIVERY_DRIVER') &&
                !g.claims.orderId
              ) {
                const jobs = await this.delivery.listDriverJobs({
                  actor,
                  query: { limit: 100 },
                } as unknown as ApiRequest);
                for (const j of jobs.items)
                  if (j.orderId === e.aggregateId) this.emit(s, e, 'driver.job.available', j);
              }
            } catch {
              /* Per-audience denial cannot disclose another actor's payload. */
            }
        }
        this.seen.set(e.id, Date.now());
      }
      if (events.length) this.since = events.at(-1)!.publishedAt!;
      for (const [id, at] of this.seen) if (at < Date.now() - 120000) this.seen.delete(id);
    } finally {
      this.busy = false;
    }
  }
}
