import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';
export const apiContract = parse(
  readFileSync(resolve(__dirname, '../../../../docs/api/openapi.yaml'), 'utf8'),
) as Record<string, any>;
