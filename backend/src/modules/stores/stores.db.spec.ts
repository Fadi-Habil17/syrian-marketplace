import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { AppModule } from '../../app.module';
import { configureApp } from '../../bootstrap';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ScheduledJobsService } from '../jobs/scheduled-jobs.service';
import { OrderLifecycle } from '../orders/order-lifecycle.service';
import { FilesService } from '../files/files.service';
const run =
  process.env.DATABASE_TEST_URL && process.env.STORAGE_ENDPOINT && process.env.CLAMAV_HOST
    ? describe
    : describe.skip;
run('Store and product publication with actual private image storage', () => {
  let app: INestApplication,
    db: PrismaService,
    token: string,
    other: string,
    city: string,
    store: string,
    product: string,
    photo: string,
    category: string;
  let buyerUserId: string;
  const http = () => request(app.getHttpServer()),
    key = () => randomUUID(),
    email = `shop-${randomUUID()}@demo.test`;
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_TEST_URL;
    process.env.JWT_ACCESS_SECRET ??= 'ci-access-secret-for-isolated-tests-only-123';
    process.env.JWT_REFRESH_SECRET ??= 'ci-refresh-secret-for-isolated-tests-only-456';
    const m = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(m.createNestApplication());
    await app.init();
    db = app.get(PrismaService);
    const u = (
      await http()
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'Marketplace123!',
          displayName: 'Fictional shop',
          locale: 'ar',
          businessRole: 'STORE_OWNER',
        })
        .expect(201)
    ).body;
    token = (
      await http()
        .post('/api/v1/auth/login')
        .send({ email, password: 'Marketplace123!', client: 'WEB' })
        .expect(200)
    ).body.accessToken;
    const buyerEmail = 'shop-buyer-' + key() + '@demo.test',
      buyer = (
        await http()
          .post('/api/v1/auth/register')
          .send({
            email: buyerEmail,
            password: 'Marketplace123!',
            displayName: 'Isolated store buyer',
            locale: 'en',
          })
          .expect(201)
      ).body;
    buyerUserId = buyer.id;
    other = (
      await http()
        .post('/api/v1/auth/login')
        .send({ email: buyerEmail, password: 'Marketplace123!', client: 'WEB' })
        .expect(200)
    ).body.accessToken;
    const admin = (
      await http()
        .post('/api/v1/auth/login')
        .send({ email: 'admin@demo.marketplace.test', password: 'Marketplace123!', client: 'WEB' })
        .expect(200)
    ).body.accessToken;
    await http()
      .post('/api/v1/admin/simulator/topups')
      .auth(admin, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({
        userId: buyer.id,
        amount: { currency: 'SYP', units: '1000000' },
        reason: 'Isolated store integration fixture',
      })
      .expect(200);
    city = (await db.city.findFirstOrThrow()).id;
    category = (await db.category.findFirstOrThrow({ where: { workspace: 'HOME_STORE' } })).id;
    await http()
      .post('/api/v1/business-profiles')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({
        type: 'STORE_OWNER',
        title: 'Shop owner',
        bio: 'Fictional store',
        cityId: city,
        skills: [],
        languages: [],
      })
      .expect(201);
    await http()
      .post('/api/v1/business-profiles/switch')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({ target: 'STORE_OWNER' })
      .expect(200);
    const bytes = await sharp({
      create: { width: 2, height: 2, channels: 3, background: '#fedcba' },
    })
      .png()
      .toBuffer();
    photo = (
      await http()
        .post('/api/v1/files/uploads')
        .auth(token, { type: 'bearer' })
        .set('Idempotency-Key', key())
        .field('accessClass', 'PUBLIC_CATALOG')
        .attach('file', bytes, { filename: 'shop.png', contentType: 'image/png' })
        .expect(202)
    ).body.id;
    await app.get(FilesService).scan(photo);
  }, 30000);
  afterAll(async () => {
    await app?.close();
  });
  it('creates a private draft store then publishes valid bilingual content', async () => {
    const r = await http()
      .post('/api/v1/stores')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({ cityId: city, supportsSellerDelivery: true, supportsPlatformDelivery: true })
      .expect(201);
    store = r.body.id;
    await http()
      .get('/api/v1/stores/' + store)
      .expect(404);
    await http()
      .post('/api/v1/stores/' + store + '/publish')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({ accepted: true })
      .expect(400);
    await http()
      .patch('/api/v1/stores/' + store)
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({
        nameAr: 'متجر تجريبي',
        nameEn: 'Fictional shop',
        descriptionAr: 'سلع منزلية',
        descriptionEn: 'Home goods',
        logoId: photo,
      })
      .expect(200);
    await http()
      .post('/api/v1/stores/' + store + '/publish')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({ accepted: true })
      .expect(200);
    await http()
      .get('/api/v1/files/' + photo + '/download')
      .expect(200);
  });
  it('creates and publishes a real priced product with stock', async () => {
    const r = await http()
      .post('/api/v1/products')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({
        categoryId: category,
        price: { currency: 'SYP', units: '10000' },
        stockOnHand: 12,
        titleAr: 'منتج',
        titleEn: 'Product',
        descriptionAr: 'وصف',
        descriptionEn: 'Description',
        photoIds: [photo],
      })
      .expect(201);
    product = r.body.id;
    expect(r.body.availableStock).toBe(12);
    await http()
      .post('/api/v1/products/' + product + '/publish')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({ accepted: true })
      .expect(200);
    await http()
      .get('/api/v1/products/' + product)
      .expect(200);
  });
  it('updates stock with ownership enforcement and an audit reason', async () => {
    const r = await http()
      .patch('/api/v1/products/' + product + '/stock')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({ stockOnHand: 7, reason: 'Inventory count' })
      .expect(200);
    expect(r.body.availableStock).toBe(7);
    await http()
      .patch('/api/v1/products/' + product + '/stock')
      .auth(other, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({ stockOnHand: 1, reason: 'Abuse' })
      .expect(404);
  });
  it('serves an authenticated management view without exposing drafts publicly', async () => {
    const r = await http()
      .get('/api/v1/products?mine=true')
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect(r.body.items.some((p: any) => p.id === product)).toBe(true);
    await http().get('/api/v1/products?mine=true').expect(401);
  });
  it('prices a store checkout on the server and atomically reserves full funds and stock', async () => {
    const profile = (await db.storefront.findUniqueOrThrow({ where: { id: store } })).profileId;
    await http()
      .post('/api/v1/business-profiles/' + profile + '/service-areas')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({ cityId: city })
      .expect(201);
    const address = (
      await http()
        .post('/api/v1/me/addresses')
        .auth(other, { type: 'bearer' })
        .set('Idempotency-Key', key())
        .send({
          cityId: city,
          label: 'Fictional buyer',
          details: 'Demo location',
          contactName: 'Demo',
          contactPhone: '+000000',
        })
        .expect(201)
    ).body;
    const options = (
      await http()
        .get('/api/v1/delivery-options')
        .query({ storeId: store, addressId: address.id, currency: 'SYP' })
        .auth(other, { type: 'bearer' })
        .expect(200)
    ).body;
    expect(options.methods.some((x: any) => x.method === 'SELLER')).toBe(true);
    const preview = (
      await http()
        .post('/api/v1/orders/store-preview')
        .auth(other, { type: 'bearer' })
        .set('Idempotency-Key', key())
        .send({
          storeId: store,
          addressId: address.id,
          method: 'SELLER',
          items: [{ productId: product, quantity: 2 }],
        })
        .expect(201)
    ).body;
    expect(preview.order.state).toBe('DRAFT');
    expect((await db.product.findUniqueOrThrow({ where: { id: product } })).stockReserved).toBe(0);
    const p = await http()
      .post('/api/v1/orders/store-checkout')
      .auth(other, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .set('If-Match', `"${preview.order.version}"`)
      .send({ draftOrderId: preview.order.id, termsAccepted: true })
      .expect(200);
    expect(p.body.order.state).toBe('PAID_IN_ESCROW');
    expect(p.body.payment.amount.units).toBe(preview.order.total.units);
    expect((await db.product.findUniqueOrThrow({ where: { id: product } })).stockReserved).toBe(2);
    let order = p.body.order;
    const command = async (route: string, who: string, body: any) => {
      const result = await http()
        .post('/api/v1/' + route)
        .auth(who, { type: 'bearer' })
        .set('Idempotency-Key', key())
        .set('If-Match', `"${order.version}"`)
        .send(body)
        .expect(200);
      order = (
        await http()
          .get('/api/v1/orders/' + order.id)
          .auth(other, { type: 'bearer' })
          .expect(200)
      ).body;
      return result.body;
    };
    await command('orders/' + order.id + '/accept-store', token, { accepted: true });
    await command('orders/' + order.id + '/ready-for-delivery', token, { accepted: true });
    const delivery = order.store.deliveryId;
    await command('deliveries/' + delivery + '/pickup', token, {
      notes: 'Seller collected packaged goods',
    });
    expect((await db.product.findUniqueOrThrow({ where: { id: product } })).stockOnHand).toBe(5);
    await command('deliveries/' + delivery + '/dropoff', token, {
      notes: 'Unproven handover needs explicit buyer confirmation',
    });
    expect(order.state).toBe('DELIVERED');
    expect(order.deliveryVerified).toBe(false);
    const completed = await command('orders/' + order.id + '/confirm', other, { accepted: true });
    expect(completed.order.state).toBe('COMPLETED');
    expect(completed.settlement.allocations.some((a: any) => a.kind === 'SELLER_DELIVERY')).toBe(
      true,
    );
  });
  it('shares only confirmed venues, filters coverage and returns to the public center on withdrawal', async () => {
    const profile = (await db.storefront.findUniqueOrThrow({ where: { id: store } })).profileId;
    const path = '/api/v1/business-profiles/' + profile + '/public-venue';
    const point = { latitude: 35.02, longitude: 37.06 };
    const save = (who: string, body: object) =>
      http().patch(path).auth(who, { type: 'bearer' }).set('Idempotency-Key', key()).send(body);
    const search = (body: object) =>
      http()
        .post('/api/v1/discovery/local/search')
        .send({ cityId: city, kind: 'STORE', limit: 100, ...body });
    await save(other, { point, confirmedPublic: true }).expect(404);
    await save(token, { point, confirmedPublic: false }).expect(400);
    await save(token, { point, confirmedPublic: true }).expect(200);
    const area = (await db.area.findFirstOrThrow({ where: { cityId: city } })).id;
    const page = await search({
      origin: { latitude: 35.02, longitude: 37.06 },
      areaId: area,
    }).expect(200);
    expect(page.body.items.find((r: any) => r.id === store)).toMatchObject({
      precision: 'PUBLIC_VENUE',
      point,
      detailId: store,
    });
    expect(page.headers['cache-control']).toContain('no-store');
    await search({ origin: { latitude: 35.023, longitude: 37.06 } }).expect(400);
    await search({ areaId: key() }).expect(400);
    const out = await save(token, { point: null, confirmedPublic: false }).expect(200);
    expect(out.body.point).toBeNull();
    const result = await search({}).expect(200);
    expect(result.body.items.find((r: any) => r.id === store)).toMatchObject({
      precision: 'APPROXIMATE',
      point: { latitude: 35.01127, longitude: 37.05324 },
    });
    const first = await search({ limit: 1 }).expect(200);
    if (first.body.nextCursor) {
      const second = await search({ limit: 1, cursor: first.body.nextCursor }).expect(200);
      expect(second.body.items[0].id).not.toEqual(first.body.items[0].id);
      await search({ areaId: area, cursor: first.body.nextCursor }).expect(400);
    }
  });
  it('allows one concurrent driver acceptance and revokes delivery access on reassignment and completion', async () => {
    const address = (
      await http()
        .post('/api/v1/me/addresses')
        .auth(other, { type: 'bearer' })
        .set('Idempotency-Key', key())
        .send({
          cityId: city,
          label: 'Driver test',
          pin: { latitude: 35, longitude: 37 },
          details: 'Fictional destination',
          contactName: 'Buyer',
          contactPhone: '+000000',
        })
        .expect(201)
    ).body;
    const login = async (email: string) =>
      (
        await http()
          .post('/api/v1/auth/login')
          .send({ email, password: 'Marketplace123!', client: 'ANDROID' })
          .expect(200)
      ).body.accessToken;
    const first = await login('delivery_driver@demo.marketplace.test'),
      email = 'driver-' + key() + '@demo.test',
      u = (
        await http()
          .post('/api/v1/auth/register')
          .send({
            email,
            password: 'Marketplace123!',
            displayName: 'Second fictional driver',
            locale: 'en',
            businessRole: 'DELIVERY_DRIVER',
          })
          .expect(201)
      ).body;
    const second = await login(email);
    let profile = (
      await http()
        .post('/api/v1/business-profiles')
        .auth(second, { type: 'bearer' })
        .set('Idempotency-Key', key())
        .send({
          type: 'DELIVERY_DRIVER',
          title: 'Fictional driver',
          bio: 'Test coverage',
          cityId: city,
          skills: [],
          languages: [],
        })
        .expect(201)
    ).body;
    await http()
      .post('/api/v1/business-profiles/switch')
      .auth(second, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({ target: 'DELIVERY_DRIVER' })
      .expect(200);
    await db.driverZone.create({
      data: {
        profileId: profile.id,
        governorateId: (await db.city.findUniqueOrThrow({ where: { id: city } })).governorateId,
        cityId: city,
      },
    });
    let o = (
      await http()
        .post('/api/v1/orders/store-preview')
        .auth(other, { type: 'bearer' })
        .set('Idempotency-Key', key())
        .send({
          storeId: store,
          addressId: address.id,
          method: 'PLATFORM_DRIVER',
          items: [{ productId: product, quantity: 1 }],
        })
        .expect(201)
    ).body.order;
    const post = async (route: string, who: string, body: any, status = 200) => {
      const result = await http()
        .post('/api/v1/' + route)
        .auth(who, { type: 'bearer' })
        .set('Idempotency-Key', key())
        .set('If-Match', `"${o.version}"`)
        .send(body)
        .expect(status);
      o = (
        await http()
          .get('/api/v1/orders/' + o.id)
          .auth(other, { type: 'bearer' })
          .expect(200)
      ).body;
      return result;
    };
    await post('orders/store-checkout', other, { draftOrderId: o.id, termsAccepted: true });
    await post('orders/' + o.id + '/accept-store', token, { accepted: true });
    await post('orders/' + o.id + '/ready-for-delivery', token, { accepted: true });
    await post('orders/' + o.id + '/delivery/request-driver', token, { accepted: true });
    const acceptKeys = [key(), key()];
    const acceptVersion = o.version;
    const delivery = o.store.deliveryId,
      results = await Promise.all(
        [first, second].map((who, index) =>
          http()
            .post('/api/v1/deliveries/' + delivery + '/accept')
            .auth(who, { type: 'bearer' })
            .set('Idempotency-Key', acceptKeys[index]!)
            .set('If-Match', `"${o.version}"`)
            .send({ accepted: true }),
        ),
      );
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    const winner = results[0]!.status === 200 ? first : second,
      successor = winner === first ? second : first;
    o = (
      await http()
        .get('/api/v1/orders/' + o.id)
        .auth(other, { type: 'bearer' })
        .expect(200)
    ).body;
    const bytes = await sharp({
      create: { width: 2, height: 2, channels: 3, background: '#102030' },
    })
      .png()
      .toBuffer();
    const proof = async (who: string) => {
      const f = (
        await http()
          .post('/api/v1/files/uploads')
          .auth(who, { type: 'bearer' })
          .set('Idempotency-Key', key())
          .field('accessClass', 'DELIVERY_ONLY')
          .field('orderId', o.id)
          .attach('file', bytes, { filename: 'proof.png', contentType: 'image/png' })
          .expect(202)
      ).body;
      await app.get(FilesService).scan(f.id);
      return f.id;
    };
    const assignedAddress = await http()
      .get('/api/v1/deliveries/' + delivery)
      .auth(winner, { type: 'bearer' })
      .expect(200);
    expect(assignedAddress.body.address.pin).toEqual({ latitude: 35, longitude: 37 });
    await http()
      .get('/api/v1/deliveries/' + delivery)
      .auth(successor, { type: 'bearer' })
      .expect(404);
    const oldProof = await proof(winner);
    await post('deliveries/' + delivery + '/release-assignment', winner, {
      reason: 'Before pickup reassignment',
    });
    const replay = await http()
      .post('/api/v1/deliveries/' + delivery + '/accept')
      .auth(winner, { type: 'bearer' })
      .set('Idempotency-Key', acceptKeys[winner === first ? 0 : 1]!)
      .set('If-Match', '"' + acceptVersion + '"')
      .send({ accepted: true })
      .expect(200);
    expect(replay.body.address).toBeNull();
    const released = await db.delivery.findUniqueOrThrow({ where: { id: delivery } });
    expect(
      await db.scheduledJob.count({
        where: {
          orderId: o.id,
          kind: 'DISPATCH_ESCALATION',
          dueAt: new Date(released.requestedAt!.getTime() + 2 * 3600000),
          status: 'READY',
        },
      }),
    ).toBe(1);
    await http()
      .get('/api/v1/files/' + oldProof + '/download')
      .auth(winner, { type: 'bearer' })
      .expect(404);
    await post('deliveries/' + delivery + '/accept', successor, { accepted: true });
    const newProof = await proof(successor);
    await post('deliveries/' + delivery + '/pickup', successor, {
      notes: 'Verified pickup',
      proofFileId: newProof,
    });
    await post('deliveries/' + delivery + '/dropoff', successor, {
      notes: 'Verified handover',
      proofFileId: newProof,
    });
    await http()
      .get('/api/v1/deliveries/' + delivery)
      .auth(successor, { type: 'bearer' })
      .expect(404);
    const settled = (await post('orders/' + o.id + '/confirm', other, { accepted: true })).body;
    expect(settled.settlement.allocations.some((a: any) => a.kind === 'DRIVER_PAYOUT')).toBe(true);
    expect(
      await db.driverAssignment.count({
        where: { deliveryId: delivery, status: { in: ['ASSIGNED', 'PICKED_UP'] } },
      }),
    ).toBe(0);
  });
  it('allows one verified buyer review and one immutable edit, with a database rating cache', async () => {
    const p = await db.storefront.findUniqueOrThrow({ where: { id: store } }),
      o = await db.marketOrder.findFirstOrThrow({
        where: {
          sellerProfileId: p.profileId,
          state: 'COMPLETED',
          buyerId: buyerUserId,
        },
      });
    const created = (
      await http()
        .post('/api/v1/orders/' + o.id + '/review')
        .auth(other, { type: 'bearer' })
        .set('Idempotency-Key', key())
        .send({ stars: 4, body: 'Fictional completed purchase' })
        .expect(201)
    ).body;
    expect(created.verified).toBe(true);
    await http()
      .post('/api/v1/orders/' + o.id + '/review')
      .auth(token, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({ stars: 5 })
      .expect(403);
    await http()
      .patch('/api/v1/reviews/' + created.id)
      .auth(other, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({ stars: 5, body: 'Once edited' })
      .expect(200);
    await http()
      .patch('/api/v1/reviews/' + created.id)
      .auth(other, { type: 'bearer' })
      .set('Idempotency-Key', key())
      .send({ stars: 1 })
      .expect(409);
    expect(await db.reviewVersion.count({ where: { reviewId: created.id } })).toBe(2);
    const cached = await db.businessProfile.findUniqueOrThrow({ where: { id: p.profileId } });
    expect(cached.ratingAverage).toBe(5);
    expect(cached.reviewCount).toBe(1);
  });
  async function paidStore(accept = true) {
    const address = await db.address.findFirstOrThrow({
      where: { userId: buyerUserId, archivedAt: null, cityId: city },
    });
    let order = (
      await http()
        .post('/api/v1/orders/store-preview')
        .auth(other, { type: 'bearer' })
        .set('Idempotency-Key', key())
        .send({
          storeId: store,
          addressId: address.id,
          method: 'SELLER',
          items: [{ productId: product, quantity: 1 }],
        })
        .expect(201)
    ).body.order;
    const command = async (route: string, who: string, body: any, status = 200) => {
      const result = await http()
        .post('/api/v1/' + route)
        .auth(who, { type: 'bearer' })
        .set('Idempotency-Key', key())
        .set('If-Match', `"${order.version}"`)
        .send(body)
        .expect(status);
      order = (
        await http()
          .get('/api/v1/orders/' + order.id)
          .auth(other, { type: 'bearer' })
          .expect(200)
      ).body;
      return result.body;
    };
    await command('orders/store-checkout', other, { draftOrderId: order.id, termsAccepted: true });
    if (accept) await command('orders/' + order.id + '/accept-store', token, { accepted: true });
    return { read: () => order, command };
  }
  it('holds and refunds only approved delivery-fee deltas, preserving the first commission snapshot', async () => {
    const admin = (
        await http()
          .post('/api/v1/auth/login')
          .send({
            email: 'admin@demo.marketplace.test',
            password: 'Marketplace123!',
            client: 'WEB',
          })
          .expect(200)
      ).body.accessToken,
      flow = await paidStore(),
      id = flow.read().id,
      delivery = flow.read().store.deliveryId;
    const original = (await db.delivery.findUniqueOrThrow({ where: { id: delivery } })).feeUnits;
    const configure = async (units: bigint) =>
      http()
        .post('/api/v1/admin/delivery-rates')
        .auth(admin, { type: 'bearer' })
        .set('Idempotency-Key', key())
        .send({ cityId: city, method: 'SELLER', currency: 'SYP', feeUnits: units.toString() })
        .expect(200);
    try {
      for (const fee of [original + 1000n, original - 1000n]) {
        await configure(fee);
        const proposed = await flow.command(
          'deliveries/' + delivery + '/terms',
          token,
          {
            method: 'SELLER',
            promisedAt: new Date(Date.now() + 3 * 86400000).toISOString(),
            reason: 'Explicit changed delivery fee',
          },
          201,
        );
        expect(proposed.fee.units).toBe(fee.toString());
        await flow.command('deliveries/' + delivery + '/terms/' + proposed.id + '/approve', other, {
          accepted: true,
        });
        expect(flow.read().held.units).toBe(flow.read().total.units);
        expect(flow.read().commissionBpsSnapshot).toBe(0);
      }
      expect(
        await db.paymentAttempt.count({
          where: { orderId: id, installment: 'DELIVERY_ADJUSTMENT', status: 'SUCCEEDED' },
        }),
      ).toBe(1);
      expect(
        await db.ledgerJournal.count({
          where: { orderId: id, kind: 'DELIVERY_ADJUSTMENT_REFUND' },
        }),
      ).toBe(1);
      await flow.command('orders/' + id + '/cancel', token, {
        reason: 'Seller cannot fulfill; full adjusted hold refund',
      });
      expect(flow.read().state).toBe('REFUNDED');
    } finally {
      await configure(original);
    }
  });
  it('reconciles reusable collected goods exactly once with an immutable mutual cancellation plan', async () => {
    const flow = await paidStore(),
      id = flow.read().id;
    await flow.command('orders/' + id + '/ready-for-delivery', token, { accepted: true });
    await flow.command('deliveries/' + flow.read().store.deliveryId + '/pickup', token, {
      notes: 'Goods collected before cancellation',
    });
    const before = (await db.product.findUniqueOrThrow({ where: { id: product } })).stockOnHand,
      returns = [
        {
          reservationId: flow.read().store.items[0].reservationId,
          reusableQuantity: 1,
          nonRestockableQuantity: 0,
          reason: 'Unopened reusable goods returned',
        },
      ],
      result = await flow.command('orders/' + id + '/cancel', other, {
        reason: 'Mutual cancellation after collection',
        proposal: {
          kind: 'CANCELLATION_SPLIT',
          reason: 'Both parties agree returned goods and work',
          sellerAwardUnits: '100',
          inventoryReturns: returns,
        },
      });
    const proposals = (
      await http()
        .get('/api/v1/cases/' + result.caseId + '/proposals')
        .auth(token, { type: 'bearer' })
        .expect(200)
    ).body.items;
    await flow.command(
      'cases/' + result.caseId + '/proposals/' + proposals[0].id + '/accept',
      token,
      { accepted: true },
    );
    expect(flow.read().state).toBe('CANCELLED');
    expect((await db.product.findUniqueOrThrow({ where: { id: product } })).stockOnHand).toBe(
      before + 1,
    );
    expect(
      await db.stockReconciliation.count({ where: { reservationId: returns[0]!.reservationId } }),
    ).toBe(1);
  });
  async function expiredReview(verified: boolean, runWorker = true) {
    const flow = await paidStore(),
      id = flow.read().id;
    await flow.command('orders/' + id + '/ready-for-delivery', token, { accepted: true });
    const delivery = flow.read().store.deliveryId;
    await flow.command('deliveries/' + delivery + '/pickup', token, { notes: 'Collected goods' });
    let proof: string | undefined;
    if (verified) {
      const bytes = await sharp({
        create: { width: 2, height: 2, channels: 3, background: '#009977' },
      })
        .png()
        .toBuffer();
      proof = (
        await http()
          .post('/api/v1/files/uploads')
          .auth(token, { type: 'bearer' })
          .set('Idempotency-Key', key())
          .field('accessClass', 'DELIVERY_ONLY')
          .field('orderId', id)
          .attach('file', bytes, { filename: 'handover.png', contentType: 'image/png' })
          .expect(202)
      ).body.id;
      await app.get(FilesService).scan(proof!);
    }
    await flow.command('deliveries/' + delivery + '/dropoff', token, {
      notes: 'Physical handover fixture',
      ...(proof ? { proofFileId: proof } : {}),
    });
    const deadline = new Date(Date.now() - 1000);
    await db.atomic(async (tx) => {
      const o = await tx.marketOrder.update({
        where: { id },
        data: {
          deliveredAt: new Date(deadline.getTime() - 72 * 3600000),
          reviewDeadlineAt: deadline,
        },
      });
      await app
        .get(OrderLifecycle)
        .deadlines.schedule(tx, id, 'DELIVERY_REVIEW', deadline, o.deliveryVersion);
    });
    if (runWorker) await app.get(ScheduledJobsService).tick(200);
    return id;
  }
  it('routes an expired unproven physical handover to admin review without releasing held funds', async () => {
    const id = await expiredReview(false),
      o = await db.marketOrder.findUniqueOrThrow({
        where: { id },
        include: { escrow_order: true },
      });
    expect(o.state).toBe('DELIVERY_REVIEW_REQUIRED');
    expect(o.escrow_order!.status).toBe('FROZEN');
    expect(await db.settlement.count({ where: { orderId: id } })).toBe(0);
    expect(await db.caseRecord.count({ where: { orderId: id, kind: 'DELIVERY_REVIEW' } })).toBe(1);
  });
  it('settles verified delivery once through the actual expired-review worker', async () => {
    const id = await expiredReview(true);
    expect((await db.marketOrder.findUniqueOrThrow({ where: { id } })).state).toBe('COMPLETED');
    expect((await db.settlement.findUniqueOrThrow({ where: { orderId: id } })).mode).toBe(
      'AUTO_COMPLETION',
    );
    await app.get(ScheduledJobsService).tick(200);
    expect(await db.settlement.count({ where: { orderId: id } })).toBe(1);
  });
  it('serializes a buyer dispute against two actual auto-completion worker ticks', async () => {
    const id = await expiredReview(true, false);
    const order = await db.marketOrder.findUniqueOrThrow({ where: { id } });
    const results = await Promise.allSettled([
      http()
        .post('/api/v1/orders/' + id + '/cases')
        .auth(other, { type: 'bearer' })
        .set('Idempotency-Key', key())
        .set('If-Match', '"' + order.version + '"')
        .send({ kind: 'DISPUTE', reason: 'Buyer disputes handover while auto-completion is due' }),
      app.get(ScheduledJobsService).tick(200),
      app.get(ScheduledJobsService).tick(200),
    ]);
    for (const result of results) expect(result.status).toBe('fulfilled');
    const response = (results[0] as PromiseFulfilledResult<request.Response>).value;
    expect([201, 409, 422]).toContain(response.status);
    const cases = await db.caseRecord.count({ where: { orderId: id, kind: 'DISPUTE' } });
    const settlements = await db.settlement.count({ where: { orderId: id } });
    expect(cases + settlements).toBe(1);
    if (response.status === 201) {
      expect(settlements).toBe(0);
      expect((await db.escrow.findUniqueOrThrow({ where: { orderId: id } })).status).toBe('FROZEN');
    } else expect(settlements).toBe(1);
    await app.get(ScheduledJobsService).tick(200);
    expect(await db.settlement.count({ where: { orderId: id } })).toBe(settlements);
  });
  it('refunds items and delivery and releases stock once after the actual 24h acceptance worker', async () => {
    const before = await db.product.findUniqueOrThrow({ where: { id: product } });
    const flow = await paidStore(false),
      id = flow.read().id;
    const deadline = new Date(Date.now() - 1000);
    await db.atomic(async (tx) => {
      await tx.storeOrder.update({
        where: { orderId: id },
        data: { sellerAcceptanceDeadlineAt: deadline },
      });
      await app
        .get(OrderLifecycle)
        .deadlines.schedule(tx, id, 'STORE_ACCEPTANCE_EXPIRY', deadline, flow.read().version);
    });
    await app.get(ScheduledJobsService).tick(200);
    await app.get(ScheduledJobsService).tick(200);
    const settlement = await db.settlement.findUniqueOrThrow({
      where: { orderId: id },
      include: { allocation_settlement: true },
    });
    expect(settlement.mode).toBe('STORE_TIMEOUT');
    expect(settlement.allocation_settlement).toHaveLength(1);
    expect(settlement.allocation_settlement[0]!.kind).toBe('BUYER_REFUND');
    expect(settlement.allocation_settlement[0]!.units.toString()).toBe(flow.read().total.units);
    const after = await db.product.findUniqueOrThrow({ where: { id: product } });
    expect(after.stockReserved).toBe(before.stockReserved);
    expect(after.stockOnHand).toBe(before.stockOnHand);
  });
});
