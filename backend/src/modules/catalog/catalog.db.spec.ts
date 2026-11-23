import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../../app.module';
import { configureApp } from '../../bootstrap';
import { PrismaService } from '../../infrastructure/database/prisma.service';
const run = process.env.DATABASE_TEST_URL ? describe : describe.skip;
run('Catalog HTTP publication, ownership and filters', () => {
  let app: INestApplication,
    db: PrismaService,
    token: string,
    other: string,
    listing: string,
    category: string;
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
    for (const [who, assign] of [
      ['freelancer', (t: string) => (token = t)],
      ['customer', (t: string) => (other = t)],
    ] as const) {
      const r = await http()
        .post('/api/v1/auth/login')
        .send({ email: who + '@demo.marketplace.test', password: 'Marketplace123!', client: 'WEB' })
        .expect(200);
      assign(r.body.accessToken);
    }
    category = (await db.category.findFirstOrThrow({ where: { workspace: 'FREELANCE' } })).id;
  }, 30000);
  afterAll(async () => {
    await app?.close();
  });
  it('creates an owned unpublished listing and validates publication', async () => {
    const r = await http()
      .post('/api/v1/listings')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({
        categoryId: category,
        kind: 'FREELANCE',
        price: { currency: 'SYP', units: '101' },
        deliveryDays: 3,
      })
      .expect(201);
    listing = r.body.id;
    expect(r.body.price.units).toBe('101');
    await http()
      .get('/api/v1/listings/' + listing)
      .expect(404);
    await http()
      .post('/api/v1/listings/' + listing + '/publish')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({ accepted: true })
      .expect(400);
  });
  it('publishes only complete bilingual content and never exposes internal owner data', async () => {
    await http()
      .patch('/api/v1/listings/' + listing)
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({
        titleAr: 'تصميم',
        titleEn: 'Design integration',
        descriptionAr: 'خدمة تجريبية',
        descriptionEn: 'Fictional integration service',
      })
      .expect(200);
    await http()
      .post('/api/v1/listings/' + listing + '/publish')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({ accepted: true })
      .expect(200);
    const r = await http()
      .get('/api/v1/listings/' + listing)
      .expect(200);
    expect(r.body.profile).toBeUndefined();
    expect(r.body.status).toBe('PUBLISHED');
  });
  it('denies other users and rejects invalid query ranges', async () => {
    await http()
      .patch('/api/v1/listings/' + listing)
      .auth(other, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({ titleEn: 'Abuse' })
      .expect(404);
    await http()
      .get('/api/v1/listings?currency=SYP&minPriceUnits=300&maxPriceUnits=100')
      .expect(400);
  });
  it('filters actual stored prices and uses bound signed cursors', async () => {
    const r = await http()
      .get('/api/v1/listings?currency=SYP&minPriceUnits=100&maxPriceUnits=102')
      .expect(200);
    expect(r.body.items.some((v: any) => v.id === listing)).toBe(true);
    await http().get('/api/v1/listings?cursor=tampered.invalid').expect(400);
  });
  it('deactivates without deleting the listing or its audit history', async () => {
    await http()
      .post('/api/v1/listings/' + listing + '/deactivate')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({ reason: 'Integration complete' })
      .expect(200);
    await http()
      .get('/api/v1/listings/' + listing)
      .expect(404);
    expect(await db.listing.findUnique({ where: { id: listing } })).not.toBeNull();
    expect(await db.auditRecord.count({ where: { aggregateId: listing } })).toBeGreaterThan(0);
  });
});
