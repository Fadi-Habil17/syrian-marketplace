import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readInput } from '../src/lib/api/form-data.ts';
const registry = JSON.parse(readFileSync(new URL('../src/lib/api/registry.json', import.meta.url)));
const resolve = (s) => (s.ref ? registry.schemas[s.ref] : s);
test('text-only edits omit the pin, clearing is explicit, and zero is a coordinate', () => {
  const form = new FormData();
  const schema = registry.schemas.AddressInput;
  form.set('details', 'Updated text');
  assert.deepEqual(readInput(form, schema, '', resolve), { details: 'Updated text' });
  form.set('pin.latitude', '0');
  form.set('pin.longitude', '-1.25');
  assert.deepEqual(readInput(form, schema, '', resolve).pin, { latitude: 0, longitude: -1.25 });
  form.set('pin.__null', 'true');
  assert.equal(readInput(form, schema, '', resolve).pin, null);
});
