import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../../app.module';
import { configureApp } from '../../bootstrap';
import { PrismaService } from '../../infrastructure/database/prisma.service';
const run = process.env.DATABASE_TEST_URL ? describe : describe.skip;
run('Profiles, roles, geography and address ownership HTTP', () => {
  let app: INestApplication,
    db: PrismaService,
    token: string,
    other: string,
    profile: string,
    address: string,
    city: string;
  const email = `profile-${randomUUID()}@demo.test`,
    password = 'Marketplace123!';
  const http = () => request(app.getHttpServer()),
    key = () => randomUUID();
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_TEST_URL;
    process.env.JWT_ACCESS_SECRET ??= 'ci-access-secret-for-isolated-tests-only-123';
    process.env.JWT_REFRESH_SECRET ??= 'ci-refresh-secret-for-isolated-tests-only-456';
    const m = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(m.createNestApplication());
    await app.init();
    db = app.get(PrismaService);
    await http()
      .post('/api/v1/auth/register')
      .send({ email, password, displayName: 'Profile HTTP', locale: 'ar' })
      .expect(201);
    token = (
      await http().post('/api/v1/auth/login').send({ email, password, client: 'WEB' }).expect(200)
    ).body.accessToken;
    other = (
      await http()
        .post('/api/v1/auth/login')
        .send({ email: 'customer@demo.marketplace.test', password, client: 'WEB' })
        .expect(200)
    ).body.accessToken;
    city = (await db.city.findFirstOrThrow()).id;
  }, 30000);
  afterAll(async () => {
    await app?.close();
  });
  it('reads actual seeded geography and rejects invalid pagination', async () => {
    const r = await http().get('/api/v1/geography/governorates').expect(200);
    expect(r.body.items).toHaveLength(14);
    expect(r.body.items[0].countryId).toBeUndefined();
    await http().get('/api/v1/geography/governorates?limit=101').expect(400);
  });
  it('creates owned private addresses and denies other users', async () => {
    const r = await http()
      .post('/api/v1/me/addresses')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({
        label: 'Demo',
        cityId: city,
        details: 'Fictional address',
        contactName: 'Test buyer',
        contactPhone: '+000000000',
      })
      .expect(201);
    address = r.body.id;
    await http()
      .patch('/api/v1/me/addresses/' + address)
      .auth(other, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({
        label: 'Changed',
        cityId: city,
        details: 'Fictional address',
        contactName: 'Test buyer',
        contactPhone: '+000000000',
      })
      .expect(404);
  });
  it('replays profile creation and activates a configured business role', async () => {
    const idempotency = key(),
      b = {
        type: 'FREELANCER',
        title: 'Designer',
        bio: 'Fictional portfolio',
        skills: ['Design'],
        languages: [{ languageCode: 'ar', proficiency: 'native' }],
      };
    const r = await http()
      .post('/api/v1/business-profiles')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', idempotency)
      .send(b)
      .expect(201);
    profile = r.body.id;
    const repeat = await http()
      .post('/api/v1/business-profiles')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', idempotency)
      .send(b)
      .expect(201);
    expect(repeat.body.id).toBe(profile);
    const active = await http()
      .post('/api/v1/business-profiles/switch')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({ target: 'FREELANCER' })
      .expect(200);
    expect(active.body.user.roles).toContain('CUSTOMER');
    expect(active.body.user.roles).toContain('FREELANCER');
    expect(active.body.user.activeBusinessProfile.id).toBe(profile);
  });
  it('prevents profile ownership abuse', async () => {
    await http()
      .patch('/api/v1/business-profiles/' + profile)
      .auth(other, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({ title: 'Abuse', bio: 'No', skills: [], languages: [] })
      .expect(404);
  });
  it('archives and reactivates the same identity without deleting history', async () => {
    await http()
      .post('/api/v1/business-profiles/switch')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({ target: 'CUSTOMER' })
      .expect(200);
    await http()
      .get('/api/v1/profiles/' + profile)
      .expect(404);
    const r = await http()
      .post('/api/v1/business-profiles/' + profile + '/reactivate')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({ accepted: true })
      .expect(200);
    expect(r.body.user.activeBusinessProfile.id).toBe(profile);
    expect(r.body.user.activeBusinessProfile.status).toBe('ACTIVE');
  });
});
