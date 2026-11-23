const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
function fixture() {
  const handlers = {};
  let refreshes = 0,
    connects = 0,
    resolveRefresh;
  const socket = {
    on: (name, handler) => {
      handlers[name] = handler;
    },
    connect: () => {
      connects++;
    },
    disconnect() {},
    removeAllListeners() {},
    emit() {},
  };
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('mobile/src/realtime.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    {
      exports,
      require(name) {
        if (name === 'socket.io-client') return { io: () => socket };
        if (name === './api/client')
          return {
            getAccessToken: () => 'fictional',
            restoreSession: () => {
              refreshes++;
              return new Promise((resolve) => {
                resolveRefresh = resolve;
              });
            },
          };
        if (name === './api/config')
          return { apiConfig: { socketUrl: 'https://api.example.test/orders' } };
        throw Error(name);
      },
    },
  );
  return {
    start: () => exports.watchOrder('fictional-order', () => {}),
    handlers,
    refreshes: () => refreshes,
    connects: () => connects,
    resolve: () => resolveRefresh({ accessToken: 'rotated' }),
  };
}
test('socket transport outages do not rotate refresh credentials', () => {
  const f = fixture();
  f.start();
  f.handlers.connect_error(new Error('websocket error'));
  assert.equal(f.refreshes(), 0);
});
test('persistent socket authentication rejection refreshes at most once until connection succeeds', async () => {
  const f = fixture();
  f.start();
  f.handlers.connect_error(new Error('AUTH_REQUIRED'));
  f.handlers.connect_error(new Error('AUTH_REQUIRED'));
  assert.equal(f.refreshes(), 1);
  f.resolve();
  await new Promise(setImmediate);
  f.handlers.connect_error(new Error('AUTH_REQUIRED'));
  assert.equal(f.refreshes(), 1);
});
test('disposing a socket while refresh is pending prevents reconnecting', async () => {
  const f = fixture();
  const stop = f.start();
  f.handlers.connect_error(new Error('AUTH_REQUIRED'));
  stop();
  f.resolve();
  await new Promise(setImmediate);
  assert.equal(f.connects(), 1);
});
