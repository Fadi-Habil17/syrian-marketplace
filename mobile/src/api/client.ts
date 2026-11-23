import createClient from 'openapi-fetch';
import * as SecureStore from 'expo-secure-store';
import type { ApiPaths, ApiSchemas } from './contracts';
import { apiConfig } from './config';

const key = 'marketplace.refresh';
let accessToken: string | null = null;
let refreshing: Promise<ApiSchemas['TokenPair'] | null> | null = null;
let onExpired = () => {};
export const setExpiredHandler = (handler: () => void) => {
  onExpired = handler;
};
export async function saveSession(pair: ApiSchemas['TokenPair']) {
  await SecureStore.setItemAsync(key, pair.refreshToken);
  accessToken = pair.accessToken;
}
export async function clearSession() {
  accessToken = null;
  await SecureStore.deleteItemAsync(key);
}
export const getAccessToken = () => accessToken;
export const getRefreshToken = () => SecureStore.getItemAsync(key);
export async function restoreSession(): Promise<ApiSchemas['TokenPair'] | null> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;
    const response = await fetch(
      `${apiConfig.baseUrl.replace(/\/api\/v1\/?$/, '')}/api/v1/auth/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      },
    );
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        await clearSession();
        onExpired();
        return null;
      }
      throw new Error('Session refresh unavailable');
    }
    const pair = (await response.json()) as ApiSchemas['TokenPair'];
    await saveSession(pair);
    return pair;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}
export const api = createClient<ApiPaths>({
  baseUrl: apiConfig.baseUrl.replace(/\/api\/v1\/?$/, ''),
  fetch: async (request: Request) => {
    const retry = request.clone();
    const result = await fetch(request);
    if (result.status !== 401 || request.url.includes('/auth/')) return result;
    const pair = await restoreSession();
    if (!pair) return result;
    retry.headers.set('Authorization', `Bearer ${pair.accessToken}`);
    return fetch(retry);
  },
});
api.use({
  onRequest({ request }) {
    if (accessToken) request.headers.set('Authorization', `Bearer ${accessToken}`);
    return request;
  },
});
export function unwrap<T>(result: { data?: T; error?: unknown }): T {
  if (result.error || result.data === undefined) {
    const error = result.error as { error?: { code?: string; message?: string } } | undefined;
    throw new Error(error?.error?.message ?? error?.error?.code ?? 'Request failed');
  }
  return result.data;
}
