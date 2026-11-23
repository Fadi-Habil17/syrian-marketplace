import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import { parse } from 'yaml';

const source = new URL('../../docs/api/openapi.yaml', import.meta.url);
const output = new URL('../src/lib/api/registry.json', import.meta.url);
const spec = parse(readFileSync(source, 'utf8'));
const references = new Map();
const refName = (ref) => ref.split('/').at(-1);

function project(schema) {
  if (!schema) return null;
  if (schema.$ref) {
    const name = refName(schema.$ref);
    if (!references.has(name)) {
      references.set(name, null);
      references.set(name, project(spec.components.schemas[name]));
    }
    return { ref: name };
  }
  const result = {};
  for (const key of [
    'type',
    'format',
    'enum',
    'const',
    'required',
    'minLength',
    'maxLength',
    'minItems',
    'maxItems',
    'minimum',
    'maximum',
    'pattern',
    'description',
  ]) {
    if (key in schema) result[key] = schema[key];
  }
  if (schema.properties) {
    result.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([key, value]) => [key, project(value)]),
    );
  }
  if (schema.items) result.items = project(schema.items);
  if (!schema.properties && (schema.anyOf || schema.oneOf)) {
    result.variants = (schema.anyOf ?? schema.oneOf).map(project);
  }
  return result;
}

const operations = {};
for (const [path, methods] of Object.entries(spec.paths)) {
  for (const [method, operation] of Object.entries(methods)) {
    if (!operation.operationId) continue;
    const params = (operation.parameters ?? []).map((param) =>
      param.$ref ? spec.components.parameters[refName(param.$ref)] : param,
    );
    operations[operation.operationId] = {
      path: path.replace(/^\/api\/v1/, ''),
      method: method.toUpperCase(),
      public: Array.isArray(operation.security) && operation.security.length === 0,
      route: params.filter((param) => param.in === 'path').map((param) => param.name),
      headers: params
        .filter((param) => param.in === 'header')
        .map((param) => param.name.toLowerCase()),
      query: Object.fromEntries(
        params
          .filter((param) => param.in === 'query')
          .map((param) => [param.name, project(param.schema)]),
      ),
      requiredQuery: params
        .filter((param) => param.in === 'query' && param.required)
        .map((param) => param.name),
      body: project(operation.requestBody?.content?.['application/json']?.schema),
    };
  }
}
const expected = await format(
  JSON.stringify({ operations, schemas: Object.fromEntries(references) }),
  {
    ...(await resolveConfig(fileURLToPath(output))),
    parser: 'json',
  },
);
if (process.argv.includes('--check')) {
  if (readFileSync(output, 'utf8').replaceAll('\r\n', '\n') !== expected) {
    console.error('The frontend API registry differs from OpenAPI.');
    process.exitCode = 1;
  }
} else {
  writeFileSync(output, expected);
}
