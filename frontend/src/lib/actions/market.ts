'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ApiSchemas } from '../api/contracts';
import { api, ApiFailure, command, uploadFile } from '../api/client';
import { operations, type Operation, type Parameters, type Payload } from '../api/registry';
import { clearSession, credentials, currentUser, saveSession, rotateSession } from '../session';
import { localeOf, type Locale } from '../locale';

type Result =
  { ok: true; data?: unknown } | { ok: false; code: string; requestId?: string; status?: number };

function failure(error: unknown): Result {
  if (!(error instanceof ApiFailure)) throw error;
  return { ok: false, code: error.code, requestId: error.requestId, status: error.status };
}

const browserOnly = new Set<Operation>([
  'login',
  'refreshSession',
  'logout',
  'uploadFile',
  'createRealtimeTicket',
  'registerDevice',
  'revokeDevice',
]);

export async function mutate(
  name: Operation,
  params: Parameters,
  payload: Payload | undefined,
  key: string,
  version?: number,
  expectedActorId?: string | null,
): Promise<Result> {
  if (
    !params ||
    typeof params !== 'object' ||
    Array.isArray(params) ||
    !Object.hasOwn(operations, name) ||
    browserOnly.has(name) ||
    operations[name].method === 'GET'
  ) {
    return { ok: false, code: 'INVALID_INPUT' };
  }
  if (
    !/^[0-9a-f-]{36}$/i.test(key) ||
    (version !== undefined && (!Number.isSafeInteger(version) || version < 1))
  ) {
    return { ok: false, code: 'INVALID_INPUT' };
  }
  const route = operations[name];
  if (
    route.route.some(
      (field) =>
        typeof params[field] !== 'string' || !/^[0-9a-f-]{36}$/i.test(String(params[field])),
    )
  ) {
    return { ok: false, code: 'INVALID_INPUT' };
  }
  const { token } = await credentials();
  if (!route.public && !token) return { ok: false, code: 'SESSION_REQUIRED' };
  try {
    if (!route.public && (!expectedActorId || (await currentUser())?.id !== expectedActorId))
      return { ok: false, code: 'SESSION_CHANGED', status: 401 };
    if (route.path.startsWith('/admin/') && !(await currentUser())?.roles.includes('ADMIN')) {
      return { ok: false, code: 'FORBIDDEN' };
    }
    const data = await command(
      name,
      { token: route.public ? undefined : token, params, key, version },
      payload,
    );
    revalidatePath('/[locale]', 'layout');
    return { ok: true, data };
  } catch (error) {
    return failure(error);
  }
}

function returnPath(locale: Locale, value: FormDataEntryValue | null) {
  const next = typeof value === 'string' ? value : '';
  return next.startsWith('/' + locale + '/') && !next.includes('\\')
    ? next
    : '/' + locale + '/account';
}

export async function signIn(
  localeValue: Locale,
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const locale = localeOf(localeValue);
  try {
    const pair = await api(
      'login',
      {},
      {
        email: String(form.get('email') ?? ''),
        password: String(form.get('password') ?? ''),
        client: 'WEB',
      },
    );
    await saveSession(pair);
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/[locale]', 'layout');
  redirect(returnPath(locale, form.get('next')));
}

export async function resumeSession(
  localeValue: Locale,
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  const locale = localeOf(localeValue);
  const { refreshToken, token } = await credentials();
  const target = returnPath(locale, form.get('next'));
  if (!refreshToken) redirect(`/${locale}/login`);
  try {
    if (token && (await currentUser())) redirect(target);
    await saveSession(await rotateSession(refreshToken));
  } catch (error) {
    if (error instanceof ApiFailure && [401, 403].includes(error.status)) {
      await clearSession();
      redirect(`/${locale}/login`);
    }
    return failure(error);
  }
  revalidatePath('/[locale]', 'layout');
  redirect(target);
}

export async function signOut(localeValue: Locale) {
  const locale = localeOf(localeValue);
  let { token, refreshToken } = await credentials();
  if (refreshToken) {
    try {
      if (!token) {
        const pair = await rotateSession(refreshToken);
        token = pair.accessToken;
        refreshToken = pair.refreshToken;
      }
      await api('logout', { token }, { refreshToken });
    } catch (error) {
      if (!(error instanceof ApiFailure)) throw error;
    }
  }
  await clearSession();
  revalidatePath('/[locale]', 'layout');
  redirect(`/${locale}`);
}

export async function stageFile(
  form: FormData,
  key: string,
  expectedActorId?: string | null,
): Promise<Result> {
  const { token } = await credentials();
  if (!token) return { ok: false, code: 'SESSION_REQUIRED' };
  try {
    if (!expectedActorId || (await currentUser())?.id !== expectedActorId)
      return { ok: false, code: 'SESSION_CHANGED', status: 401 };
    return { ok: true, data: await uploadFile({ token, key }, form) };
  } catch (error) {
    return failure(error);
  }
}

export async function fileStatus(fileId: string): Promise<Result> {
  const { token } = await credentials();
  if (!token) return { ok: false, code: 'SESSION_REQUIRED' };
  try {
    return { ok: true, data: await api('getFileStatus', { token, params: { fileId } }) };
  } catch (error) {
    return failure(error);
  }
}

export async function loadShippingOptions(
  storeId: string,
  addressId: string,
  currency: ApiSchemas['Currency'],
) {
  const { token } = await credentials();
  if (!token) return { ok: false, code: 'SESSION_REQUIRED' } as const;
  if (
    ![storeId, addressId].every((id) => typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id)) ||
    !['SYP', 'USD'].includes(currency)
  ) {
    return { ok: false, code: 'INVALID_INPUT' } as const;
  }
  try {
    const data = await api('getDeliveryOptions', {
      token,
      query: { storeId, addressId, currency },
    });
    return { ok: true, data } as const;
  } catch (error) {
    if (!(error instanceof ApiFailure)) throw error;
    return { ok: false, code: error.code } as const;
  }
}

export async function orderTicket(orderId: string) {
  const { token } = await credentials();
  if (!token) return null;
  try {
    // Only the one-use room credential crosses the browser boundary.
    return await api('createRealtimeTicket', { token }, { orderId });
  } catch (error) {
    if (error instanceof ApiFailure) return null;
    throw error;
  }
}
