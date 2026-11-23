import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createConfig, lint } from '@redocly/openapi-core';
import YAML from 'yaml';

const ref = 'docs/api/openapi.yaml';
const config = await createConfig({
  extends: ['minimal'],
  rules: { 'no-unused-components': 'off', 'no-server-example.com': 'off' },
});
const problems = await lint({ ref, config });
for (const p of problems) console.error(`${p.severity}: ${p.ruleId}: ${p.message}`);
if (problems.some((p) => p.severity === 'error')) process.exit(1);
const api = YAML.parse(await readFile(ref, 'utf8'));
assert.equal(api.openapi, '3.1.0');
const ids = new Set();
const transitions = JSON.parse(await readFile('docs/api/order-transitions.json', 'utf8'));
const transitionIds = new Set(transitions.transitions.map((x) => x.id));
assert.equal(transitionIds.size, transitions.transitions.length, 'Duplicate transition IDs');
const sourceStates = await readFile('docs/ORDER_STATE_MACHINES.md', 'utf8');
const sourceRows = sourceStates
  .split(/\r?\n/)
  .filter((line) => line.startsWith('|'))
  .map((line) =>
    line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim().replaceAll('`', '')),
  )
  .filter((cells) => cells.length === 4 && cells[0].includes('->') && cells[0] !== 'From -> to');
assert.deepEqual(
  transitions.transitions.map((t) => [t.expression, t.initiator, t.preconditions, t.effects]),
  sourceRows,
  'Transition registry differs from canonical state tables',
);
const prisma = await readFile('backend/prisma/schema.prisma', 'utf8');
for (const [, name, body] of prisma.matchAll(/enum\s+(\w+)\s*\{([^}]+)\}/g)) {
  const transport = api.components.schemas[name]?.enum;
  if (transport)
    assert.deepEqual(
      [...transport].sort(),
      body.trim().split(/\s+/).sort(),
      `${name}: database/API enum drift`,
    );
}
let count = 0;
for (const [path, methods] of Object.entries(api.paths)) {
  assert(path.startsWith('/api/v1/'), `Wrong prefix: ${path}`);
  for (const [method, operation] of Object.entries(methods)) {
    if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;
    assert(!ids.has(operation.operationId), `Duplicate operationId: ${operation.operationId}`);
    ids.add(operation.operationId);
    assert(
      operation['x-permissions']?.length,
      `${operation.operationId}: missing ownership/role policy`,
    );
    assert(
      Object.keys(operation.responses).some((x) => x.startsWith('4')),
      'Missing errors',
    );
    for (const id of operation['x-transition-ids'] ?? [])
      assert(transitionIds.has(id), `Unknown transition ${id}`);
    if (
      /payments\/(deposit|balance)$/.test(path) ||
      path.endsWith('/store-checkout') ||
      path.endsWith('/resolve')
    ) {
      assert(
        operation.parameters.some((x) => x.$ref?.endsWith('/IdempotencyKey')),
        'Financial command requires idempotency',
      );
    }
    count++;
  }
}
assert(api.components.securitySchemes.bearerAuth.scheme === 'bearer');
const postmanPath = 'docs/postman/marketplace.postman_collection.json';
const postmanSource = await readFile(postmanPath, 'utf8');
const postman = JSON.parse(postmanSource);
assert.equal(
  postman.info.schema,
  'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
);
const collectionRoutes = postman.item
  .flatMap((folder) => folder.item)
  .map((item) => `${item.request.method} ${item.request.url.split('?')[0]}`)
  .sort();
const contractRoutes = Object.entries(api.paths)
  .flatMap(([path, methods]) =>
    Object.keys(methods)
      .filter((method) => ['get', 'post', 'put', 'patch', 'delete'].includes(method))
      .map(
        (method) =>
          `${method.toUpperCase()} {{baseUrl}}${path
            .replace('/api/v1', '')
            .replace(/\{(\w+)\}/g, (_, key) => `{{${key}}}`)}`,
      ),
  )
  .sort();
assert.deepEqual(collectionRoutes, contractRoutes, 'Postman endpoint coverage differs');
assert.equal(new Set(collectionRoutes).size, collectionRoutes.length, 'Duplicate Postman route');
assert.equal(postman.variable.find((v) => v.key === 'token')?.value, '');
assert.equal(
  postmanSource,
  await readFile('docs/postman/syrian-marketplace.postman_collection.json', 'utf8'),
  'Postman compatibility copy differs',
);
console.info(`Postman v2.1 matches all ${collectionRoutes.length} endpoint method/path pairs.`);
console.info(
  `OpenAPI 3.1 valid: ${count} operations, ${Object.keys(api.components.schemas).length} schemas, ${transitionIds.size} documented transition rows.`,
);
console.info(
  'Contract validation does not mean business routes or PostgreSQL migrations are deployed.',
);
