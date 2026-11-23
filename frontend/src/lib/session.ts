import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { api, ApiFailure } from './api/client';
import type { ApiSchemas } from './api/contracts';

const secure = process.env.NODE_ENV === 'production';
const options = { httpOnly: true, secure, sameSite: 'lax', path: '/' } as const;
const accessName = secure ? '__Host-market-access' : 'market-access';
const refreshName = secure ? '__Host-market-refresh' : 'market-refresh';

export const credentials = cache(async () => {
  const jar = await cookies();
  return { token: jar.get(accessName)?.value, refreshToken: jar.get(refreshName)?.value };
});

export const currentUser = cache(async () => {
  const { token } = await credentials();
  if (!token) return null;
  try {
    return await api('getMe', { token });
  } catch (error) {
    if (error instanceof ApiFailure && [401, 403].includes(error.status)) return null;
    throw error;
  }
});

export async function saveSession(pair: ApiSchemas['TokenPair']) {
  const jar = await cookies();
  jar.set(accessName, pair.accessToken, { ...options, maxAge: pair.expiresIn });
  jar.set(refreshName, pair.refreshToken, { ...options, maxAge: 30 * 24 * 60 * 60 });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(accessName);
  jar.delete(refreshName);
}
