import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { AppModule } from '../../app.module';
import { configureApp } from '../../bootstrap';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ModulesContainer } from '@nestjs/core';
import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { apiContract } from '../../infrastructure/http/contract-definition';
const run = process.env.DATABASE_TEST_URL ? describe : describe.skip;
run('Identity HTTP against PostgreSQL', () => {
  let app: INestApplication, db: PrismaService;
  const email = `http-${randomUUID()}@demo.marketplace.test`,
    password = 'Marketplace123!',
    server = () => app.getHttpServer();
  let pair: any, user: any;
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_TEST_URL;
    process.env.JWT_ACCESS_SECRET ??= 'ci-access-secret-for-isolated-tests-only-123';
    process.env.JWT_REFRESH_SECRET ??= 'ci-refresh-secret-for-isolated-tests-only-456';
    process.env.LOCAL_MAIL_DIR = resolve('../.local-data/test-mail');
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(module.createNestApplication());
    await app.init();
    db = app.get(PrismaService);
  });
  afterAll(async () => {
    await app?.close();
  });
  it('protects private routes and serves public health', async () => {
    await request(server()).get('/api/v1/auth/me').expect(401);
    await request(server()).get('/api/v1/health').expect(200);
  });
  it('validates DTOs and prevents admin self-registration', async () => {
    await request(server())
      .post('/api/v1/auth/register')
      .send({ email, password, displayName: 'HTTP test', locale: 'ar', businessRole: 'ADMIN' })
      .expect(400);
    await request(server()).post('/api/v1/auth/login').send({ email, password }).expect(400);
  });
  it('registers a real account with separate empty currency wallets', async () => {
    const r = await request(server())
      .post('/api/v1/auth/register')
      .send({ email, password, displayName: 'HTTP test', locale: 'ar' })
      .expect(201);
    user = r.body;
    expect(user.roles).toEqual(['CUSTOMER']);
    expect(user.passwordHash).toBeUndefined();
    expect(await db.wallet.count({ where: { userId: user.id } })).toBe(2);
  });
  it('consumes the delivered verification token once', async () => {
    const dir = process.env.LOCAL_MAIL_DIR!;
    const mails = await Promise.all(
      (await readdir(dir)).map(async (name) =>
        JSON.parse(await readFile(resolve(dir, name), 'utf8')),
      ),
    );
    const mail = mails.find((m) => m.email === email && m.kind === 'EMAIL');
    await request(server())
      .post('/api/v1/auth/verify-email')
      .send({ token: mail.token })
      .expect(200);
    await request(server())
      .post('/api/v1/auth/verify-email')
      .send({ token: mail.token })
      .expect(400);
  });
  it('logs in with bcrypt and returns a JWT that authorizes only its own identity', async () => {
    const r = await request(server())
      .post('/api/v1/auth/login')
      .send({ email, password, client: 'WEB' })
      .expect(200);
    pair = r.body;
    expect(pair.expiresIn).toBe(900);
    const me = await request(server())
      .get('/api/v1/auth/me')
      .auth(pair.accessToken, { type: 'bearer' })
      .expect(200);
    expect(me.body.id).toBe(user.id);
  });
  it('rotates refresh tokens and commits family revocation on reuse', async () => {
    const old = pair;
    pair = (
      await request(server())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: old.refreshToken })
        .expect(200)
    ).body;
    await request(server())
      .get('/api/v1/auth/me')
      .auth(old.accessToken, { type: 'bearer' })
      .expect(401);
    const r = await request(server())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: old.refreshToken })
      .expect(401);
    expect(r.body.error.code).toBe('REFRESH_REUSE_DETECTED');
    await request(server())
      .get('/api/v1/auth/me')
      .auth(pair.accessToken, { type: 'bearer' })
      .expect(401);
  });
  it('rejects a password beyond bcrypt UTF-8 byte limits without truncating it', async () => {
    await request(server())
      .post('/api/v1/auth/register')
      .send({
        email: `bytes-${randomUUID()}@demo.test`,
        password: 'س'.repeat(40),
        displayName: 'Byte limit',
        locale: 'ar',
      })
      .expect(400);
  });
  it('registers exactly the 145 canonical REST operations with matching paths and methods', () => {
    const actual = new Map<string, string>();
    for (const module of app.get(ModulesContainer).values())
      for (const wrapper of module.controllers.values()) {
        const controller = wrapper.instance as Record<string, any> | undefined;
        if (!controller) continue;
        const prefix = Reflect.getMetadata(PATH_METADATA, controller.constructor) ?? '';
        for (const name of Object.getOwnPropertyNames(Object.getPrototypeOf(controller))) {
          const handler = controller[name];
          if (typeof handler !== 'function') continue;
          const verb = Reflect.getMetadata(METHOD_METADATA, handler),
            path = Reflect.getMetadata(PATH_METADATA, handler),
            id = Reflect.getMetadata('operation', handler);
          if (verb === undefined || path === undefined) continue;
          expect(id).toBeDefined();
          const normalized = ('/api/v1/' + prefix + '/' + path)
            .replace(/\/+/g, '/')
            .replace(/\/$/, '')
            .replace(/:(\w+)/g, '{$1}');
          expect(actual.has(id)).toBe(false);
          actual.set(id, RequestMethod[verb]!.toLowerCase() + ' ' + normalized);
        }
      }
    const expected = new Map<string, string>();
    for (const [path, methods] of Object.entries(apiContract.paths))
      for (const [verb, operation] of Object.entries(methods as Record<string, any>))
        if (operation.operationId) expected.set(operation.operationId, verb + ' ' + path);
    expect(actual.size).toBe(145);
    expect([...actual.entries()].sort()).toEqual([...expected.entries()].sort());
  });
  it('logs out a session family and consumes a delivered password-reset token only once', async () => {
    const login = async (secret: string) =>
      (
        await request(server())
          .post('/api/v1/auth/login')
          .send({ email, password: secret, client: 'WEB' })
          .expect(200)
      ).body;
    const before = await login(password);
    await request(server())
      .post('/api/v1/auth/logout')
      .auth(before.accessToken, { type: 'bearer' })
      .send({ refreshToken: before.refreshToken })
      .expect(200);
    await request(server())
      .get('/api/v1/auth/me')
      .auth(before.accessToken, { type: 'bearer' })
      .expect(401);
    const active = await login(password);
    await request(server()).post('/api/v1/auth/forgot-password').send({ email }).expect(200);
    const mails = await Promise.all(
        (await readdir(process.env.LOCAL_MAIL_DIR!)).map(async (name) =>
          JSON.parse(await readFile(resolve(process.env.LOCAL_MAIL_DIR!, name), 'utf8')),
        ),
      ),
      mail = mails.find((m) => m.email === email && m.kind === 'PASSWORD_RESET'),
      newPassword = 'ChangedMarketplace456!';
    await request(server())
      .post('/api/v1/auth/reset-password')
      .send({ token: mail.token, password: newPassword })
      .expect(200);
    await request(server())
      .get('/api/v1/auth/me')
      .auth(active.accessToken, { type: 'bearer' })
      .expect(401);
    await request(server())
      .post('/api/v1/auth/reset-password')
      .send({ token: mail.token, password: newPassword })
      .expect(400);
    await login(newPassword);
  });
});
