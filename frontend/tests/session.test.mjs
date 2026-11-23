import test from 'node:test';
import assert from 'node:assert/strict';
import { createRefreshCoordinator } from '../src/lib/refresh-coordinator.ts';
import { uncertainOutcome } from '../src/lib/command-outcome.ts';

test('parallel and delayed web refreshes reuse one rotation for the same credential', async () => {
  let calls = 0,
    at = 0,
    resolve;
  const rotate = createRefreshCoordinator(
    () => {
      calls++;
      return new Promise((done) => {
        resolve = done;
      });
    },
    () => at,
    5000,
  );
  const one = rotate('fictional-old-refresh'),
    two = rotate('fictional-old-refresh');
  assert.equal(one, two);
  await Promise.resolve();
  assert.equal(calls, 1);
  resolve({ accessToken: 'fictional-access', refreshToken: 'fictional-rotated' });
  assert.deepEqual(await one, await two);
  at = 4000;
  await rotate('fictional-old-refresh');
  assert.equal(calls, 1);
});
test('web refresh failure is not cached and a later retry can reach the backend', async () => {
  let calls = 0;
  const rotate = createRefreshCoordinator(async () => {
    if (++calls === 1) throw Error('temporary failure');
    return 'rotated';
  });
  await assert.rejects(rotate('fictional-refresh'), /temporary failure/);
  assert.equal(await rotate('fictional-refresh'), 'rotated');
  assert.equal(calls, 2);
});
test('different refresh credentials do not share a result and expired grace entries are replaced', async () => {
  let calls = 0,
    at = 0;
  const rotate = createRefreshCoordinator(
    async (token) => `${token}:${++calls}`,
    () => at,
    5000,
  );
  assert.equal(await rotate('a'), 'a:1');
  assert.equal(await rotate('b'), 'b:2');
  at = 5000;
  assert.equal(await rotate('a'), 'a:3');
});
test('uncertain web commands retain the original key while definitive rejections allow correction', () => {
  for (const item of [
    { code: 'SOMETHING_FAILED', status: 500 },
    { code: 'AUTH_REQUIRED', status: 401 },
    { code: 'RATE_LIMITED', status: 429 },
    { code: 'REQUEST_IN_PROGRESS', status: 409 },
    { code: 'IDEMPOTENCY_CONFLICT', status: 409 },
    { code: 'CONNECTION_ERROR', status: 0 },
  ])
    assert.equal(uncertainOutcome(item), true);
  for (const item of [
    { code: 'INVALID_INPUT', status: 400 },
    { code: 'INSUFFICIENT_FUNDS', status: 422 },
    { code: 'VERSION_CONFLICT', status: 409 },
  ])
    assert.equal(uncertainOutcome(item), false);
});
