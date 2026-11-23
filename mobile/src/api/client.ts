import createClient from 'openapi-fetch';
import * as SecureStore from 'expo-secure-store';
import type { ApiPaths, ApiSchemas } from './contracts';
import { apiConfig } from './config';

const key = 'marketplace.refresh';
let accessToken: string | null = null;
let refreshing: Promise<ApiSchemas['TokenPair'] | null> | null = null;
let sessionVersion = 0;
let credentialWrite: Promise<unknown> = Promise.resolve();
const requestVersions = new WeakMap<Request, number>();
export class SessionChangedError extends Error {
  constructor() {
    super('Session changed; retry from the current account / تغيّرت الجلسة');
  }
}
function writeCredential(work: () => Promise<unknown>) {
  const next = credentialWrite.catch(() => undefined).then(work);
  credentialWrite = next;
  return next;
}
async function persistSession(pair: ApiSchemas['TokenPair'], version: number) {
  return writeCredential(async () => {
    if (version !== sessionVersion) return false;
    await SecureStore.setItemAsync(key, pair.refreshToken);
    if (version !== sessionVersion) return false;
    accessToken = pair.accessToken;
    return true;
  });
}
let onExpired = () => {};
export const setExpiredHandler = (handler: () => void) => {
  onExpired = handler;
};
export async function saveSession(pair: ApiSchemas['TokenPair']) {
  const version = ++sessionVersion;
  accessToken = null;
  refreshing = null;
  if (!(await persistSession(pair, version))) throw new SessionChangedError();
}
export async function clearSession() {
  sessionVersion++;
  accessToken = null;
  refreshing = null;
  onExpired();
  await writeCredential(() => SecureStore.deleteItemAsync(key));
}
export const getAccessToken = () => accessToken;
export const getSessionVersion = () => sessionVersion;
export const getRefreshToken = async () => {
  await credentialWrite.catch(() => undefined);
  return SecureStore.getItemAsync(key);
};
export async function restoreSession(): Promise<ApiSchemas['TokenPair'] | null> {
  if (refreshing) return refreshing;
  const version = sessionVersion;
  const task = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken || version !== sessionVersion) return null;
    const response = await fetch(
      `${apiConfig.baseUrl.replace(/\/api\/v1\/?$/, '')}/api/v1/auth/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      },
    );
    if (version !== sessionVersion) return null;
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        await clearSession();
        return null;
      }
      throw new Error('Session refresh unavailable');
    }
    const pair = (await response.json()) as ApiSchemas['TokenPair'];
    return (await persistSession(pair, version)) ? pair : null;
  })().finally(() => {
    if (refreshing === task) refreshing = null;
  });
  refreshing = task;
  return task;
}
export const api = createClient<ApiPaths>({
  baseUrl: apiConfig.baseUrl.replace(/\/api\/v1\/?$/, ''),
  fetch: async (request: Request) => {
    const version = requestVersions.get(request) ?? sessionVersion;
    const retry = request.clone();
    const result = await fetch(request);
    if (version !== sessionVersion) throw new SessionChangedError();
    if (
      result.status !== 401 ||
      /\/auth\/(login|register|refresh|forgot-password|reset-password|verify-email)(\?|$)/.test(
        request.url,
      )
    )
      return result;
    // A late 401 for an already rotated access token needs no second refresh.
    let token = accessToken;
    if (!token || request.headers.get('Authorization') === `Bearer ${token}`)
      token = (await restoreSession())?.accessToken ?? null;
    if (version !== sessionVersion) throw new SessionChangedError();
    if (!token) return result;
    retry.headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(retry);
    if (version !== sessionVersion) throw new SessionChangedError();
    return response;
  },
});
api.use({
  onRequest({ request }) {
    requestVersions.set(request, sessionVersion);
    if (accessToken) request.headers.set('Authorization', `Bearer ${accessToken}`);
    return request;
  },
});
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
export function isDefinitiveFailure(error: unknown) {
  return (
    error instanceof ApiError &&
    error.status >= 400 &&
    error.status < 500 &&
    ![401, 408, 429].includes(error.status) &&
    !['REQUEST_IN_PROGRESS', 'IDEMPOTENCY_CONFLICT'].includes(error.code)
  );
}
export function unwrap<T>(result: { data?: T; error?: unknown; response?: Response }): T {
  if (result.error || result.data === undefined) {
    const error = result.error as { error?: { code?: string; message?: string } } | undefined;
    throw new ApiError(
      result.response?.status ?? 0,
      error?.error?.code ?? 'REQUEST_FAILED',
      error?.error?.message ?? error?.error?.code ?? 'Request failed',
    );
  }
  return result.data;
}
