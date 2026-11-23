const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function fixture(storage = new Map(), rejectWrite = false) {
  let generated = 0;
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('mobile/src/checkout-intent.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    {
      exports,
      require(name) {
        if (name === 'expo-crypto') return { randomUUID: () => `intent-${++generated}` };
        if (name === 'expo-secure-store')
          return {
            getItemAsync: async (key) => storage.get(key) ?? null,
            setItemAsync: async (key, value) => {
              if (rejectWrite) throw Error('storage unavailable');
              storage.set(key, value);
            },
            deleteItemAsync: async (key) => storage.delete(key),
          };
        throw Error(name);
      },
    },
  );
  return { api: exports, storage };
}
test('checkout survives process restart with its original key, draft and version', async () => {
  const f = fixture();
  const original = await f.api.beginCheckout('buyer-a', 'draft-a', 3);
  const restarted = fixture(f.storage);
  const retry = await restarted.api.beginCheckout('buyer-a', 'draft-a', 99);
  assert.equal(JSON.stringify(retry), JSON.stringify(original));
  assert.equal(retry.version, 3);
  assert.equal(Object.keys(retry).sort().join(','), 'draftOrderId,key,userId,version');
});
test('an unresolved checkout blocks a second draft and stays isolated by account', async () => {
  const f = fixture();
  await f.api.beginCheckout('buyer-a', 'draft-a', 3);
  await assert.rejects(f.api.beginCheckout('buyer-a', 'draft-b', 1), /pending payment/);
  assert.equal(await f.api.readCheckoutIntent('buyer-b'), null);
  await f.api.beginCheckout('buyer-b', 'draft-b', 1);
  assert.equal(f.storage.size, 2);
});
test('concurrent checkout attempts reuse one durable key', async () => {
  const f = fixture();
  const intents = await Promise.all([
    f.api.beginCheckout('buyer-a', 'draft-a', 3),
    f.api.beginCheckout('buyer-a', 'draft-a', 3),
  ]);
  assert.equal(intents[0].key, intents[1].key);
});
test('only the resolved matching intent is cleared', async () => {
  const f = fixture();
  const intent = await f.api.beginCheckout('buyer-a', 'draft-a', 3);
  await f.api.finishCheckout({ ...intent, key: 'unrelated' });
  assert.notEqual(await f.api.readCheckoutIntent('buyer-a'), null);
  await f.api.finishCheckout(intent);
  assert.equal(await f.api.readCheckoutIntent('buyer-a'), null);
});
test('storage failure prevents issuing a non-durable payment identity', async () => {
  const f = fixture(new Map(), true);
  await assert.rejects(f.api.beginCheckout('buyer-a', 'draft-a', 3), /storage unavailable/);
  assert.equal(f.storage.size, 0);
});
