import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const envFile = new URL('../backend/.env', import.meta.url);
if (existsSync(envFile)) loadEnvFile(fileURLToPath(envFile));
const value = process.env.DATABASE_TEST_URL;
if (!value)
  throw new Error(
    'DATABASE_TEST_URL is required: PostgreSQL tests must not silently pass without a database.',
  );
const url = new URL(value);
if (!['postgres:', 'postgresql:'].includes(url.protocol) || !/(test|ci)/i.test(url.pathname))
  throw new Error('Use an explicitly named test/CI PostgreSQL database.');
console.info('Explicit PostgreSQL test database configured. No credentials printed.');
const result = spawnSync(
  process.execPath,
  [
    fileURLToPath(new URL('../node_modules/jest/bin/jest.js', import.meta.url)),
    '--runInBand',
    '--testPathPattern=\\.db\\.spec\\.ts$',
  ],
  {
    cwd: fileURLToPath(new URL('../backend/', import.meta.url)),
    env: process.env,
    stdio: 'inherit',
  },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
