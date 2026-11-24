import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const first = '00000000-0000-4000-8000-000000000001';
const second = '00000000-0000-4000-8000-000000000002';
const city = '00000000-0000-4000-8000-000000000003';
function fixture() {
  const calls = [],
    exports = {};
  const source = ts.transpileModule(
    readFileSync(new URL('../src/lib/actions/market.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (name === '../api/client')
        return {
          api: async (operation, options) => {
            calls.push({ operation, options });
            if (operation === 'listGovernorates') return { items: [{ id: first }, { id: second }] };
            return {
              items:
                options.query.governorateId === second
                  ? [{ id: city, center: { latitude: 35, longitude: 37 } }]
                  : [],
            };
          },
        };
      return {};
    },
  });
  return { load: exports.loadMapLocations, calls };
}
test('governorate selection loads only its cities and preserves their center', async () => {
  const f = fixture(),
    data = await f.load(second);
  assert.equal(data.selected, second);
  assert.equal(data.cities[0].center.latitude, 35);
  assert.equal(f.calls.filter((call) => call.operation === 'listCities').length, 1);
  assert.equal(f.calls[1].options.query.governorateId, second);
});
test('editing an address restores its city and governorate', async () => {
  const f = fixture(),
    data = await f.load(undefined, city);
  assert.equal(data.selected, second);
  assert.equal(data.cities[0].id, city);
});
test('invalid location identifiers never reach the API', async () => {
  const f = fixture();
  await assert.rejects(f.load('invalid'), /INVALID_LOCATION/);
  assert.equal(f.calls.length, 0);
});
