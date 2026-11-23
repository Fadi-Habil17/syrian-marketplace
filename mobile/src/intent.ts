import { useRef } from 'react';
import * as Crypto from 'expo-crypto';
/** Keep one key for a request body until its outcome is known. */
export function useIntent() {
  const current = useRef<{ body: string; key: string } | null>(null);
  return {
    key(body: unknown) {
      const serialized = JSON.stringify(body);
      if (current.current && current.current.body !== serialized)
        throw new Error(
          'Retry the pending request before changing it / أعد محاولة الطلب المعلّق أولاً',
        );
      current.current ??= { body: serialized, key: Crypto.randomUUID() };
      return current.current.key;
    },
    done() {
      current.current = null;
    },
  };
}
