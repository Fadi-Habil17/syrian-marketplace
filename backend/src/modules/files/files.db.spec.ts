import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { AppModule } from '../../app.module';
import { configureApp } from '../../bootstrap';
import { FilesService } from './files.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
const run =
  process.env.DATABASE_TEST_URL && process.env.STORAGE_ENDPOINT && process.env.CLAMAV_HOST
    ? describe
    : describe.skip;
run('Actual S3, ClamAV and HTTP upload authorization', () => {
  let app: INestApplication,
    files: FilesService,
    token: string,
    other: string,
    png: Buffer,
    id: string;
  const http = () => request(app.getHttpServer());
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_TEST_URL;
    process.env.JWT_ACCESS_SECRET ??= 'ci-access-secret-for-isolated-tests-only-123';
    process.env.JWT_REFRESH_SECRET ??= 'ci-refresh-secret-for-isolated-tests-only-456';
    const m = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(m.createNestApplication());
    await app.init();
    files = app.get(FilesService);
    for (const [who, assign] of [
      ['freelancer', (t: string) => (token = t)],
      ['customer', (t: string) => (other = t)],
    ] as const)
      assign(
        (
          await http()
            .post('/api/v1/auth/login')
            .send({
              email: who + '@demo.marketplace.test',
              password: 'Marketplace123!',
              client: 'WEB',
            })
            .expect(200)
        ).body.accessToken,
      );
    png = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#abcdef' } })
      .png()
      .toBuffer();
  }, 30000);
  afterAll(async () => {
    await app?.close();
  });
  it('quarantines real bytes and replays the same upload key', async () => {
    const key = randomUUID();
    const upload = () =>
      http()
        .post('/api/v1/files/uploads')
        .auth(token, { type: 'bearer' })
        .set('Idempotency-Key', key)
        .field('accessClass', 'PUBLIC_CATALOG')
        .attach('file', png, { filename: 'demo.png', contentType: 'image/png' });
    const r = await upload().expect(202);
    id = r.body.id;
    expect(r.body.scanStatus).toBe('QUARANTINED');
    expect(r.body.storageKey).toBeUndefined();
    expect((await upload().expect(202)).body.id).toBe(id);
    await http()
      .get('/api/v1/files/' + id + '/download')
      .auth(token, { type: 'bearer' })
      .expect(403);
  });
  it('scans the actual stored object and downloads only clean owned content', async () => {
    expect((await files.scan(id)).scanStatus).toBe('CLEAN');
    const r = await http()
      .get('/api/v1/files/' + id + '/download')
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect(r.headers['content-type']).toContain('image/png');
    await http()
      .get('/api/v1/files/' + id + '/status')
      .auth(other, { type: 'bearer' })
      .expect(404);
    await http()
      .get('/api/v1/files/' + id + '/download')
      .auth(other, { type: 'bearer' })
      .expect(404);
  });
  it('rejects MIME/extension spoofing before persistence', async () => {
    await http()
      .post('/api/v1/files/uploads')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', randomUUID())
      .field('accessClass', 'PUBLIC_CATALOG')
      .attach('file', png, { filename: 'spoof.jpg', contentType: 'image/jpeg' })
      .expect(415);
  });
  it('rejects harmless EICAR test content through the real S3 and ClamAV pipeline', async () => {
    // Python zipfile fixture containing the official 68-byte harmless EICAR pattern.
    // A PDF-prefixed pattern is not the standard fixture (ClamAV correctly did not match it).
    const bytes = Buffer.from(
      'UEsDBBQAAAAIACqxd108z1FoRgAAAEQAAAAQAAAAc2Nhbm5lci10ZXN0LnR4dIsw9VcMUHVwDIg2iQmIijA10QiI0zR3dtY0r1Vx9XR2DNINDnH0c3EMctF19AvxDPMMCg3WDXENDtF18/RxVVTx0PbQAgBQSwECFAAUAAAACAAqsXddPM9RaEYAAABEAAAAEAAAAAAAAAAAAAAAgAEAAAAAc2Nhbm5lci10ZXN0LnR4dFBLBQYAAAAAAQABAD4AAAB0AAAAAAA=',
      'base64',
    );
    const listing = await app.get(PrismaService).listing.findFirstOrThrow({
      where: {
        kind: 'FREELANCE',
        status: 'PUBLISHED',
        profile: { user: { email: 'freelancer@demo.marketplace.test' } },
      },
    });
    const order = (
      await http()
        .post('/api/v1/orders/freelance')
        .auth(other, { type: 'bearer' })
        .set('Idempotency-Key', randomUUID())
        .send({ listingId: listing.id, description: 'Isolated antivirus fixture' })
        .expect(201)
    ).body;
    const upload = await http()
      .post('/api/v1/files/uploads')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', randomUUID())
      .field('accessClass', 'FINAL_DELIVERABLE')
      .field('orderId', order.id)
      .attach('file', bytes, { filename: 'scanner-test.zip', contentType: 'application/zip' })
      .expect(202);
    expect((await files.scan(upload.body.id)).scanStatus).toBe('REJECTED');
    await http()
      .get('/api/v1/files/' + upload.body.id + '/download')
      .auth(token, { type: 'bearer' })
      .expect(403);
  });
});
