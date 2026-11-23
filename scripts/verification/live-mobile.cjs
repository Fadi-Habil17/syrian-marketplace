const fs = require('node:fs'),
  vm = require('node:vm'),
  ts = require('typescript'),
  assert = require('node:assert/strict');
const { createRequire } = require('node:module'),
  { resolve } = require('node:path'),
  { spawn } = require('node:child_process'),
  { randomUUID, createHash } = require('node:crypto');
require('node:process').loadEnvFile(
  process.argv[2] ||
    (() => {
      throw Error('Explicit isolated env file required');
    })(),
);
if (!new URL(process.env.DATABASE_TEST_URL).pathname.includes('test'))
  throw Error('Isolated test database required');
const port = '14273',
  storage = new Map(),
  nativeRequire = createRequire(resolve('mobile/src/api/client.ts'));
function moduleAt(file) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  vm.runInNewContext(source, {
    exports,
    fetch,
    Request,
    Response,
    require(name) {
      if (name === 'expo-secure-store')
        return {
          getItemAsync: async (k) => storage.get(k) ?? null,
          setItemAsync: async (k, v) => storage.set(k, v),
          deleteItemAsync: async (k) => storage.delete(k),
        };
      if (name === 'expo-crypto') return { randomUUID };
      if (name === './config') return { apiConfig: { baseUrl: `http://127.0.0.1:${port}/api/v1` } };
      return nativeRequire(name);
    },
  });
  return exports;
}
const demoId = (key) => {
  const h = createHash('sha256')
    .update('syrian-marketplace:demo:' + key)
    .digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
let logs = '';
const child = spawn(process.execPath, ['dist/main.js'], {
  cwd: 'backend',
  env: { ...process.env, PORT: port, DATABASE_URL: process.env.DATABASE_TEST_URL },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});
for (const s of [child.stdout, child.stderr])
  s.on('data', (b) => (logs = (logs + b).slice(-100000)));
(async () => {
  let client, orderId;
  try {
    let ready = false;
    for (let n = 0; n < 100; n++) {
      try {
        if ((await fetch(`http://127.0.0.1:${port}/api/v1/health`)).ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }
    assert(ready, 'Compiled API readiness');
    client = moduleAt('mobile/src/api/client.ts');
    const { api, unwrap } = client;
    const pair = unwrap(
      await api.POST('/api/v1/auth/login', {
        body: {
          email: 'customer@demo.marketplace.test',
          password: 'Marketplace123!',
          client: 'ANDROID',
        },
      }),
    );
    await client.saveSession(pair);
    const before = unwrap(await api.GET('/api/v1/wallets'));
    assert.deepEqual([...before.items.map((w) => w.currency)].sort(), ['SYP', 'USD']);
    await client.saveSession({ ...pair, accessToken: 'intentionally-expired-review-access' });
    const me = unwrap(await api.GET('/api/v1/auth/me'));
    assert.equal(me.id, pair.user.id);
    assert.notEqual(client.getAccessToken(), 'intentionally-expired-review-access');
    console.log('LIVE_MOBILE_LOGIN_REFRESH_AUTH_ME_WALLETS passed');
    const queries = moduleAt('mobile/src/catalog-query.ts');
    const filtered = unwrap(
      await api.GET('/api/v1/listings', {
        params: { query: queries.listingQuery('PROFESSIONAL', '') },
      }),
    );
    assert(filtered.items.every((item) => item.kind === 'PROFESSIONAL_PACKAGE'));
    const absent = unwrap(
      await api.GET('/api/v1/products', {
        params: { query: queries.productQuery('no-match-mobile-review-' + randomUUID()) },
      }),
    );
    assert.equal(absent.items.length, 0);
    console.log('LIVE_MOBILE_CATALOG_WORKSPACE_SEARCH passed');
    const preview = unwrap(
      await api.POST('/api/v1/orders/store-preview', {
        params: { header: { 'Idempotency-Key': randomUUID() } },
        body: {
          storeId: demoId('store'),
          addressId: demoId('buyer-address'),
          method: 'SELLER',
          items: [{ productId: demoId('product:SYP'), quantity: 1 }],
        },
      }),
    );
    orderId = preview.order.id;
    const intents = moduleAt('mobile/src/checkout-intent.ts');
    const original = await intents.beginCheckout(pair.user.id, orderId, preview.order.version);
    const checkout = async (i) =>
      unwrap(
        await api.POST('/api/v1/orders/store-checkout', {
          params: { header: { 'Idempotency-Key': i.key, 'If-Match': `"${i.version}"` } },
          body: { draftOrderId: i.draftOrderId, termsAccepted: true },
        }),
      );
    const first = await checkout(original);
    const restarted = moduleAt('mobile/src/checkout-intent.ts');
    const restored = await restarted.readCheckoutIntent(pair.user.id);
    assert.equal(restored.key, original.key);
    const replay = await checkout(restored);
    assert.equal(replay.order.id, first.order.id);
    assert.equal(replay.order.held.units, first.order.held.units);
    const payments = unwrap(
      await api.GET('/api/v1/orders/{orderId}/payments', { params: { path: { orderId } } }),
    );
    assert.equal(payments.items.filter((p) => p.status === 'SUCCEEDED').length, 1);
    await restarted.finishCheckout(restored);
    assert.equal(await restarted.readCheckoutIntent(pair.user.id), null);
    const latest = unwrap(
      await api.GET('/api/v1/orders/{orderId}', { params: { path: { orderId } } }),
    );
    unwrap(
      await api.POST('/api/v1/orders/{orderId}/cancel', {
        params: {
          path: { orderId },
          header: { 'Idempotency-Key': randomUUID(), 'If-Match': `"${latest.version}"` },
        },
        body: { reason: 'Isolated mobile merge review: preaccept cancellation and full refund' },
      }),
    );
    const after = unwrap(await api.GET('/api/v1/wallets'));
    for (const wallet of before.items)
      assert.equal(
        after.items.find((w) => w.currency === wallet.currency).availableUnits,
        wallet.availableUnits,
      );
    console.log('LIVE_MOBILE_CHECKOUT_RESTART_REPLAY_SINGLE_HOLD_FULL_REFUND passed');
    unwrap(
      await api.POST('/api/v1/auth/logout', {
        body: { refreshToken: await client.getRefreshToken() },
      }),
    );
    await client.clearSession();
    const denied = await api.GET('/api/v1/wallets');
    assert.equal(denied.response.status, 401);
    console.log('LIVE_MOBILE_LOGOUT_AUTHORIZATION passed');
  } catch (e) {
    console.error(
      'Live mobile review failed:',
      e.code ?? e.message,
      'review fixture order:',
      orderId ?? 'none',
    );
    process.exitCode = 1;
  } finally {
    if (client) await client.clearSession().catch(() => {});
    child.kill();
  }
})();
