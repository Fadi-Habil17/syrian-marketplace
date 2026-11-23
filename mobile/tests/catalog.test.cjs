const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm'),
  ts = require('typescript'),
  YAML = require('yaml');
const exportsObject = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('mobile/src/catalog-query.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  { exports: exportsObject },
);
const spec = YAML.parse(fs.readFileSync('docs/api/openapi.yaml', 'utf8'));
function check(path, query) {
  const allowed = spec.paths[path].get.parameters
    .map((p) => (p.$ref ? spec.components.parameters[p.$ref.split('/').pop()] : p))
    .filter((p) => p.in === 'query')
    .map((p) => p.name);
  for (const key of Object.keys(query))
    assert(allowed.includes(key), 'Unknown contract query: ' + key);
}
test('professional and freelance queries use canonical workspace and search names', () => {
  const professional = exportsObject.listingQuery('PROFESSIONAL', 'electric');
  check('/api/v1/listings', professional);
  assert.equal(professional.workspace, 'PROFESSIONALS');
  assert.equal(professional.q, 'electric');
  assert.equal(exportsObject.listingQuery('FREELANCE', 'design').workspace, 'FREELANCE');
});
test('product search and cursor conform to the same backend contract', () => {
  const query = exportsObject.productQuery('bread', 'cursor-value');
  check('/api/v1/products', query);
  assert.equal(query.q, 'bread');
  assert.equal(query.cursor, 'cursor-value');
});
