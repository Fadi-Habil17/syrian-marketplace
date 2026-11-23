import 'server-only';
import type { ApiOperations, ApiSchemas } from './contracts';
import { location, operations, type Operation, type Parameters, type Payload } from './registry';

type Json<T> = T extends { content: { 'application/json': infer Data } } ? Data : never;
type Success<T> = T extends { responses: infer Responses }
  ? Json<Responses[Extract<keyof Responses, 200 | 201 | 202>]>
  : never;
type Body<T> = T extends { requestBody: { content: { 'application/json': infer Data } } }
  ? Data
  : never;
type Options = {
  params?: Parameters;
  query?: Parameters;
  token?: string;
  key?: string;
  version?: number;
};

export class ApiFailure extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly requestId?: string,
  ) {
    super(code);
  }
}

async function transport(name: Operation, options: Options, body?: unknown, upload?: FormData) {
  const route = operations[name];
  const headers = new Headers();
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`);
  if (route.headers.includes('idempotency-key') && options.key)
    headers.set('Idempotency-Key', options.key);
  if (route.headers.includes('if-match') && options.version !== undefined) {
    headers.set('If-Match', `"${options.version}"`);
  }
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  const base = (process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1').replace(/\/$/, '');
  let response: Response;
  try {
    response = await fetch(base + location(name, options.params, options.query), {
      method: route.method,
      headers,
      body: upload ?? (body === undefined ? undefined : JSON.stringify(body)),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    throw new ApiFailure(0, 'CONNECTION_ERROR');
  }
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as ApiSchemas['ApiError'] | null;
    throw new ApiFailure(
      response.status,
      data?.error?.code ?? 'REQUEST_FAILED',
      data?.error?.requestId,
    );
  }
  return response;
}

export async function api<Name extends Operation>(
  name: Name,
  options: Options = {},
  body?: Body<ApiOperations[Name]>,
) {
  const response = await transport(name, options, body);
  return (response.status === 204 ? undefined : await response.json()) as Success<
    ApiOperations[Name]
  >;
}

export async function command(name: Operation, options: Options, body?: Payload) {
  const response = await transport(name, options, body);
  return (response.status === 204 ? undefined : await response.json()) as unknown;
}

export async function uploadFile(options: Options, form: FormData) {
  const response = await transport('uploadFile', options, undefined, form);
  return response.json() as Promise<ApiSchemas['FileMetadata']>;
}

export function privateDownload(fileId: string, token?: string) {
  return transport('downloadFile', { params: { fileId }, token });
}
