import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { AppModule } from '../../app.module';
import { configureApp } from '../../bootstrap';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { FilesService } from '../files/files.service';
import { ScheduledJobsService } from '../jobs/scheduled-jobs.service';
import { OrderLifecycle } from '../orders/order-lifecycle.service';
import { OutboxWorker } from '../jobs/outbox-worker.service';
const run =
  process.env.DATABASE_TEST_URL && process.env.STORAGE_ENDPOINT && process.env.CLAMAV_HOST
    ? describe
    : describe.skip;
run('Freelance, confirmed bookings and approved itemized quote convergence', () => {
  let app: INestApplication,
    db: PrismaService,
    buyer: string,
    provider: string,
    freelancer: string,
    customerId: string,
    professionalId: string,
    listingId: string,
    freelanceListingId: string,
    addressId: string,
    booking: any,
    quoteOrder: any,
    quote: any,
    start: Date;
  const http = () => request(app.getHttpServer()),
    key = () => randomUUID();
  let adminToken = '';
  const post = (route: string, token: string, body: any, version?: number, idempotency = key()) => {
    let r = http()
      .post('/api/v1/' + route)
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', idempotency);
    if (version) r = r.set('If-Match', `"${version}"`);
    return r.send(body);
  };
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_TEST_URL;
    process.env.JWT_ACCESS_SECRET ??= 'ci-access-secret-for-isolated-tests-only-123';
    process.env.JWT_REFRESH_SECRET ??= 'ci-refresh-secret-for-isolated-tests-only-456';
    const m = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(m.createNestApplication());
    await app.init();
    db = app.get(PrismaService);
    const email = `service-${key()}@demo.test`,
      u = (
        await http()
          .post('/api/v1/auth/register')
          .send({ email, password: 'Marketplace123!', displayName: 'Service buyer', locale: 'ar' })
          .expect(201)
      ).body;
    customerId = u.id;
    await db.user.update({ where: { id: u.id }, data: { verifiedAt: new Date() } });
    buyer = (
      await http()
        .post('/api/v1/auth/login')
        .send({ email, password: 'Marketplace123!', client: 'WEB' })
        .expect(200)
    ).body.accessToken;
    let admin: string = '';
    for (const [role, save] of [
      [
        'professional',
        (r: any) => {
          provider = r.accessToken;
          professionalId = r.user.activeBusinessProfile.id;
        },
      ],
      ['freelancer', (r: any) => (freelancer = r.accessToken)],
      ['admin', (r: any) => (admin = r.accessToken)],
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
    for (const currency of ['SYP', 'USD'])
      await post('admin/simulator/topups', admin, {
        userId: customerId,
        amount: { currency, units: '5000000' },
        reason: 'Isolated service tests',
      }).expect(200);
    const l = await db.listing.findFirstOrThrow({
      where: { kind: 'PROFESSIONAL_PACKAGE', status: 'PUBLISHED', currency: 'SYP' },
    });
    listingId = l.id;
    freelanceListingId = (
      await db.listing.findFirstOrThrow({
        where: { kind: 'FREELANCE', status: 'PUBLISHED', currency: 'SYP' },
      })
    ).id;
    const city = (await db.city.findFirstOrThrow()).id;
    const areaId = (await db.area.findFirstOrThrow({ where: { cityId: city } })).id;
    addressId = (
      await post('me/addresses', buyer, {
        cityId: city,
        areaId,
        label: 'Test',
        details: 'Fictional service address',
        contactName: 'Buyer',
        contactPhone: '+000000',
      }).expect(201)
    ).body.id;
    const latest = await db.scheduleReservation.aggregate({
      where: { providerId: professionalId },
      _max: { endsAt: true },
    });
    start = new Date(
      Math.ceil(
        Math.max(Date.now() + 3 * 86400000, (latest._max.endsAt?.getTime() ?? 0) + 3600000) /
          1800000,
      ) * 1800000,
    );
    adminToken = admin;
  }, 30000);
  afterAll(async () => {
    await app?.close();
  });
  it('fixes a freelance price on the backend and requires both scope approvals', async () => {
    await post('orders/freelance', buyer, {
      listingId: freelanceListingId,
      description: 'Unauthorized price',
      price: { currency: 'SYP', units: '1' },
    }).expect(400);
    const created = (
      await post('orders/freelance', buyer, {
        listingId: freelanceListingId,
        description: 'Fictional agreed design',
      }).expect(201)
    ).body;
    expect(created.state).toBe('AWAITING_AGREEMENT');
    const agreed = (
      await post(
        'orders/' + created.id + '/agree',
        freelancer,
        { scope: created.terms.scope, dueAt: created.terms.dueAt, accepted: true },
        created.version,
      ).expect(200)
    ).body.order;
    expect(agreed.state).toBe('AWAITING_DEPOSIT');
    expect(BigInt(agreed.deposit.units) + BigInt(agreed.balance.units)).toBe(
      BigInt(agreed.total.units),
    );
  });
  it('does not allow a professional deposit before provider schedule confirmation', async () => {
    booking = (
      await post('orders/professional-bookings', buyer, {
        listingId,
        addressId,
        startsAt: start.toISOString(),
      }).expect(201)
    ).body;
    expect(booking.state).toBe('BOOKING_REQUESTED');
    await post(
      'orders/' + booking.id + '/payments/deposit',
      buyer,
      { termsAccepted: true },
      booking.version,
    ).expect(409);
    expect(await db.paymentAttempt.count({ where: { orderId: booking.id } })).toBe(0);
    booking = (
      await post(
        'orders/' + booking.id + '/accept-booking',
        provider,
        { accepted: true },
        booking.version,
      ).expect(200)
    ).body.order;
    expect(booking.service.booking.state).toBe('CONFIRMED');
    const paid = (
      await post(
        'orders/' + booking.id + '/payments/deposit',
        buyer,
        { termsAccepted: true },
        booking.version,
      ).expect(200)
    ).body;
    expect(paid.order.state).toBe('DEPOSIT_HELD');
    expect(paid.payment.status).toBe('SUCCEEDED');
  });
  it('requires buyer acceptance of an alternative slot', async () => {
    let o = (
      await post('orders/professional-bookings', buyer, {
        listingId,
        addressId,
        startsAt: new Date(start.getTime() + 3 * 3600000).toISOString(),
      }).expect(201)
    ).body;
    o = (
      await post(
        'orders/' + o.id + '/propose-schedule',
        provider,
        { startsAt: new Date(start.getTime() + 4 * 3600000).toISOString() },
        o.version,
      ).expect(200)
    ).body.order;
    expect(o.state).toBe('SCHEDULE_PROPOSED');
    await post(
      'orders/' + o.id + '/payments/deposit',
      buyer,
      { termsAccepted: true },
      o.version,
    ).expect(409);
    o = (
      await post(
        'orders/' + o.id + '/accept-schedule',
        buyer,
        { accepted: true },
        o.version,
      ).expect(200)
    ).body.order;
    expect(o.state).toBe('AWAITING_DEPOSIT');
    expect(o.service.booking.buyerAcceptedAt).not.toBeNull();
  });
  it('claims private inspection photos and sends an itemized backend-calculated quote', async () => {
    const bytes = await sharp({
      create: { width: 2, height: 2, channels: 3, background: '#123456' },
    })
      .png()
      .toBuffer();
    const file = (
      await http()
        .post('/api/v1/files/uploads')
        .auth(buyer, { type: 'bearer' })
        .set('Idempotency-Key', key())
        .field('accessClass', 'ORDER_SHARED')
        .attach('file', bytes, { filename: 'inspection.png', contentType: 'image/png' })
        .expect(202)
    ).body;
    await app.get(FilesService).scan(file.id);
    quoteOrder = (
      await post('orders/inspection-requests', buyer, {
        providerProfileId: professionalId,
        currency: 'USD',
        addressId,
        description: 'Inspect fictional wiring',
        photoIds: [file.id],
      }).expect(201)
    ).body;
    expect(quoteOrder.total).toBeNull();
    expect(quoteOrder.terms.dueAt).toBeNull();
    const starts = new Date(start.getTime() + 8 * 3600000),
      ends = new Date(starts.getTime() + 3600000);
    quote = (
      await post(
        'orders/' + quoteOrder.id + '/quotes',
        provider,
        {
          currency: 'USD',
          scope: 'Agreed labor and materials',
          startsAt: starts.toISOString(),
          endsAt: ends.toISOString(),
          dueAt: ends.toISOString(),
          items: [
            { description: 'Labor', quantity: 1, unitPriceUnits: '100' },
            { description: 'Materials', quantity: 1, unitPriceUnits: '1' },
          ],
        },
        quoteOrder.version,
      ).expect(201)
    ).body;
    expect(quote.totalUnits).toBe('101');
    expect(quote.depositUnits).toBe('34');
  });
  it('approves an exact quote version then enters the same deposit-held workflow', async () => {
    const approved = (
      await post(
        'quotes/' + quote.id + '/approve',
        buyer,
        { accepted: true },
        quote.orderVersion,
      ).expect(200)
    ).body.order;
    expect(approved.state).toBe('AWAITING_DEPOSIT');
    expect(approved.service.approvedQuoteId).toBe(quote.id);
    const paid = (
      await post(
        'orders/' + approved.id + '/payments/deposit',
        buyer,
        { termsAccepted: true },
        approved.version,
      ).expect(200)
    ).body;
    expect(paid.order.state).toBe('DEPOSIT_HELD');
    expect(paid.payment.amount.units).toBe('34');
    const timeline = await db.orderTransition.findMany({ where: { orderId: approved.id } });
    expect(timeline.some((t) => t.toState === 'APPROVED')).toBe(true);
  });
  it('runs the real two-hold freelance workflow and releases the ledger once', async () => {
    let o = (
      await post('orders/freelance', buyer, {
        listingId: freelanceListingId,
        description: 'Complete fictional deliverable',
      }).expect(201)
    ).body;
    o = (
      await post(
        'orders/' + o.id + '/agree',
        freelancer,
        { scope: o.terms.scope, dueAt: o.terms.dueAt, accepted: true },
        o.version,
      ).expect(200)
    ).body.order;
    o = (
      await post(
        'orders/' + o.id + '/payments/deposit',
        buyer,
        { termsAccepted: true },
        o.version,
      ).expect(200)
    ).body.order;
    await post('orders/' + o.id + '/start', buyer, { accepted: true }, o.version).expect(403);
    o = (
      await post('orders/' + o.id + '/start', freelancer, { accepted: true }, o.version).expect(200)
    ).body.order;
    await post(
      'orders/' + o.id + '/deliver',
      freelancer,
      { kind: 'DIGITAL_FINAL', note: 'Too early' },
      o.version,
    ).expect(409);
    o = (
      await post(
        'orders/' + o.id + '/ready',
        freelancer,
        {
          note: 'Scope complete',
          completedScope: ['Complete fictional deliverable'],
          previewFileIds: [],
        },
        o.version,
      ).expect(200)
    ).body.order;
    o = (
      await post(
        'orders/' + o.id + '/payments/balance',
        buyer,
        { termsAccepted: true },
        o.version,
      ).expect(200)
    ).body.order;
    const bytes = await sharp({
      create: { width: 2, height: 2, channels: 3, background: '#abcdef' },
    })
      .png()
      .toBuffer();
    const f = (
      await http()
        .post('/api/v1/files/uploads')
        .auth(freelancer, { type: 'bearer' })
        .set('Idempotency-Key', key())
        .field('accessClass', 'FINAL_DELIVERABLE')
        .field('orderId', o.id)
        .attach('file', bytes, { filename: 'final.png', contentType: 'image/png' })
        .expect(202)
    ).body;
    await app.get(FilesService).scan(f.id);
    o = (
      await post(
        'orders/' + o.id + '/deliver',
        freelancer,
        { kind: 'DIGITAL_FINAL', note: 'Delivered after balance', fileIds: [f.id] },
        o.version,
      ).expect(200)
    ).body.order;
    expect(o.state).toBe('DELIVERED');
    const idem = key(),
      v = o.version;
    const receipt = await post(
      'orders/' + o.id + '/confirm',
      buyer,
      { accepted: true },
      v,
      idem,
    ).expect(200);
    expect(receipt.body.order.state).toBe('COMPLETED');
    await post('orders/' + o.id + '/confirm', buyer, { accepted: true }, v, idem).expect(200);
    expect(await db.settlement.count({ where: { orderId: o.id } })).toBe(1);
    expect(await db.paymentAttempt.count({ where: { orderId: o.id, status: 'SUCCEEDED' } })).toBe(
      2,
    );
    expect(await db.ledgerJournal.count({ where: { orderId: o.id, kind: 'SETTLEMENT' } })).toBe(1);
  });
  async function funded(work = false) {
    let o = (
      await post('orders/freelance', buyer, {
        listingId: freelanceListingId,
        description: 'Cancellation fixture',
      }).expect(201)
    ).body;
    o = (
      await post(
        'orders/' + o.id + '/agree',
        freelancer,
        { scope: o.terms.scope, dueAt: o.terms.dueAt, accepted: true },
        o.version,
      ).expect(200)
    ).body.order;
    o = (
      await post(
        'orders/' + o.id + '/payments/deposit',
        buyer,
        { termsAccepted: true },
        o.version,
      ).expect(200)
    ).body.order;
    if (work)
      o = (
        await post('orders/' + o.id + '/start', freelancer, { accepted: true }, o.version).expect(
          200,
        )
      ).body.order;
    return o;
  }
  it('refunds a prestart deposit completely and releases it only once', async () => {
    const o = await funded(),
      idem = key(),
      r = (
        await post(
          'orders/' + o.id + '/cancel',
          buyer,
          { reason: 'Before work' },
          o.version,
          idem,
        ).expect(200)
      ).body;
    expect(r.order.state).toBe('CANCELLED');
    expect(r.settlement.allocations).toHaveLength(1);
    expect(r.settlement.allocations[0].kind).toBe('BUYER_REFUND');
    expect(r.settlement.allocations[0].units).toBe(o.deposit.units);
    await post(
      'orders/' + o.id + '/cancel',
      buyer,
      { reason: 'Before work' },
      o.version,
      idem,
    ).expect(200);
    expect(await db.settlement.count({ where: { orderId: o.id } })).toBe(1);
  });
  it('freezes a working order until both parties accept the same split', async () => {
    let o = await funded(true);
    const cancelled = (
      await post(
        'orders/' + o.id + '/cancel',
        buyer,
        {
          reason: 'Stop work',
          proposal: {
            kind: 'CANCELLATION_SPLIT',
            reason: 'Agreed partial work',
            sellerAwardUnits: '100',
            sellerDeliveryUnits: '0',
            driverAwardUnits: '0',
          },
        },
        o.version,
      ).expect(200)
    ).body;
    o = cancelled.order;
    expect(o.state).toBe('CANCELLATION_PENDING');
    expect(o.paused).toBe(true);
    expect(await db.settlement.count({ where: { orderId: o.id } })).toBe(0);
    const proposals = (
      await http()
        .get('/api/v1/cases/' + cancelled.caseId + '/proposals')
        .auth(freelancer, { type: 'bearer' })
        .expect(200)
    ).body.items;
    const result = await post(
      'cases/' + cancelled.caseId + '/proposals/' + proposals[0].id + '/accept',
      freelancer,
      { accepted: true },
      o.version,
    ).expect(200);
    expect(result.body.order.state).toBe('CANCELLED');
    expect(result.body.settlement.mode).toBe('MUTUAL_CANCELLATION');
    expect(
      result.body.settlement.allocations
        .reduce((n: bigint, a: any) => n + BigInt(a.units), 0n)
        .toString(),
    ).toBe(o.held.units);
  });
  async function expireFixture(
    orderId: string,
    kind: 'RESPONSE_EXPIRY' | 'DEPOSIT_EXPIRY' | 'BALANCE_EXPIRY',
    column: 'responseDeadlineAt' | 'depositDeadlineAt' | 'balanceDeadlineAt',
  ) {
    const deadline = new Date(Date.now() - 1000);
    await db.atomic(async (tx) => {
      const s = await tx.serviceOrder.findUniqueOrThrow({ where: { orderId } });
      await tx.serviceOrder.update({
        where: { id: s.id },
        data: {
          [column]: deadline,
          ...(column === 'balanceDeadlineAt'
            ? { readyAt: new Date(deadline.getTime() - 72 * 3600000) }
            : {}),
        },
      });
      await app.get(OrderLifecycle).deadlines.schedule(tx, orderId, kind, deadline, 1);
    });
    await app.get(ScheduledJobsService).tick(200);
    return db.marketOrder.findUniqueOrThrow({
      where: { id: orderId },
      include: { escrow_order: true },
    });
  }
  it('expires unanswered 72h requests and unpaid 48h agreements without charging', async () => {
    const requested = (
      await post('orders/freelance', buyer, {
        listingId: freelanceListingId,
        description: 'Expired request fixture',
      }).expect(201)
    ).body;
    expect((await expireFixture(requested.id, 'RESPONSE_EXPIRY', 'responseDeadlineAt')).state).toBe(
      'EXPIRED',
    );
    let agreed = (
      await post('orders/freelance', buyer, {
        listingId: freelanceListingId,
        description: 'Expired deposit fixture',
      }).expect(201)
    ).body;
    agreed = (
      await post(
        'orders/' + agreed.id + '/agree',
        freelancer,
        { scope: agreed.terms.scope, dueAt: agreed.terms.dueAt, accepted: true },
        agreed.version,
      ).expect(200)
    ).body.order;
    expect((await expireFixture(agreed.id, 'DEPOSIT_EXPIRY', 'depositDeadlineAt')).state).toBe(
      'EXPIRED',
    );
    expect(
      await db.paymentAttempt.count({ where: { orderId: { in: [requested.id, agreed.id] } } }),
    ).toBe(0);
  });
  it('retains the deposit and opens one frozen admin case at balance expiry, even on worker retries', async () => {
    let o = await funded(true);
    o = (
      await post(
        'orders/' + o.id + '/ready',
        freelancer,
        { note: 'Complete fixture scope', completedScope: ['Scope completed'], previewFileIds: [] },
        o.version,
      ).expect(200)
    ).body.order;
    const expired = await expireFixture(o.id, 'BALANCE_EXPIRY', 'balanceDeadlineAt');
    expect(expired.state).toBe('FINAL_PAYMENT_OVERDUE');
    expect(expired.escrow_order!.heldUnits.toString()).toBe(o.deposit.units);
    expect(expired.escrow_order!.status).toBe('FROZEN');
    await app.get(ScheduledJobsService).tick(200);
    expect(
      await db.caseRecord.count({ where: { orderId: o.id, kind: 'FINAL_PAYMENT_OVERDUE' } }),
    ).toBe(1);
    expect(await db.settlement.count({ where: { orderId: o.id } })).toBe(0);
    await post(
      'orders/' + o.id + '/payments/balance',
      buyer,
      { termsAccepted: true },
      expired.version,
    ).expect(409);
    const c = await db.caseRecord.findFirstOrThrow({
        where: { orderId: o.id, kind: 'FINAL_PAYMENT_OVERDUE' },
      }),
      dueAt = new Date(Date.now() + 71 * 3600000).toISOString(),
      proposal = (
        await post(
          'cases/' + c.id + '/proposals',
          buyer,
          {
            kind: 'EXTENSION',
            newDueAt: dueAt,
            reason: 'Both parties request a new final-payment window',
          },
          expired.version,
        ).expect(201)
      ).body;
    let current = (
      await http()
        .get('/api/v1/orders/' + o.id)
        .auth(buyer, { type: 'bearer' })
        .expect(200)
    ).body;
    current = (
      await post(
        'cases/' + c.id + '/proposals/' + proposal.id + '/accept',
        freelancer,
        { accepted: true },
        current.version,
      ).expect(200)
    ).body.order;
    expect(current.state).toBe('FINAL_PAYMENT_OVERDUE');
    await post('admin/cases/' + c.id + '/assign', adminToken, {
      reason: 'Handling admin for explicit resumption',
    }).expect(200);
    current = (
      await post(
        'admin/cases/' + c.id + '/resume-final-payment',
        adminToken,
        { dueAt, reason: 'Authorize exact mutually accepted payment deadline' },
        current.version,
      ).expect(200)
    ).body.order;
    expect(current.state).toBe('READY_FOR_FINAL_PAYMENT');
    const paid = (
      await post(
        'orders/' + o.id + '/payments/balance',
        buyer,
        { termsAccepted: true },
        current.version,
      ).expect(200)
    ).body;
    expect(paid.order.state).toBe('FULLY_FUNDED');
    expect(
      await db.paymentAttempt.count({
        where: { orderId: o.id, installment: 'DEPOSIT', status: 'SUCCEEDED' },
      }),
    ).toBe(1);
  });
  it('keeps private case evidence from the other party and blocks early admin allocation', async () => {
    const o = await funded(true),
      c = (
        await post(
          'orders/' + o.id + '/cases',
          buyer,
          { kind: 'DISPUTE', reason: 'Evidence privacy test' },
          o.version,
        ).expect(201)
      ).body;
    await http()
      .get('/api/v1/cases/' + c.id)
      .auth(adminToken, { type: 'bearer' })
      .expect(404);
    const bytes = await sharp({
        create: { width: 2, height: 2, channels: 3, background: '#457812' },
      })
        .png()
        .toBuffer(),
      f = (
        await http()
          .post('/api/v1/files/uploads')
          .auth(buyer, { type: 'bearer' })
          .set('Idempotency-Key', key())
          .field('accessClass', 'CASE_EVIDENCE')
          .field('caseId', c.id)
          .attach('file', bytes, { filename: 'private.png', contentType: 'image/png' })
          .expect(202)
      ).body;
    await app.get(FilesService).scan(f.id);
    await post('cases/' + c.id + '/evidence', buyer, {
      text: 'Private evidence record',
      fileIds: [f.id],
      visibility: 'PRIVATE_ADMIN',
    }).expect(201);
    await http()
      .get('/api/v1/files/' + f.id + '/download')
      .auth(freelancer, { type: 'bearer' })
      .expect(404);
    expect(
      (
        await http()
          .get('/api/v1/cases/' + c.id + '/evidence')
          .auth(freelancer, { type: 'bearer' })
          .expect(200)
      ).body.items,
    ).toHaveLength(0);
    await post('admin/cases/' + c.id + '/assign', adminToken, {
      reason: 'Assigned evidence review',
    }).expect(200);
    await http()
      .get('/api/v1/files/' + f.id + '/download')
      .auth(adminToken, { type: 'bearer' })
      .expect(200);
    const current = (
      await http()
        .get('/api/v1/orders/' + o.id)
        .auth(buyer, { type: 'bearer' })
        .expect(200)
    ).body;
    const response = await post(
      'admin/cases/' + c.id + '/resolve',
      adminToken,
      {
        reason: 'Too early',
        substantiation: 'Both evidence windows remain open',
        sellerAwardUnits: '0',
        sellerDeliveryUnits: '0',
        driverAwardUnits: '0',
        outcome: 'REFUNDED',
      },
      current.version,
    ).expect(409);
    expect(response.body.error.code).toBe('EVIDENCE_WINDOW_OPEN');
    expect(await db.settlement.count({ where: { orderId: o.id } })).toBe(0);
  });
  it('adjudicates an expired evidence-window fixture through the assigned admin REST command once', async () => {
    const o = await funded(true),
      seller = await db.businessProfile.findUniqueOrThrow({ where: { id: o.sellerProfileId } }),
      admin = await db.user.findUniqueOrThrow({ where: { email: 'admin@demo.marketplace.test' } }),
      deadline = new Date(Date.now() - 3600000),
      notifiedAt = new Date(deadline.getTime() - 72 * 3600000);
    const c = await db.atomic(async (tx) => {
      await db.lockUsers(tx, [customerId, seller.userId]);
      await tx.$queryRaw`SELECT "id" FROM "MarketOrder" WHERE "id"=${o.id}::uuid FOR UPDATE`;
      const row = await tx.caseRecord.create({
        data: {
          orderId: o.id,
          openerId: customerId,
          handlingAdminId: admin.id,
          kind: 'DISPUTE',
          reason: 'Expired evidence fixture',
          evidenceDeadlineAt: deadline,
          pausedState: 'IN_PROGRESS',
          caseParty_case: {
            create: [
              { userId: customerId, role: 'BUYER', notifiedAt, evidenceDeadlineAt: deadline },
              { userId: seller.userId, role: 'SELLER', notifiedAt, evidenceDeadlineAt: deadline },
            ],
          },
        },
      });
      await tx.marketOrder.update({ where: { id: o.id }, data: { paused: true } });
      await tx.escrow.update({ where: { orderId: o.id }, data: { status: 'FROZEN' } });
      await app
        .get(OrderLifecycle)
        .changed(tx, o, 'DISPUTED', customerId, 'Expired fixture evidence windows');
      await app
        .get(OrderLifecycle)
        .deadlines.schedule(tx, o.id, 'EVIDENCE_EXPIRY', deadline, o.version, row.id);
      return row;
    });
    await app.get(ScheduledJobsService).tick(200);
    expect((await db.caseRecord.findUniqueOrThrow({ where: { id: c.id } })).status).toBe(
      'ADMIN_REVIEW',
    );
    expect(await db.settlement.count({ where: { orderId: o.id } })).toBe(0);
    const current = (
        await http()
          .get('/api/v1/orders/' + o.id)
          .auth(buyer, { type: 'bearer' })
          .expect(200)
      ).body,
      idem = key(),
      body = {
        reason: 'Documented full refund',
        substantiation: 'Agreed scope was not fulfilled; return the held deposit only',
        sellerAwardUnits: '0',
        sellerDeliveryUnits: '0',
        driverAwardUnits: '0',
        outcome: 'REFUNDED',
      },
      result = (
        await post(
          'admin/cases/' + c.id + '/resolve',
          adminToken,
          body,
          current.version,
          idem,
        ).expect(200)
      ).body;
    expect(result.order.state).toBe('REFUNDED');
    expect(result.settlement.allocations[0].units).toBe(o.deposit.units);
    await post('admin/cases/' + c.id + '/resolve', adminToken, body, current.version, idem).expect(
      200,
    );
    expect(await db.adminDecision.count({ where: { caseId: c.id } })).toBe(1);
    expect(await db.settlement.count({ where: { orderId: o.id } })).toBe(1);
  });
  it('turns an actual quarantined S3 upload clean through the outbox worker', async () => {
    const bytes = await sharp({
        create: { width: 2, height: 2, channels: 3, background: '#334455' },
      })
        .png()
        .toBuffer(),
      file = (
        await http()
          .post('/api/v1/files/uploads')
          .auth(buyer, { type: 'bearer' })
          .set('Idempotency-Key', key())
          .field('accessClass', 'ORDER_SHARED')
          .attach('file', bytes, { filename: 'worker.png', contentType: 'image/png' })
          .expect(202)
      ).body;
    const e = await db.outboxEvent.findUniqueOrThrow({
      where: { deduplicationKey: 'scan:' + file.id },
    });
    await app.get(OutboxWorker).process(e);
    expect((await db.fileAsset.findUniqueOrThrow({ where: { id: file.id } })).scanStatus).toBe(
      'CLEAN',
    );
    expect(
      (await db.outboxEvent.findUniqueOrThrow({ where: { id: e.id } })).publishedAt,
    ).not.toBeNull();
  });
});
