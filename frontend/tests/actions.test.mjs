import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const registry = JSON.parse(readFileSync(new URL('../src/lib/api/registry.json', import.meta.url)));
function fixture(id = 'account-b', roles = ['CUSTOMER'], fail = false) {
  let writes = 0,
    uploads = 0;
  class ApiFailure extends Error {
    constructor(status, code) {
      super(code);
      this.status = status;
      this.code = code;
    }
  }
  const exports = {};
  const source = ts.transpileModule(
    readFileSync(new URL('../src/lib/actions/market.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (name === 'next/cache') return { revalidatePath() {} };
      if (name === 'next/navigation')
        return {
          redirect() {
            throw Error('redirect');
          },
        };
      if (name === '../api/registry') return { operations: registry.operations };
      if (name === '../locale') return { localeOf: (v) => v };
      if (name === '../session')
        return {
          credentials: async () => ({ token: 'server-only-fictional-token' }),
          currentUser: async () => ({ id, roles }),
        };
      if (name === '../api/client')
        return {
          ApiFailure,
          command: async () => {
            writes++;
            if (fail) throw new ApiFailure(503, 'UNAVAILABLE');
            return { id };
          },
          uploadFile: async () => {
            uploads++;
            return { id: 'file' };
          },
        };
      throw Error(name);
    },
  });
  return { api: exports, writes: () => writes, uploads: () => uploads };
}
const key = '00000000-0000-4000-8000-000000000000';
test('stale web form cannot write to a different signed-in account', async () => {
  const f = fixture();
  const result = await f.api.mutate(
    'updateMe',
    {},
    { displayName: 'old account input' },
    key,
    undefined,
    'account-a',
  );
  assert.equal(result.code, 'SESSION_CHANGED');
  assert.equal(f.writes(), 0);
});
test('matching subject can mutate without returning its backend bearer credential', async () => {
  const f = fixture();
  const result = await f.api.mutate(
    'updateMe',
    {},
    { displayName: 'current input' },
    key,
    undefined,
    'account-b',
  );
  assert.equal(result.ok, true);
  assert.equal(f.writes(), 1);
  assert.equal(JSON.stringify(result).includes('server-only-fictional-token'), false);
});
test('stale upload context is rejected before storing a private file', async () => {
  const f = fixture();
  const result = await f.api.stageFile(new FormData(), key, 'account-a');
  assert.equal(result.code, 'SESSION_CHANGED');
  assert.equal(f.uploads(), 0);
});
test('server command errors retain status for safe retry decisions', async () => {
  const f = fixture('account-b', ['CUSTOMER'], true);
  const result = await f.api.mutate('updateMe', {}, {}, key, undefined, 'account-b');
  assert.equal(result.status, 503);
  assert.equal(result.code, 'UNAVAILABLE');
});
test('malformed command parameters are rejected without an exception or write', async () => {
  const f = fixture();
  const result = await f.api.mutate('updateMe', null, {}, key, undefined, 'account-b');
  assert.equal(result.code, 'INVALID_INPUT');
  assert.equal(f.writes(), 0);
});
