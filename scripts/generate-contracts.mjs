import { readFile, writeFile, mkdir } from 'node:fs/promises';
import openapiTS, { astToString } from 'openapi-typescript';
import prettier from 'prettier';
import { fileURLToPath } from 'node:url';

const output = new URL('../packages/contracts/src/generated/openapi.ts', import.meta.url);
const ast = await openapiTS(new URL('../docs/api/openapi.yaml', import.meta.url), {
  alphabetize: true,
});
const options = await prettier.resolveConfig(fileURLToPath(output));
const result = await prettier.format(astToString(ast), { ...options, parser: 'typescript' });
if (process.argv.includes('--check')) {
  if ((await readFile(output, 'utf8')) !== result)
    throw new Error('Generated contracts are stale; run npm run contracts:generate');
  console.info('Generated HTTP/WebSocket contract types match OpenAPI.');
} else {
  await mkdir(new URL('.', output), { recursive: true });
  await writeFile(output, result);
  console.info('Generated packages/contracts/src/generated/openapi.ts for web and mobile.');
}
