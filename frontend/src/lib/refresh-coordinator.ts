import { createHash } from 'node:crypto';

// Used only behind session.ts's server-only boundary. Never expose refresh pairs to clients.
export function createRefreshCoordinator<T>(
  rotate: (token: string) => Promise<T>,
  now = Date.now,
  graceMs = 5_000,
) {
  const pending = new Map<string, { promise: Promise<T>; expiresAt: number }>();
  return (token: string): Promise<T> => {
    const at = now();
    for (const [key, entry] of pending) if (entry.expiresAt <= at) pending.delete(key);
    const key = createHash('sha256').update(token).digest('hex');
    const existing = pending.get(key);
    if (existing) return existing.promise;
    if (pending.size >= 500) return Promise.reject(new Error('Session refresh busy'));
    const entry = { promise: undefined as unknown as Promise<T>, expiresAt: Infinity };
    entry.promise = Promise.resolve()
      .then(() => rotate(token))
      .then((pair) => {
        entry.expiresAt = now() + graceMs;
        setTimeout(() => {
          if (pending.get(key) === entry) pending.delete(key);
        }, graceMs).unref();
        return pair;
      })
      .catch((error: unknown) => {
        if (pending.get(key) === entry) pending.delete(key);
        throw error;
      });
    pending.set(key, entry);
    return entry.promise;
  };
}
