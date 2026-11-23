const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function fixture(fetch) {
  const storage = new Map();
  let options;
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync('mobile/src/api/client.ts', 'utf8'), {
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
    Promise,
    Error,
    JSON,
    require(name) {
      if (name === 'openapi-fetch')
        return {
          __esModule: true,
          default: (value) => {
            options = value;
            return { use() {} };
          },
        };
      if (name === 'expo-secure-store')
        return {
          setItemAsync: async (k, v) => storage.set(k, v),
          getItemAsync: async (k) => storage.get(k) ?? null,
          deleteItemAsync: async (k) => storage.delete(k),
        };
      if (name === './config') return { apiConfig: { baseUrl: 'https://api.example.test/api/v1' } };
      throw new Error(name);
    },
  });
  return { api: exports, storage, transport: () => options.fetch };
}
const pair = {
  accessToken: 'fictional-access',
  refreshToken: 'fictional-refresh',
  user: { id: 'fictional-user' },
};
test('only refresh credential is persisted', async () => {
  const f = fixture();
  await f.api.saveSession(pair);
  assert.deepEqual([...f.storage.values()], ['fictional-refresh']);
  assert.equal(f.api.getAccessToken(), 'fictional-access');
  await f.api.clearSession();
  assert.equal(f.storage.size, 0);
  assert.equal(f.api.getAccessToken(), null);
});
test('concurrent refresh requests rotate once', async () => {
  let calls = 0;
  const f = fixture(async () => {
    calls++;
    await new Promise((resolve) => setImmediate(resolve));
    return { ok: true, json: async () => ({ ...pair, refreshToken: 'rotated' }) };
  });
  await f.api.saveSession(pair);
  const results = await Promise.all([
    f.api.restoreSession(),
    f.api.restoreSession(),
    f.api.restoreSession(),
  ]);
  assert.equal(calls, 1);
  assert.equal(results.length, 3);
  assert.equal(await f.api.getRefreshToken(), 'rotated');
});
test('revoked refresh clears local credentials and announces expiration', async () => {
  const f = fixture(async () => ({ ok: false, status: 401 }));
  let expired = 0;
  await f.api.saveSession(pair);
  f.api.setExpiredHandler(() => expired++);
  assert.equal(await f.api.restoreSession(), null);
  assert.equal(f.storage.size, 0);
  assert.equal(expired, 1);
});
test('transient refresh failure preserves stored credential', async () => {
  const f = fixture(async () => ({ ok: false, status: 503 }));
  await f.api.saveSession(pair);
  await assert.rejects(f.api.restoreSession());
  assert.equal(await f.api.getRefreshToken(), 'fictional-refresh');
});
test('401 retry preserves mutation body and idempotency/version headers', async () => {
  const seen = [];
  const f = fixture(async (request) => {
    if (typeof request === 'string')
      return { ok: true, json: async () => ({ ...pair, accessToken: 'new-access' }) };
    seen.push({
      body: await request.text(),
      key: request.headers.get('Idempotency-Key'),
      version: request.headers.get('If-Match'),
      auth: request.headers.get('Authorization'),
    });
    return { status: seen.length === 1 ? 401 : 200 };
  });
  await f.api.saveSession(pair);
  const response = await f.transport()(
    new Request('https://api.example.test/api/v1/orders/fictional/payments/deposit', {
      method: 'POST',
      headers: {
        'Idempotency-Key': 'fictional-intent',
        'If-Match': '"7"',
        Authorization: 'Bearer fictional-access',
      },
      body: '{"termsAccepted":true}',
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(seen.length, 2);
  assert.equal(seen[0].body, seen[1].body);
  assert.equal(seen[1].key, 'fictional-intent');
  assert.equal(seen[1].version, '"7"');
  assert.equal(seen[1].auth, 'Bearer new-access');
});

test('logout cancels an in-flight refresh without restoring credentials', async () => {
  let respond, started;
  const begin = new Promise((resolve) => {
    started = resolve;
  });
  const f = fixture(() => {
    started();
    return new Promise((resolve) => {
      respond = resolve;
    });
  });
  await f.api.saveSession(pair);
  const pending = f.api.restoreSession();
  await begin;
  await f.api.clearSession();
  respond({ ok: true, json: async () => ({ ...pair, refreshToken: 'late-refresh' }) });
  assert.equal(await pending, null);
  assert.equal(f.api.getAccessToken(), null);
  assert.equal(f.storage.size, 0);
});

test('an old refresh rejection cannot erase a newly signed-in account', async () => {
  let respond, started;
  const begin = new Promise((resolve) => {
    started = resolve;
  });
  const f = fixture(() => {
    started();
    return new Promise((resolve) => {
      respond = resolve;
    });
  });
  await f.api.saveSession(pair);
  const pending = f.api.restoreSession();
  await begin;
  await f.api.saveSession({ ...pair, accessToken: 'other-access', refreshToken: 'other-refresh' });
  respond({ ok: false, status: 401 });
  assert.equal(await pending, null);
  assert.equal(f.api.getAccessToken(), 'other-access');
  assert.equal(await f.api.getRefreshToken(), 'other-refresh');
});

test('a previous account mutation is never retried with another account credential', async () => {
  let respond,
    calls = 0;
  const f = fixture(() => {
    calls++;
    return new Promise((resolve) => {
      respond = resolve;
    });
  });
  await f.api.saveSession(pair);
  const pending = f.transport()(
    new Request('https://api.example.test/api/v1/me', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer fictional-access' },
      body: '{}',
    }),
  );
  await f.api.saveSession({ ...pair, accessToken: 'other-access', refreshToken: 'other-refresh' });
  respond({ status: 401 });
  await assert.rejects(pending, /Session changed/);
  assert.equal(calls, 1);
});

test('late 401 uses the already rotated access token without rotating again', async () => {
  let respond,
    calls = 0,
    refreshes = 0;
  const f = fixture(async (request) => {
    if (typeof request === 'string') {
      refreshes++;
      return { ok: true, json: async () => ({ ...pair, accessToken: 'rotated-access' }) };
    }
    calls++;
    if (calls === 1)
      return new Promise((resolve) => {
        respond = resolve;
      });
    assert.equal(request.headers.get('Authorization'), 'Bearer rotated-access');
    return { status: 200 };
  });
  await f.api.saveSession(pair);
  const pending = f.transport()(
    new Request('https://api.example.test/api/v1/wallets', {
      headers: { Authorization: 'Bearer fictional-access' },
    }),
  );
  await f.api.restoreSession();
  respond({ status: 401 });
  assert.equal((await pending).status, 200);
  assert.equal(refreshes, 1);
});

test('only definitive rejection permits a fresh financial intent', () => {
  const f = fixture();
  const error = (status, code) => new f.api.ApiError(status, code, code);
  assert.equal(f.api.isDefinitiveFailure(error(422, 'INSUFFICIENT_FUNDS')), true);
  for (const [status, code] of [
    [503, 'UNAVAILABLE'],
    [408, 'TIMEOUT'],
    [429, 'RATE_LIMITED'],
    [401, 'AUTH_REQUIRED'],
    [409, 'REQUEST_IN_PROGRESS'],
    [409, 'IDEMPOTENCY_CONFLICT'],
  ])
    assert.equal(f.api.isDefinitiveFailure(error(status, code)), false);
  assert.equal(f.api.isDefinitiveFailure(new Error('Network unavailable')), false);
});

test('protected auth/me refreshes an expired access token', async () => {
  let calls = 0;
  const f = fixture(async (request) => {
    if (typeof request === 'string')
      return { ok: true, json: async () => ({ ...pair, accessToken: 'rotated-access' }) };
    return { status: ++calls === 1 ? 401 : 200 };
  });
  await f.api.saveSession(pair);
  const result = await f.transport()(
    new Request('https://api.example.test/api/v1/auth/me', {
      headers: { Authorization: 'Bearer fictional-access' },
    }),
  );
  assert.equal(result.status, 200);
  assert.equal(calls, 2);
});
