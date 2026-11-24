const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('mobile/src/foreground-location.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function fixture(granted, position) {
  const calls = [],
    exports = {};
  let timeout;
  vm.runInNewContext(source, {
    exports,
    require(name) {
      assert.equal(name, 'expo-location');
      return {
        Accuracy: { Balanced: 3 },
        async requestForegroundPermissionsAsync() {
          calls.push('permission');
          return { granted };
        },
        getCurrentPositionAsync({ accuracy }) {
          assert.equal(accuracy, 3);
          calls.push('read');
          return position;
        },
      };
    },
    setTimeout(fn, delay) {
      assert.equal(delay, 10000);
      timeout = fn;
      return 1;
    },
    clearTimeout() {
      timeout = undefined;
    },
  });
  return {
    locate: exports.locate,
    calls,
    expire: () => timeout(),
    hasTimer: () => Boolean(timeout),
  };
}
test('denying foreground permission leaves the device location unread', async () => {
  const f = fixture(false);
  assert.deepEqual(f.calls, []);
  await assert.rejects(f.locate(), /unavailable/);
  assert.deepEqual(f.calls, ['permission']);
});
test('one foreground fix returns only latitude and longitude', async () => {
  const f = fixture(
    true,
    Promise.resolve({ coords: { latitude: 35, longitude: 37, altitude: 700 } }),
  );
  assert.deepEqual({ ...(await f.locate()) }, { latitude: 35, longitude: 37 });
  assert.deepEqual(f.calls, ['permission', 'read']);
  assert.equal(f.hasTimer(), false);
});
test('a delayed fix times out once and leaves manual placement available', async () => {
  const f = fixture(true, new Promise(() => {}));
  const pending = f.locate();
  await new Promise((resolve) => setImmediate(resolve));
  f.expire();
  await assert.rejects(pending, /timeout/);
  assert.equal(f.hasTimer(), false);
  assert.deepEqual(f.calls, ['permission', 'read']);
});
