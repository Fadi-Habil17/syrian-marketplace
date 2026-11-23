# Molham client update integration review

Date: 2026-11-23. **Merge verification: PASS within the scope below. Complete first-release acceptance remains FAIL** for the limitations in `KNOWN_LIMITATIONS.md`.

PASS = executed assertion met; FAIL = executed/inspected requirement not met; BLOCKED = unavailable prerequisite; NOT RUN = no execution or success claim.

## Contribution and preserved history

- Incoming implementation: `02b9736da940fd04c3ed75bb3e9442f224b7c4a4`, authored by Molham alkaseer, `fix(clients): align responsive layouts with Figma`.
- It was already merged on GitHub through PR #3 in `0bc3125`. Local integration merges that remote `main`, preserving both Molham's implementation and the GitHub merge commit. No squash, author substitution or force push.
- Local tested work was first recorded in `6094dfb` (backend fixes) and `e0f697a` (isolated verification/tests/reports), under the configured Fadi-Habil17 identity.
- At review fetch, other remote tips were `feature/mobile` and `mobile`; both were already ancestors of the integrated main. The `frontend` tip was already contained in remote main. No additional unmerged contribution was found at that fetch.

## New work reviewed

The 27-file incoming change improves the web header/content widths, home hero, workspace/catalog card proportions, collapsible filters and service/product/store detail layouts. It uses logical layout properties and responsive breakpoints for both locales.

Mobile gains a shared safe-area header/bottom navigation, location selection backed by geography endpoints, category/location catalog filters, catalog photos, a public storefront/product list, redesigned details and authentication views, and consistent Arabic/English typography. Browse location is public in-memory UI preference; it does not replace checkout addresses or server serviceability checks.

The Expo Go Android path avoids loading the unsupported remote-notification module and displays a development-build requirement when push is requested. This matches [Expo's documented Android Expo Go limitation from SDK 53](https://docs.expo.dev/versions/latest/sdk/notifications/). Real push is still not verified.

Reviewed every changed source/document. Incoming backend/schema/migrations/payment services, shared API packages, manifests and lockfile are unchanged. Prices, holds, escrow and transition authority remain on the backend. No new real payment integration or commercial policy was introduced.

## Actual checks on combined source

The combined tracked source was copied into the disposable `tmp/v1123` checkout, preserving its isolated test database/storage and installed lockfile dependencies. Web build/export output did not overwrite the user's running development builds. Local raw evidence is ignored under `tmp/merge-verification/`.

| Check                                                     | Status  | Evidence                                                                                                                                                                                                                                                               |
| --------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All workspace TypeScript checks                           | PASS    | Backend, frontend, mobile, contracts and i18n; exit 0.                                                                                                                                                                                                                 |
| Mobile client tests                                       | PASS    | 22/22, zero skipped, including the new canonical category/location query case.                                                                                                                                                                                         |
| Web client tests                                          | PASS    | 15/15, zero skipped.                                                                                                                                                                                                                                                   |
| Web lint and optimized build                              | PASS    | ESLint and Next.js production build exit 0.                                                                                                                                                                                                                            |
| API/generated types/setup                                 | PASS    | Canonical 145-operation contract validation, generated type drift, setup checks and frontend registry drift checks all pass.                                                                                                                                           |
| Resolved Expo configuration                               | PASS    | SDK 54 and Android/iOS/plugin configuration resolve.                                                                                                                                                                                                                   |
| Android/iOS JS exports                                    | PASS    | Both actual Hermes exports succeed, about 3.11 MB each. Not APKs or device tests.                                                                                                                                                                                      |
| Built web with actual API                                 | PASS    | Seven live groups: both locales' document direction, sign-in/member pages, session refresh/logout and all role page groups.                                                                                                                                            |
| Actual mobile typed transport                             | PASS    | Six live groups: login/refresh/wallets, catalog search/workspace, combined category/governorate/city filters with nonempty results, public store/products/photo, checkout/replay/full refund and logout. SecureStore is replaced with a Map only in this Node harness. |
| Backend integration/unit rerun for this client-only merge | NOT RUN | Backend executable source is unchanged by the contribution. The preceding 38 unit/217 database results are retained as baseline evidence, not relabelled as freshly rerun here. No extended security probes were replayed.                                             |
| Independent screenshot/emulator acceptance                | NOT RUN | Molham reports 80 Chromium route/viewport combinations and Pixel 8 Expo Go layout checks in his contribution. These are contributor-reported, not independently repeated in this review.                                                                               |
| Physical device push / iOS native                         | BLOCKED | Device/provider evidence unavailable.                                                                                                                                                                                                                                  |
| Complete mobile/product parity                            | FAIL    | Required missing workflows remain open as documented in KNOWN_LIMITATIONS.                                                                                                                                                                                             |

Fresh client test count is **37 PASS, 0 FAIL, 0 skipped**. This is separate from the earlier 291-test baseline, whose source and scope are retained in TEST_REPORT. Native exports and HTTP checks do not certify visual/device acceptance.

The first newly extended live-mobile harness run failed with `INVALID_INPUT` because the harness omitted the required `governorateId` on the cities request. The application location picker already supplied it correctly. The harness was corrected to select a governorate through the public API first, and the complete six-group run then passed. The failed attempt remains in `live-mobile-attempt1.*`; no backend validation was relaxed.

No new blocking implementation defect was reproduced in this contribution. Existing mobile/admin parity, dependency, delivery-offer, geography and submission limitations remain open. All earlier failed/BLOCKED/NOT RUN gates remain visible; this review does not make the project production/submission ready.
