import { readFile, writeFile } from 'node:fs/promises';
import YAML from 'yaml';
import prettier from 'prettier';

const api = YAML.parse(await readFile('docs/api/openapi.yaml', 'utf8'));
const variables = new Set(['baseUrl', 'token', 'idempotencyKey', 'orderVersion']);
let currentOperation = '';
function example(s, key = '', depth = 0) {
  if (depth > 8) return null;
  if (key === 'refreshToken') {
    variables.add('refreshToken');
    return '{{refreshToken}}';
  }
  if (key === 'token') {
    const variable =
      currentOperation === 'registerDevice'
        ? 'expoPushToken'
        : currentOperation === 'resetPassword'
          ? 'passwordResetToken'
          : 'verificationToken';
    variables.add(variable);
    return `{{${variable}}}`;
  }
  if (s.$ref) return example(api.components.schemas[s.$ref.split('/').pop()], key, depth + 1);
  if (s.const !== undefined) return s.const;
  if (s.enum) return s.enum[0];
  if (s.allOf) return example(s.allOf[0], key, depth + 1);
  if (s.anyOf || s.oneOf) {
    const branch = (s.anyOf ?? s.oneOf)[0];
    if (s.type !== 'object') return example(branch, key, depth + 1);
    const merged = { ...s, ...branch, properties: { ...s.properties } };
    delete merged.anyOf;
    delete merged.oneOf;
    merged.required = [...new Set([...(s.required ?? []), ...(branch.required ?? [])])];
    for (const [name, property] of Object.entries(branch.properties ?? {}))
      merged.properties[name] = { ...s.properties?.[name], ...property };
    return example(merged, key, depth + 1);
  }
  if (s.type === 'object')
    return Object.fromEntries(
      (s.required ?? []).map((k) => [k, example(s.properties[k], k, depth + 1)]),
    );
  if (s.type === 'array') return s.minItems ? [example(s.items, key, depth + 1)] : [];
  if (s.type === 'integer' || s.type === 'number') return s.minimum ?? 0;
  if (s.type === 'boolean') return false;
  if (s.format === 'uuid') {
    variables.add(key || 'resourceId');
    return `{{${key || 'resourceId'}}}`;
  }
  if (s.format === 'email') return 'customer@demo.marketplace.test';
  if (s.format === 'uri') return 'https://example.com/demo';
  if (s.format === 'date-time')
    return key.includes('ends') || key.includes('Ends')
      ? '2026-11-25T09:00:00Z'
      : key.includes('due') || key.includes('Due')
        ? '2026-11-26T08:00:00Z'
        : '2026-11-25T08:00:00Z';
  if (s.pattern?.includes('[0-9]') || /Units$/.test(key)) return '100';
  if (key === 'password') return 'Marketplace123!';
  if (key === 'languageCode') return 'ar';
  return 'Demo request'.slice(0, s.maxLength ?? 100);
}
const folders = new Map();
for (const [path, methods] of Object.entries(api.paths))
  for (const [method, o] of Object.entries(methods)) {
    currentOperation = o.operationId;
    const tag = o.tags[0];
    if (!folders.has(tag)) folders.set(tag, { name: tag, item: [] });
    const headers = [];
    for (const p of o.parameters ?? []) {
      if (p.$ref?.endsWith('/IdempotencyKey'))
        headers.push({ key: 'Idempotency-Key', value: '{{idempotencyKey}}' });
      if (p.$ref?.endsWith('/IfMatch'))
        headers.push({ key: 'If-Match', value: '"{{orderVersion}}"' });
    }
    const url =
      '{{baseUrl}}' +
      path.replace('/api/v1', '').replace(/\{(\w+)\}/g, (_, k) => {
        variables.add(k);
        return `{{${k}}}`;
      });
    const req = {
      method: method.toUpperCase(),
      header: headers,
      url,
      description: `${o['x-implementation-status']}. ${o.description}`,
      auth: o.security?.length === 0 ? { type: 'noauth' } : undefined,
    };
    if (o.requestBody) {
      const [mime, media] = Object.entries(o.requestBody.content)[0];
      if (mime === 'multipart/form-data') {
        const input = api.components.schemas[media.schema.$ref.split('/').pop()];
        req.body = {
          mode: 'formdata',
          formdata: input.required.map((k) =>
            k === 'file'
              ? { key: k, type: 'file', src: null }
              : { key: k, type: 'text', value: String(example(input.properties[k], k)) },
          ),
        };
      } else {
        headers.push({ key: 'Content-Type', value: 'application/json' });
        req.body = {
          mode: 'raw',
          raw: JSON.stringify(
            ['createAddress', 'updateAddress'].includes(currentOperation)
              ? { ...example(media.schema), pin: { latitude: 35.01, longitude: 37.05 } }
              : example(media.schema),
            null,
            2,
          ),
          options: { raw: { language: 'json' } },
        };
      }
    }
    const query = (o.parameters ?? []).filter((p) => p.in === 'query' && p.required);
    if (query.length)
      req.url +=
        '?' +
        query
          .map((p) => p.name + '=' + encodeURIComponent(String(example(p.schema, p.name))))
          .join('&')
          .replaceAll('%7B', '{')
          .replaceAll('%7D', '}');
    const response =
      o.operationId === 'getHealth'
        ? [
            {
              name: 'Backend process alive',
              originalRequest: { method: 'GET', header: [], url: '{{baseUrl}}/health' },
              status: 'OK',
              code: 200,
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: JSON.stringify(
                { status: 'ok', phase: 'backend', simulatedPayments: true },
                null,
                2,
              ),
            },
          ]
        : [];
    const item = { name: o.summary, request: req, response };
    if (['login', 'refreshSession'].includes(o.operationId))
      item.event = [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              "if (pm.response.code === 200) { const pair = pm.response.json(); pm.collectionVariables.set('token', pair.accessToken); pm.collectionVariables.set('refreshToken', pair.refreshToken); }",
            ],
          },
        },
      ];
    folders.get(tag).item.push(item);
  }
const output = {
  info: {
    name: 'Syrian Marketplace - Release One Contract',
    description:
      'Implemented NestJS backend routes; validation and scenario coverage are detailed in BACKEND_IMPLEMENTATION_REPORT.md. Run the isolated seed before using fictional demo credentials. Login/refresh save local collection tokens. Set resource IDs/orderVersion and a fresh idempotencyKey per intent; reuse that key on timeout. Never commit actual tokens.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [...variables].map((key) => ({
    key,
    value: key === 'baseUrl' ? 'http://localhost:4000/api/v1' : key === 'orderVersion' ? '1' : '',
    type: 'string',
  })),
  auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}', type: 'string' }] },
  item: [...folders.values()],
};
const file = 'docs/postman/marketplace.postman_collection.json';
await writeFile(
  file,
  await prettier.format(JSON.stringify(output), {
    parser: 'json',
    ...(await prettier.resolveConfig(file)),
  }),
);
// Preserve old documentation links while publishing the exact requested filename.
await writeFile(
  'docs/postman/syrian-marketplace.postman_collection.json',
  await readFile(file, 'utf8'),
);
console.info(
  `Postman v2.1 generated for ${[...folders.values()].reduce((n, f) => n + f.item.length, 0)} operations.`,
);
