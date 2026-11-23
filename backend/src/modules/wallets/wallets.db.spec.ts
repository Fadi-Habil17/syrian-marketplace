import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../../app.module';
import { configureApp } from '../../bootstrap';
import { PrismaService } from '../../infrastructure/database/prisma.service';
const run = process.env.DATABASE_TEST_URL ? describe : describe.skip;
run('Wallet HTTP reads and authorized simulator funding', () => {
  let app: INestApplication, db: PrismaService, admin: string, buyer: string, userId: string;
  const http = () => request(app.getHttpServer());
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_TEST_URL;
    process.env.JWT_ACCESS_SECRET ??= 'ci-access-secret-for-isolated-tests-only-123';
    process.env.JWT_REFRESH_SECRET ??= 'ci-refresh-secret-for-isolated-tests-only-456';
    const m = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(m.createNestApplication());
    await app.init();
    db = app.get(PrismaService);
    for (const [role, save] of [
      ['admin', (r: any) => (admin = r.accessToken)],
      [
        'customer',
        (r: any) => {
          buyer = r.accessToken;
          userId = r.user.id;
        },
      ],
    ] as const)
      save(
        (
          await http()
            .post('/api/v1/auth/login')
            .send({
              email: role + '@demo.marketplace.test',
              password: 'Marketplace123!',
              client: 'WEB',
            })
            .expect(200)
        ).body,
      );
  }, 30000);
  afterAll(async () => {
    await app?.close();
  });
  it('returns actual own currency balances and restricts the funding endpoint', async () => {
    const r = await http().get('/api/v1/wallets').auth(buyer, { type: 'bearer' }).expect(200);
    expect(r.body.items.map((w: any) => w.currency).sort()).toEqual(['SYP', 'USD']);
    for (const w of r.body.items) {
      const a = await db.wallet.findUniqueOrThrow({
        where: { userId_currency: { userId, currency: w.currency } },
        include: { account: true },
      });
      expect(w.availableUnits).toBe(a.account.balanceUnits.toString());
    }
    await http()
      .post('/api/v1/admin/simulator/topups')
      .auth(buyer, { type: 'bearer' })
      .set('Idempotency-Key', randomUUID())
      .send({ userId, amount: { currency: 'SYP', units: '500' }, reason: 'Unauthorized' })
      .expect(403);
  });
  it('posts one balanced journal across concurrent retries of an admin topup', async () => {
    const before = await db.wallet.findUniqueOrThrow({
        where: { userId_currency: { userId, currency: 'SYP' } },
        include: { account: true },
      }),
      key = randomUUID(),
      body = {
        userId,
        amount: { currency: 'SYP', units: '500' },
        reason: 'Isolated integration funding',
      };
    const send = () =>
      http()
        .post('/api/v1/admin/simulator/topups')
        .auth(admin, { type: 'bearer' })
        .set('Idempotency-Key', key)
        .send(body)
        .expect(200);
    const results = await Promise.all([send(), send()]);
    expect(results[0].body.id).toBe(results[1].body.id);
    const account = await db.ledgerAccount.findUniqueOrThrow({ where: { id: before.accountId } });
    expect(account.balanceUnits).toBe(before.account.balanceUnits + 500n);
    const j = await db.ledgerEntry.findMany({ where: { journalId: results[0].body.id } });
    expect(j.reduce((n, e) => n + e.debitUnits - e.creditUnits, 0n)).toBe(0n);
  });
  it('lists only the current wallet entries with no arbitrary account selection', async () => {
    const r = await http()
      .get('/api/v1/wallets/SYP/transactions')
      .auth(buyer, { type: 'bearer' })
      .expect(200);
    expect(r.body.items.length).toBeGreaterThan(0);
    expect(r.body.items.every((j: any) => j.currency === 'SYP')).toBe(true);
    await http()
      .get('/api/v1/wallets/EUR/transactions')
      .auth(buyer, { type: 'bearer' })
      .expect(400);
  });
});
