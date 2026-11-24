import { createHash, randomUUID } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { MarketplaceFinance } from './marketplace-finance';
import { LocalSimulatedGateway } from '../infrastructure/local-simulated-gateway';
import { serviceSplit } from '../domain/money';

const run = process.env.DATABASE_TEST_URL ? describe : describe.skip;
run('PostgreSQL financial invariants (real transactions, no repository mocks)', () => {
  const db = new PrismaClient({
    datasourceUrl:
      process.env.DATABASE_TEST_URL ?? 'postgresql://unused:unused@localhost:5432/unused_test',
  });
  const finance = new MarketplaceFinance(db),
    gateway = new LocalSimulatedGateway();
  let adminId: string;
  beforeAll(async () => {
    const admin = await db.user.create({
      data: {
        email: `admin-${randomUUID()}@demo.test`,
        displayName: 'Integration admin',
        passwordHash: 'not-a-login-fixture',
      },
    });
    adminId = admin.id;
    const role = await db.role.upsert({
      where: { code: 'ADMIN' },
      update: {},
      create: { code: 'ADMIN', name: 'Admin' },
    });
    await db.userRole.create({ data: { userId: adminId, roleId: role.id } });
  });
  afterAll(() => db.$disconnect());
  async function fixture(credit = 100000n) {
    return db.$transaction(
      async (tx) => {
        const buyer = await tx.user.create({
          data: {
            email: `buyer-${randomUUID()}@demo.test`,
            displayName: 'Test buyer',
            passwordHash: 'not-a-login-fixture',
          },
        });
        const seller = await tx.user.create({
          data: {
            email: `seller-${randomUUID()}@demo.test`,
            displayName: 'Test seller',
            passwordHash: 'not-a-login-fixture',
          },
        });
        const profile = await tx.businessProfile.create({
          data: {
            userId: seller.id,
            type: 'FREELANCER',
            status: 'ACTIVE',
            title: 'Test provider',
            bio: 'Test-only fixture',
          },
        });
        const category = await tx.category.create({
          data: { workspace: 'FREELANCE', nameAr: 'اختبار', nameEn: 'Test' },
        });
        const listing = await tx.listing.create({
          data: {
            profileId: profile.id,
            categoryId: category.id,
            kind: 'FREELANCE',
            currency: 'SYP',
            priceUnits: 3002n,
            deliveryDays: 3,
            titleAr: 'اختبار',
            titleEn: 'Test',
            descriptionAr: 'اختبار',
            descriptionEn: 'Test',
            status: 'PUBLISHED',
          },
        });
        const available = await tx.ledgerAccount.create({
          data: { userId: buyer.id, currency: 'SYP', kind: 'AVAILABLE' },
        });
        await tx.wallet.create({
          data: { userId: buyer.id, currency: 'SYP', accountId: available.id },
        });
        const sellerAccount = await tx.ledgerAccount.create({
          data: { userId: seller.id, currency: 'SYP', kind: 'AVAILABLE' },
        });
        await tx.wallet.create({
          data: { userId: seller.id, currency: 'SYP', accountId: sellerAccount.id },
        });
        const clearing = await tx.ledgerAccount.findFirstOrThrow({
          where: { currency: 'SYP', kind: 'SIMULATOR_CLEARING' },
        });
        if (credit) {
          const key = `fixture:${randomUUID()}`;
          await gateway.payout(
            {
              operationKey: key,
              requestHash: createHash('sha256').update(key).digest('hex'),
              orderId: null,
              actorId: adminId,
              currency: 'SYP',
              kind: 'SIMULATED_TOPUP',
              postings: [
                { accountId: clearing.id, debitUnits: credit, creditUnits: 0n },
                { accountId: available.id, debitUnits: 0n, creditUnits: credit },
              ],
            },
            tx,
          );
        }
        const order = await tx.marketOrder.create({
          data: {
            buyerId: buyer.id,
            sellerProfileId: profile.id,
            workspace: 'FREELANCE',
            currency: 'SYP',
            state: 'AWAITING_DEPOSIT',
            agreedTotalUnits: 3002n,
            eligibleSellerUnits: 3002n,
            agreementSnapshot: { scope: 'Integration fixture' },
          },
        });
        const split = serviceSplit(3002n);
        const service = await tx.serviceOrder.create({
          data: {
            orderId: order.id,
            kind: 'FREELANCE',
            listingId: listing.id,
            depositUnits: split.deposit,
            balanceUnits: split.balance,
            depositDeadlineAt: new Date(Date.now() + 48 * 3600000),
            dueAt: new Date(Date.now() + 86400000),
          },
        });
        const escrow = await tx.ledgerAccount.create({
          data: { orderId: order.id, currency: 'SYP', kind: 'ESCROW' },
        });
        await tx.escrow.create({
          data: { orderId: order.id, accountId: escrow.id, currency: 'SYP' },
        });
        return {
          buyer,
          seller,
          profile,
          available,
          sellerAccount,
          order,
          service,
          escrow,
          clearing,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 },
    );
  }
  const deposit = (f: Awaited<ReturnType<typeof fixture>>, key = randomUUID()) =>
    finance.hold({
      orderId: f.order.id,
      actorId: f.buyer.id,
      installment: 'DEPOSIT',
      expectedVersion: 1,
      idempotencyKey: key,
      termsAccepted: true,
    });
  async function deliveredFixture(afterDeposit?: () => Promise<void>) {
    const f = await fixture();
    await deposit(f);
    await afterDeposit?.();
    await db.$transaction(async (tx) => {
      const now = new Date();
      await tx.serviceOrder.update({
        where: { id: f.service.id },
        data: {
          readyAt: now,
          readinessEvidence: { note: 'Documented test readiness' },
          balanceDeadlineAt: new Date(now.getTime() + 72 * 3600000),
        },
      });
      await tx.marketOrder.update({
        where: { id: f.order.id },
        data: { state: 'READY_FOR_FINAL_PAYMENT', version: 3, workStartedAt: now },
      });
      await tx.orderTransition.create({
        data: {
          orderId: f.order.id,
          actorId: f.seller.id,
          fromState: 'DEPOSIT_HELD',
          toState: 'READY_FOR_FINAL_PAYMENT',
          version: 3,
          reason: 'Test readiness fixture',
          operationKey: `ready:${f.order.id}`,
        },
      });
    });
    await finance.hold({
      orderId: f.order.id,
      actorId: f.buyer.id,
      installment: 'BALANCE',
      expectedVersion: 3,
      idempotencyKey: randomUUID(),
      termsAccepted: true,
    });
    await db.$transaction(async (tx) => {
      const file = await tx.fileAsset.create({
        data: {
          ownerId: f.seller.id,
          orderId: f.order.id,
          storageKey: `test/${randomUUID()}.pdf`,
          originalName: 'test.pdf',
          mimeType: 'application/pdf',
          extension: 'pdf',
          sizeBytes: 100n,
          accessClass: 'FINAL_DELIVERABLE',
          scanStatus: 'CLEAN',
        },
      });
      await tx.submission.create({
        data: {
          serviceOrderId: f.service.id,
          actorId: f.seller.id,
          kind: 'DIGITAL_FINAL',
          fileId: file.id,
          version: 1,
        },
      });
      const now = new Date();
      await tx.marketOrder.update({
        where: { id: f.order.id },
        data: {
          state: 'DELIVERED',
          version: 5,
          deliveredAt: now,
          reviewDeadlineAt: new Date(now.getTime() + 72 * 3600000),
          deliveryVerified: true,
          deliveryVersion: 1,
        },
      });
      await tx.orderTransition.create({
        data: {
          orderId: f.order.id,
          actorId: f.seller.id,
          fromState: 'FULLY_FUNDED',
          toState: 'DELIVERED',
          version: 5,
          reason: 'Test final submission',
          operationKey: `deliver:${f.order.id}`,
        },
      });
    });
    return f;
  }
  it('does not post money or advance state on insufficient funds, including retries', async () => {
    const f = await fixture(0n),
      key = randomUUID();
    const first = await deposit(f, key),
      second = await deposit(f, key);
    expect(first.status).toBe('FAILED');
    expect(second.id).toBe(first.id);
    expect((await db.marketOrder.findUniqueOrThrow({ where: { id: f.order.id } })).state).toBe(
      'AWAITING_DEPOSIT',
    );
    expect(await db.ledgerJournal.count({ where: { orderId: f.order.id } })).toBe(0);
    expect(
      (await db.ledgerAccount.findUniqueOrThrow({ where: { id: f.available.id } })).balanceUnits,
    ).toBe(0n);
  });
  it('serializes competing request keys into one successful installment', async () => {
    const f = await fixture(),
      results = await Promise.all([deposit(f), deposit(f)]);
    expect(results[0].id).toBe(results[1].id);
    expect(
      await db.paymentAttempt.count({ where: { orderId: f.order.id, status: 'SUCCEEDED' } }),
    ).toBe(1);
    expect((await db.escrow.findUniqueOrThrow({ where: { orderId: f.order.id } })).heldUnits).toBe(
      1001n,
    );
  });
  it('rolls back an unbalanced journal and forbids direct balance changes', async () => {
    const f = await fixture();
    const before = (await db.ledgerAccount.findUniqueOrThrow({ where: { id: f.available.id } }))
      .balanceUnits;
    await expect(
      db.$transaction(async (tx) => {
        const j = await tx.ledgerJournal.create({
          data: {
            operationKey: randomUUID(),
            requestHash: '0'.repeat(64),
            currency: 'SYP',
            kind: 'SIMULATED_TOPUP',
            actorId: adminId,
          },
        });
        await tx.ledgerEntry.create({
          data: { journalId: j.id, accountId: f.available.id, currency: 'SYP', creditUnits: 1n },
        });
      }),
    ).rejects.toThrow();
    expect(
      (await db.ledgerAccount.findUniqueOrThrow({ where: { id: f.available.id } })).balanceUnits,
    ).toBe(before);
    await expect(
      db.ledgerAccount.update({ where: { id: f.available.id }, data: { balanceUnits: 999999n } }),
    ).rejects.toThrow();
  });
  it('rejects mixed-currency entries and later journal edits/appends', async () => {
    const f = await fixture();
    const held = await deposit(f);
    const p = await db.paymentAttempt.findUniqueOrThrow({ where: { id: held.id } });
    await expect(
      db.ledgerJournal.update({
        where: { id: p.journalId! },
        data: { operationKey: randomUUID() },
      }),
    ).rejects.toThrow();
    await expect(
      db.ledgerEntry.create({
        data: {
          journalId: p.journalId!,
          accountId: f.available.id,
          currency: 'SYP',
          creditUnits: 1n,
        },
      }),
    ).rejects.toThrow();
    await expect(
      db.$transaction(async (tx) => {
        const other = await tx.ledgerAccount.create({
          data: { userId: f.buyer.id, currency: 'USD', kind: 'AVAILABLE' },
        });
        const j = await tx.ledgerJournal.create({
          data: {
            operationKey: randomUUID(),
            requestHash: '0'.repeat(64),
            currency: 'SYP',
            kind: 'SIMULATED_TOPUP',
            actorId: adminId,
          },
        });
        await tx.ledgerEntry.create({
          data: { journalId: j.id, accountId: other.id, currency: 'SYP', creditUnits: 1n },
        });
      }),
    ).rejects.toThrow();
  });
  it('settles once across competing completion requests and conserves held units', async () => {
    const f = await deliveredFixture();
    const results = await Promise.all([
      finance.complete({
        orderId: f.order.id,
        actorId: f.buyer.id,
        expectedVersion: 5,
        idempotencyKey: randomUUID(),
      }),
      finance.complete({
        orderId: f.order.id,
        actorId: f.buyer.id,
        expectedVersion: 5,
        idempotencyKey: randomUUID(),
      }),
    ]);
    expect(results[0].id).toBe(results[1].id);
    expect(await db.settlement.count({ where: { orderId: f.order.id } })).toBe(1);
    const entries = await db.allocation.findMany({ where: { settlementId: results[0].id } });
    expect(entries.reduce((s, x) => s + x.units, 0n)).toBe(3002n);
    expect((await db.escrow.findUniqueOrThrow({ where: { orderId: f.order.id } })).heldUnits).toBe(
      0n,
    );
  });
  it('serializes an accepted dispute against buyer completion without paying frozen funds', async () => {
    const f = await deliveredFixture();
    await Promise.allSettled([
      finance.openDispute({
        orderId: f.order.id,
        actorId: f.buyer.id,
        reason: 'Test evidence dispute',
        expectedVersion: 5,
        idempotencyKey: randomUUID(),
      }),
      finance.complete({
        orderId: f.order.id,
        actorId: f.buyer.id,
        expectedVersion: 5,
        idempotencyKey: randomUUID(),
      }),
    ]);
    const cases = await db.caseRecord.count({ where: { orderId: f.order.id } }),
      settlements = await db.settlement.count({ where: { orderId: f.order.id } });
    expect(cases + settlements).toBe(1);
    if (cases)
      expect(
        (await db.escrow.findUniqueOrThrow({ where: { orderId: f.order.id } })).heldUnits,
      ).toBe(3002n);
  });
  it('blocks workspace archival during buyer/provider commitments', async () => {
    const f = await fixture();
    await expect(
      db.businessProfile.update({ where: { id: f.profile.id }, data: { status: 'ARCHIVED' } }),
    ).rejects.toThrow();
  });
  it('keeps the first-hold commission snapshot after a rate change and rounds the final award once', async () => {
    const previous = await db.commissionRate.findFirst({
      where: { workspace: 'FREELANCE' },
      orderBy: [{ effectiveAt: 'desc' }, { version: 'desc' }],
    });
    let version =
      (
        await db.commissionRate.aggregate({
          where: { workspace: 'FREELANCE' },
          _max: { version: true },
        })
      )._max.version ?? 0;
    const rate = async (basisPoints: number) => {
      await db.commissionRate.create({
        data: { workspace: 'FREELANCE', version: ++version, basisPoints, adminId },
      });
    };
    try {
      await rate(375);
      const f = await deliveredFixture(() => rate(900));
      expect(
        (await db.marketOrder.findUniqueOrThrow({ where: { id: f.order.id } }))
          .commissionBpsSnapshot,
      ).toBe(375);
      const settled = await finance.complete({
        orderId: f.order.id,
        actorId: f.buyer.id,
        expectedVersion: 5,
        idempotencyKey: randomUUID(),
      });
      const allocations = await db.allocation.findMany({ where: { settlementId: settled.id } });
      expect(allocations.find((a) => a.kind === 'COMMISSION')!.units).toBe(113n);
      expect(allocations.reduce((sum, a) => sum + a.units, 0n)).toBe(3002n);
    } finally {
      await rate(previous?.basisPoints ?? 0);
    }
  });
});
