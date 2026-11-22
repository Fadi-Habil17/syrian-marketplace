import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const required = [
  'backend',
  'frontend',
  'mobile',
  'docs',
  'packages',
  'README.md',
  'AGENTS.md',
  '.gitignore',
  'MARKETPLACE_REQUIREMENTS.md',
  'B4F_HACKATHON_RULES.pdf',
  ...[
    'REQUIREMENTS_CHECKLIST',
    'BUSINESS_RULES',
    'SYSTEM_DESIGN',
    'MODULE_BOUNDARIES',
    'DATA_FLOW',
    'PERMISSIONS_MATRIX',
    'ORDER_STATE_MACHINES',
    'ERD',
    'API_CONVENTIONS',
    'IMPLEMENTATION_PLAN',
    'SUBMISSION_GUIDE',
    'SETUP_REPORT',
  ].map((name) => `docs/${name}.md`),
  'backend/.env.example',
  'frontend/.env.example',
  'mobile/.env.example',
];
for (const item of required) await stat(path.join(root, item));

const ignored = new Set([
  'node_modules',
  '.git',
  '.next',
  '.expo',
  '.npm-cache',
  'dist',
  'build',
  'coverage',
  'tmp',
  'output',
]);
async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

const files = await walk(root);
let jsonCount = 0;
let linkCount = 0;
for (const file of files) {
  if (file.endsWith('.json')) {
    JSON.parse(await readFile(file, 'utf8'));
    jsonCount++;
  }
  if (file.endsWith('.md') && !file.endsWith('MARKETPLACE_REQUIREMENTS.md')) {
    const markdown = await readFile(file, 'utf8');
    for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (!target || /^(https?:|mailto:|#)/.test(target)) continue;
      await stat(path.resolve(path.dirname(file), decodeURIComponent(target)));
      linkCount++;
    }
  }
}
const manifest = JSON.parse(await readFile('package.json', 'utf8'));
assert.deepEqual(manifest.workspaces, ['backend', 'frontend', 'mobile', 'packages/*']);
const collection = JSON.parse(
  await readFile('docs/postman/syrian-marketplace.postman_collection.json', 'utf8'),
);
assert.equal(
  collection.info.schema,
  'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
);
assert.equal(collection.variable.find((variable) => variable.key === 'token')?.value, '');
assert.equal(collection.item[0].item[0].request.url, '{{baseUrl}}/health');
console.info(
  `Setup structure valid; ${jsonCount} JSON files parsed; ${linkCount} local Markdown links resolved.`,
);
console.info(
  'This check does not verify business behavior, native clients, database connectivity or deployment.',
);
