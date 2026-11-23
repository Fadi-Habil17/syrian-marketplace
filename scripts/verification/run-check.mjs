import { spawn } from 'node:child_process';
import { createWriteStream, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

// Execute in a disposable checkout. Never defaults to the developer's .env/database.
const checks = {
  packages: ['run', 'build:packages'],
  generate: ['run', 'db:generate'],
  schema: ['run', 'db:validate', '--workspace', 'backend'],
  migrate: ['run', 'db:migrate'],
  seed: ['run', 'db:seed'],
  'seed-types': ['run', 'db:seed:check', '--workspace', 'backend'],
  typecheck: ['run', 'typecheck'],
  backend: ['run', 'build', '--workspace', 'backend'],
  frontend: ['run', 'build', '--workspace', 'frontend'],
  unit: ['test', '--', '--json', '--outputFile=../verification-unit.json'],
  database: ['run', 'db:test', '--', '--json', '--outputFile=../verification-database.json'],
  mobile: ['run', 'test:mobile'],
  web: ['run', 'test', '--workspace', 'frontend'],
  lint: ['run', 'lint', '--workspace', 'frontend'],
  contracts: ['run', 'contracts:validate'],
  generated: ['run', 'contracts:check'],
  erd: ['run', 'db:erd:check'],
  setup: ['run', 'verify:setup'],
};
const [name, envFile, outputDirectory] = process.argv.slice(2);
if (!checks[name] || !envFile || !outputDirectory)
  throw Error(
    'Usage: node scripts/verification/run-check.mjs <check> <isolated.env> <evidence-directory>',
  );
process.loadEnvFile(resolve(envFile));
if (
  !process.env.DATABASE_TEST_URL ||
  process.env.DATABASE_URL !== process.env.DATABASE_TEST_URL ||
  !/(?:verification|_ci|_test)/i.test(new URL(process.env.DATABASE_URL).pathname)
)
  throw Error('Explicit isolated DATABASE_URL = DATABASE_TEST_URL required');
if (
  ['database', 'seed'].includes(name) &&
  (!process.env.STORAGE_ENDPOINT || !process.env.CLAMAV_HOST)
)
  throw Error('Real private storage and scanner required: refusing skipped integration suites');
const out = resolve(outputDirectory);
mkdirSync(out, { recursive: true });
const logPath = resolve(out, `${name}.log`),
  stream = createWriteStream(logPath);
const startedUtc = new Date().toISOString();
const npm = resolve(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const child = spawn(process.execPath, [npm, ...checks[name]], {
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', CI: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});
for (const pipe of [child.stdout, child.stderr]) pipe.on('data', (chunk) => stream.write(chunk));
child.once('error', (error) => {
  stream.write(error.message);
});
child.once('close', (code) => {
  stream.end();
  const result = {
    check: name,
    status: code === 0 ? 'PASS' : 'FAIL',
    exitCode: code,
    startedUtc,
    finishedUtc: new Date().toISOString(),
    command: `npm ${checks[name].join(' ')}`,
    log: logPath,
  };
  writeFileSync(resolve(out, `${name}-result.json`), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ check: name, status: result.status, exitCode: code }));
  process.exitCode = code ?? 1;
});
