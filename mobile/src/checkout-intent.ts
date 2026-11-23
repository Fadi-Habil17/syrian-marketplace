import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

// Persist command identity only; prices, balances and order status stay server-owned.
export type CheckoutIntent = {
  userId: string;
  draftOrderId: string;
  version: number;
  key: string;
};
let writes: Promise<unknown> = Promise.resolve();
function serialized<T>(work: () => Promise<T>): Promise<T> {
  const result = writes.catch(() => undefined).then(work);
  writes = result;
  return result;
}
const storageKey = (userId: string) => `marketplace.checkout.${userId}`;
async function read(userId: string): Promise<CheckoutIntent | null> {
  const raw = await SecureStore.getItemAsync(storageKey(userId));
  if (!raw) return null;
  const intent = JSON.parse(raw) as CheckoutIntent;
  if (
    intent.userId !== userId ||
    typeof intent.draftOrderId !== 'string' ||
    typeof intent.key !== 'string' ||
    !Number.isSafeInteger(intent.version) ||
    intent.version < 1
  )
    throw new Error('Could not restore pending payment / تعذّر استعادة الدفع المعلّق');
  return intent;
}
export function readCheckoutIntent(userId: string) {
  return serialized(() => read(userId));
}
export function beginCheckout(userId: string, draftOrderId: string, version: number) {
  return serialized(async () => {
    const existing = await read(userId);
    if (existing) {
      if (existing.draftOrderId !== draftOrderId)
        throw new Error('Resolve the pending payment first / تحقّق من الدفع المعلّق أولاً');
      return existing;
    }
    const intent = { userId, draftOrderId, version, key: Crypto.randomUUID() };
    await SecureStore.setItemAsync(storageKey(userId), JSON.stringify(intent));
    return intent;
  });
}
export function finishCheckout(intent: CheckoutIntent) {
  return serialized(async () => {
    const existing = await read(intent.userId);
    if (existing?.key === intent.key) await SecureStore.deleteItemAsync(storageKey(intent.userId));
  });
}
