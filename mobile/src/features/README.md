# Mobile feature status

The Expo Router entry is `app/_layout.tsx`; route screens consume the shared backend contract through `src/api/client.ts`. Session/UI state and the cart use scoped contexts. Access credentials stay in memory; refresh credentials and unresolved checkout command identities use SecureStore. Backend-owned prices, allocations and order state are never persisted as client authority.

This is a partial client. See [remaining workflows](../../../docs/MOBILE_API_ISSUES.md) and the [review evidence](../../../docs/MOBILE_MERGE_REVIEW.md). Complete marketplace/admin parity, file workflows and native acceptance remain required; successful compilation is not end-to-end acceptance.
