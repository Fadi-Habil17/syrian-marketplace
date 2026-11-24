import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../../app.module';
import { configureApp } from '../../bootstrap';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { OutboxWorker } from '../jobs/outbox-worker.service';
import { JwtService } from '@nestjs/jwt';
const run = process.env.DATABASE_TEST_URL ? describe : describe.skip;
run('Private order chat and notification ownership', () => {
  let app: INestApplication,
    db: PrismaService,
    buyer: string,
    seller: string,
    order: any,
    room: any,
    userId: string,
    notice: string,
    device: string;
  const http = () => request(app.getHttpServer()),
    key = () => randomUUID();
  const post = (route: string, token: string, body?: any) =>
    http()
      .post('/api/v1/' + route)
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send(body);
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_TEST_URL;
    process.env.JWT_ACCESS_SECRET ??= 'ci-access-secret-for-isolated-tests-only-123';
    process.env.JWT_REFRESH_SECRET ??= 'ci-refresh-secret-for-isolated-tests-only-456';
    const m = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(m.createNestApplication());
    await app.init();
    db = app.get(PrismaService);
    const email = 'chat-' + key() + '@demo.test',
      u = (
        await http()
          .post('/api/v1/auth/register')
          .send({
            email,
            password: 'Marketplace123!',
            displayName: 'Fictional chat buyer',
            locale: 'en',
          })
          .expect(201)
      ).body;
    userId = u.id;
    buyer = (
      await http()
        .post('/api/v1/auth/login')
        .send({ email, password: 'Marketplace123!', client: 'WEB' })
        .expect(200)
    ).body.accessToken;
    seller = (
      await http()
        .post('/api/v1/auth/login')
        .send({
          email: 'freelancer@demo.marketplace.test',
          password: 'Marketplace123!',
          client: 'WEB',
        })
        .expect(200)
    ).body.accessToken;
    const listing = await db.listing.findFirstOrThrow({
      where: { kind: 'FREELANCE', status: 'PUBLISHED' },
    });
    order = (
      await post('orders/freelance', buyer, {
        listingId: listing.id,
        description: 'Fictional chat order',
      }).expect(201)
    ).body;
    room = (
      await http()
        .get('/api/v1/orders/' + order.id + '/chat-rooms')
        .auth(buyer, { type: 'bearer' })
        .expect(200)
    ).body.items[0];
  }, 30000);
  afterAll(async () => {
    await app?.close();
  });
  it('deduplicates a sender message across different transport idempotency keys', async () => {
    const body = { roomId: room.id, clientMessageId: key(), text: 'Actual persisted message' },
      a = (await post('orders/' + order.id + '/messages', buyer, body).expect(201)).body,
      b = (await post('orders/' + order.id + '/messages', buyer, body).expect(201)).body;
    expect(a.id).toBe(b.id);
    expect(await db.chatMessage.count({ where: { roomId: room.id } })).toBe(1);
    expect(
      (
        await http()
          .get('/api/v1/orders/' + order.id + '/messages')
          .query({ roomId: room.id })
          .auth(seller, { type: 'bearer' })
          .expect(200)
      ).body.items[0].text,
    ).toBe(body.text);
    await post('orders/' + order.id + '/messages', buyer, {
      ...body,
      text: 'Changed replay',
    }).expect(409);
  });
  it('enforces recipient ownership and stores notification read state', async () => {
    const event = await db.outboxEvent.findFirstOrThrow({ where: { aggregateId: order.id } });
    notice = (
      await db.notification.create({
        data: {
          userId,
          eventId: event.id,
          channel: 'IN_APP',
          category: 'order.updated',
          resourceId: order.id,
        },
      })
    ).id;
    await post('notifications/' + notice + '/read', seller).expect(404);
    const n = (await post('notifications/' + notice + '/read', buyer).expect(200)).body;
    expect(n.readAt).not.toBeNull();
    expect(
      (
        await http()
          .get('/api/v1/notifications?unread=true')
          .auth(buyer, { type: 'bearer' })
          .expect(200)
      ).body.items,
    ).toHaveLength(0);
  });
  it('registers an Expo device without exposing its token and permits only its owner to revoke', async () => {
    const d = (
      await post('devices', buyer, {
        platform: 'ANDROID',
        token: `ExpoPushToken[${key()}]`,
      }).expect(201)
    ).body;
    device = d.id;
    expect(d.token).toBeUndefined();
    await http()
      .delete('/api/v1/devices/' + device)
      .auth(seller, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .expect(404);
    await http()
      .delete('/api/v1/devices/' + device)
      .auth(buyer, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .expect(204);
    expect(
      (await db.deviceToken.findUniqueOrThrow({ where: { id: device } })).revokedAt,
    ).not.toBeNull();
  });
  it('materializes durable recipient notices once when an outbox event is retried', async () => {
    const e = await db.outboxEvent.findFirstOrThrow({
      where: { aggregateId: order.id, type: 'chat.message.created' },
    });
    await app.get(OutboxWorker).process(e);
    await app.get(OutboxWorker).process(e);
    expect(await db.notification.count({ where: { eventId: e.id } })).toBe(1);
    const notice = await db.notification.findFirstOrThrow({ where: { eventId: e.id } });
    expect(await db.outboxEvent.count({ where: { deduplicationKey: 'notice:' + notice.id } })).toBe(
      1,
    );
    const inbox = (
      await http().get('/api/v1/notifications').auth(seller, { type: 'bearer' }).expect(200)
    ).body.items;
    expect(inbox.some((n: any) => n.eventId === e.id)).toBe(true);
  });
  it('uses real Socket.IO authorization and shares message deduplication with REST', async () => {
    await app.listen(0, '127.0.0.1');
    const address = app.getHttpServer().address(),
      url = `http://127.0.0.1:${address.port}/orders`;
    const connect = (auth: any) =>
      new Promise<Socket>((resolve, reject) => {
        const socket = io(url, { auth, transports: ['websocket'], reconnection: false });
        socket.once('connect', () => resolve(socket));
        socket.once('connect_error', (e) => {
          socket.disconnect();
          reject(e);
        });
      });
    const ticket = (await post('realtime/ticket', buyer, { orderId: order.id }).expect(200)).body;
    const socket = await connect({ ticket: ticket.ticket });
    try {
      const subscribed = await socket.timeout(3000).emitWithAck('command', {
        type: 'order.subscribe',
        data: { orderId: order.id, lastSeenVersion: 0 },
      });
      expect(subscribed.ok).toBe(true);
      const denied = await socket.timeout(3000).emitWithAck('command', {
        type: 'order.subscribe',
        data: { orderId: key(), lastSeenVersion: 0 },
      });
      expect(denied.ok).toBe(false);
      const body = {
        roomId: room.id,
        clientMessageId: key(),
        text: 'Shared REST and socket command',
      };
      const sent = await socket
        .timeout(3000)
        .emitWithAck('command', { type: 'chat.send', data: body });
      expect(sent.ok).toBe(true);
      const replay = (await post('orders/' + order.id + '/messages', buyer, body).expect(201)).body;
      expect(replay.id).toBe(sent.data.id);
      await expect(connect({ ticket: ticket.ticket })).rejects.toThrow('AUTH_REQUIRED');
    } finally {
      socket.disconnect();
    }
  });
  it('denies outsider REST/tickets, invalid socket JWTs and commands after live session revocation', async () => {
    const outsider = (
      await http()
        .post('/api/v1/auth/login')
        .send({
          email: 'customer@demo.marketplace.test',
          password: 'Marketplace123!',
          client: 'ANDROID',
        })
        .expect(200)
    ).body;
    await http()
      .get('/api/v1/orders/' + order.id + '/messages')
      .query({ roomId: room.id })
      .auth(outsider.accessToken, { type: 'bearer' })
      .expect(404);
    await post('realtime/ticket', outsider.accessToken, { orderId: order.id }).expect(404);
    const address = app.getHttpServer().address();
    const connect = (auth: any) =>
      new Promise<Socket>((resolve, reject) => {
        const socket = io(`http://127.0.0.1:${address.port}/orders`, {
          auth,
          transports: ['websocket'],
          reconnection: false,
          timeout: 3000,
        });
        socket.once('connect', () => resolve(socket));
        socket.once('connect_error', (error) => {
          socket.disconnect();
          reject(error);
        });
      });
    await expect(connect({ accessToken: outsider.refreshToken })).rejects.toThrow('AUTH_REQUIRED');
    const claims = app.get(JwtService).decode(outsider.accessToken);
    const expired = await app.get(JwtService).signAsync(
      { sub: claims.sub, sid: claims.sid, authTime: claims.authTime, kind: 'access' },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        issuer: 'syrian-marketplace',
        audience: 'marketplace-api',
        expiresIn: -1,
      },
    );
    await expect(connect({ accessToken: expired })).rejects.toThrow('AUTH_REQUIRED');
    const socket = await connect({ accessToken: outsider.accessToken });
    try {
      const denied = await socket.timeout(3000).emitWithAck('command', {
        type: 'order.subscribe',
        data: { orderId: order.id, lastSeenVersion: 0 },
      });
      expect(denied.ok).toBe(false);
      await http()
        .post('/api/v1/auth/logout')
        .auth(outsider.accessToken, { type: 'bearer' })
        .send({ refreshToken: outsider.refreshToken })
        .expect(200);
      // Command-time authorization must fail even if polling has not disconnected it yet.
      if (socket.connected) {
        const rejected = await socket.timeout(3000).emitWithAck('command', {
          type: 'order.subscribe',
          data: { orderId: order.id, lastSeenVersion: 0 },
        });
        expect(rejected.ok).toBe(false);
      }
      await expect(connect({ accessToken: outsider.accessToken })).rejects.toThrow('AUTH_REQUIRED');
    } finally {
      socket.disconnect();
    }
  });
});
