import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../../app.module';
import { configureApp } from '../../bootstrap';
import { PrismaService } from '../../infrastructure/database/prisma.service';
const run = process.env.DATABASE_TEST_URL ? describe : describe.skip;
run('Audited admin configuration and moderation', () => {
  let app: INestApplication,
    db: PrismaService,
    admin: string,
    owner: string,
    userId: string,
    listing: string,
    restriction: string;
  const http = () => request(app.getHttpServer()),
    key = () => randomUUID();
  const post = (route: string, who: string, body: any) =>
    http()
      .post('/api/v1/' + route)
      .auth(who, { type: 'bearer' })
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
    admin = (
      await http()
        .post('/api/v1/auth/login')
        .send({ email: 'admin@demo.marketplace.test', password: 'Marketplace123!', client: 'WEB' })
        .expect(200)
    ).body.accessToken;
    const email = 'moderation-' + key() + '@demo.test';
    userId = (
      await http()
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'Marketplace123!',
          displayName: 'Fictional moderation owner',
          locale: 'en',
          businessRole: 'FREELANCER',
        })
        .expect(201)
    ).body.id;
    await db.user.update({ where: { id: userId }, data: { verifiedAt: new Date() } });
    owner = (
      await http()
        .post('/api/v1/auth/login')
        .send({ email, password: 'Marketplace123!', client: 'WEB' })
        .expect(200)
    ).body.accessToken;
    await post('business-profiles', owner, {
      type: 'FREELANCER',
      title: 'Fictional provider',
      bio: 'Moderation fixture',
      skills: [],
      languages: [],
    }).expect(201);
    await post('business-profiles/switch', owner, { target: 'FREELANCER' }).expect(200);
    const category = (await db.category.findFirstOrThrow({ where: { workspace: 'FREELANCE' } })).id;
    listing = (
      await post('listings', owner, {
        kind: 'FREELANCE',
        categoryId: category,
        price: { currency: 'SYP', units: '300' },
        deliveryDays: 2,
      }).expect(201)
    ).body.id;
  }, 30000);
  afterAll(async () => {
    await app?.close();
  });
  it('denies customer access to admin data and versions explicit zero commission overrides', async () => {
    await http().get('/api/v1/admin/audit').auth(owner, { type: 'bearer' }).expect(403);
    const a = (
        await post('admin/commission-rates', admin, {
          workspace: 'FREELANCE',
          basisPoints: 0,
        }).expect(200)
      ).body,
      b = (
        await post('admin/commission-rates', admin, {
          workspace: 'FREELANCE',
          basisPoints: 0,
        }).expect(200)
      ).body;
    expect(b.version).toBe(a.version + 1);
    expect(b.basisPoints).toBe(0);
    await http()
      .get('/api/v1/admin/moderation?limit=2')
      .auth(admin, { type: 'bearer' })
      .expect(200);
  });
  it('hides catalog content, blocks owner republishing and records the reason', async () => {
    const result = (
      await post('admin/moderation/' + listing + '/decision', admin, {
        outcome: 'HIDE',
        reason: 'Fictional moderation reason',
      }).expect(200)
    ).body;
    expect(result.status).toBe('HIDDEN');
    await post('listings/' + listing + '/publish', owner, { accepted: true }).expect(403);
    expect(await db.moderationDecision.count({ where: { listingId: listing } })).toBe(1);
    expect(
      await db.auditRecord.count({ where: { aggregateId: listing, action: 'moderation.hide' } }),
    ).toBe(1);
  });
  it('applies and revokes a publishing restriction without deleting account history', async () => {
    restriction = (
      await post('admin/users/' + userId + '/restrictions', admin, {
        kind: 'PUBLISHING',
        reason: 'Controlled fixture restriction',
      }).expect(200)
    ).body.id;
    await post('listings/' + listing + '/publish', owner, { accepted: true }).expect(403);
    await post('admin/restrictions/' + restriction + '/revoke', admin, {
      reason: 'Fixture restriction lifted',
    }).expect(200);
    expect(
      (await db.restriction.findUniqueOrThrow({ where: { id: restriction } })).revokedAt,
    ).not.toBeNull();
  });
  it('preserves controlled history access while suspending writes and refresh', async () => {
    const email = (await db.user.findUniqueOrThrow({ where: { id: userId } })).email;
    const r = (
      await post('admin/users/' + userId + '/restrictions', admin, {
        kind: 'SUSPENSION',
        reason: 'Isolated suspension policy test',
      }).expect(200)
    ).body;
    const pair = (
      await http()
        .post('/api/v1/auth/login')
        .send({ email, password: 'Marketplace123!', client: 'WEB' })
        .expect(200)
    ).body;
    const me = (
      await http().get('/api/v1/auth/me').auth(pair.accessToken, { type: 'bearer' }).expect(200)
    ).body;
    expect(me.restrictions.some((x: any) => x.id === r.id)).toBe(true);
    await http().post('/api/v1/auth/refresh').send({ refreshToken: pair.refreshToken }).expect(403);
    await post('business-profiles/switch', pair.accessToken, { target: 'CUSTOMER' }).expect(403);
    await post('admin/restrictions/' + r.id + '/revoke', admin, {
      reason: 'Policy fixture completed',
    }).expect(200);
  });
});
