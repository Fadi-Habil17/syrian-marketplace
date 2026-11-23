import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { formatMoney } from '../src/lib/money.ts';
import { readInput } from '../src/lib/api/form-data.ts';
import { parse } from 'yaml';

const registry = JSON.parse(readFileSync(new URL('../src/lib/api/registry.json', import.meta.url)));
const contract = parse(
  readFileSync(new URL('../../docs/api/openapi.yaml', import.meta.url), 'utf8'),
);

test('all web operation paths and methods come from OpenAPI', () => {
  const paths = Object.entries(contract.paths);
  let count = 0;
  for (const [path, methods] of paths)
    for (const [method, operation] of Object.entries(methods)) {
      if (!operation.operationId) continue;
      count++;
      const registered = registry.operations[operation.operationId];
      assert.equal('/api/v1' + registered.path, path);
      assert.equal(registered.method, method.toUpperCase());
    }
  assert.equal(Object.keys(registry.operations).length, count);
});

test('wallet and checkout formatting preserves large quantities, cents and locale', () => {
  assert.equal(formatMoney('en', 'USD', '9000000000000'), '$90,000,000,000.00');
  assert.equal(formatMoney('en', 'USD', '101'), '$1.01');
  assert.equal(formatMoney('en', 'USD', '-5'), '-$0.05');
  assert.match(formatMoney('ar', 'SYP', '101'), /١٠١/);
});

test('contract requires consent and parent version for simulated funding', () => {
  for (const name of ['holdDeposit', 'holdBalance', 'checkoutStore']) {
    const operation = registry.operations[name];
    assert.deepEqual(operation.headers.sort(), ['idempotency-key', 'if-match']);
    const schema = registry.schemas[operation.body.ref];
    assert.ok(schema.required.includes('termsAccepted'));
    assert.equal(schema.properties.termsAccepted.const, true);
    assert.equal(operation.public, false);
  }
});

test('browser session routes and room tickets retain distinct access requirements', () => {
  assert.equal(registry.operations.login.public, true);
  assert.equal(registry.operations.refreshSession.public, true);
  assert.equal(registry.operations.createRealtimeTicket.public, false);
  assert.deepEqual(registry.schemas.RealtimeTicketInput.required, ['orderId']);
});

const shape = (schema) => (schema.ref ? registry.schemas[schema.ref] : schema);
const payload = (operation, fields) => {
  const form = new FormData();
  for (const [field, value] of Object.entries(fields)) form.set(field, value);
  return readInput(form, registry.operations[operation].body, '', shape);
};

test('checkout inputs preserve line quantities and money strings', () => {
  assert.deepEqual(
    payload('previewStoreCheckout', {
      storeId: 'store-id',
      addressId: 'address-id',
      method: 'SELLER',
      'items.0.__item': '1',
      'items.0.productId': 'product-id',
      'items.0.quantity': '3',
    }),
    {
      storeId: 'store-id',
      addressId: 'address-id',
      method: 'SELLER',
      items: [{ productId: 'product-id', quantity: 3 }],
    },
  );
  assert.equal(
    payload('resolveAdminCase', { sellerAwardUnits: '9000000000000' }).sellerAwardUnits,
    '9000000000000',
  );
});

test('serialization distinguishes explicit null, optional omission, and consent', () => {
  assert.deepEqual(
    payload('configureCommission', { 'workspace.__null': 'true', basisPoints: '0' }),
    { workspace: null, basisPoints: 0 },
  );
  assert.deepEqual(payload('holdDeposit', { termsAccepted: 'true' }), { termsAccepted: true });
  assert.deepEqual(payload('holdDeposit', {}), {});
  assert.deepEqual(
    payload('sendMessage', { roomId: 'room-id', clientMessageId: 'message-id', text: 'مرحبا' }),
    { roomId: 'room-id', clientMessageId: 'message-id', text: 'مرحبا' },
  );
});
