# Mobile application (partial implementation)

Expo SDK 54 / React Native 0.81 / React 19.1 / TypeScript / Expo Router. Originating branch: `feature/mobile`; reviewed for merge into main. See [coverage and remaining required implementation](../docs/MOBILE_API_ISSUES.md). This is not a complete mobile release.

## Run on Android or iOS

From the repository root:

```powershell
npm ci
npm run build:packages
Copy-Item mobile/.env.example mobile/.env
npm run dev:mobile
```

Keep an existing `.env` rather than overwriting it. Use the same running NestJS API and durable worker as documented in the root README. `EXPO_PUBLIC_API_URL` ends in `/api/v1`; `EXPO_PUBLIC_WS_URL` ends in `/orders`. For Android emulator use `10.0.2.2`; for a phone use a reachable LAN host. All Expo public variables are public: never add JWT secrets, storage credentials or database URLs.

Use a compatible SDK 54 development build. Current Expo Go may target another SDK and does not support Android remote push in this setup. For testing on a shared network, run `npm run start --workspace mobile -- --lan`; scan its QR with the compatible development client. Metro tunnel sharing only tunnels Metro, not the Nest API: the phone must reach the API separately. For an installable preview use a reachable HTTPS backend.

## Android APK instructions

These commands require the contributor's Expo/EAS account, Android build credentials and an actual team-owned Expo project:

```powershell
cd mobile
npx eas-cli login
npx eas-cli init
npx eas-cli build --platform android --profile preview
```

The committed `eas.json` preview profile requests an internal APK. Download the APK from the URL EAS returns and share that URL with reviewers. A hosted APK/Expo link has not been created here. Native development client builds require adding the SDK-compatible `expo-dev-client` dependency before using the development profile. Production identifiers in `app.json` are provisional and need team ownership before publishing.

## Push

Configure `EXPO_PUBLIC_PROJECT_ID` with the real EAS project UUID, build a development/native client, sign in on a physical phone and choose Enable push in Account. The backend must have Expo push enabled and its worker running. The app asks OS permission, obtains an Expo token and registers it using the existing `/devices` contract. Denial leaves persistent in-app notifications available. Tap/deep-link routing and device token revocation lifecycle remain unfinished.

## Security and API

Access tokens stay in memory; rotating refresh tokens use Expo SecureStore. The typed client consumes the unchanged generated OpenAPI `paths`. A single in-flight refresh prevents ordinary concurrent refresh reuse; authenticated retries preserve request bodies, version and idempotency headers. No client calculates authoritative installments, escrow, fees, deadlines, permissions or order transitions. Redux persistence is not used. Context holds session/UI state and an ephemeral cart. Logout clears local session even if remote revocation fails; remote failure is shown. Session-generation checks prevent old-account retries and late refresh resurrection. Pending store-checkout command identities are isolated per user and stored in SecureStore before sending; authoritative prices, balances and order state are always fetched from the backend.

The [Mobile App Figma page](https://www.figma.com/design/BdSdHj3FUoQVCGK6JLfNgb/?node-id=0-1) provides the 390 × 844 reference for the shared header and navigation, home, location picker, catalog, detail pages, and authentication. Home uses the bundled design imagery and icons. Catalog and detail photos come from the public catalog. Location and category choices use the existing geography and catalog endpoints. The selected browse location is held in memory for the current session.

## Checks run

- Shared packages build: passed.
- Mobile TypeScript: passed on the current source.
- `npm run test:mobile`: current session, checkout-retry and socket regression results are recorded in the [merge review](../docs/MOBILE_MERGE_REVIEW.md); native storage/network boundaries are mocked in unit tests.
- Expo SDK dependency compatibility and public config: passed.
- Android and iOS Hermes exports: passed after the local Babel monorepo fix and approved native compiler execution. Exports are ignored and are not APK/IPA files.
- Setup verification: passed.
- Production dependency audit during merge review: 27 affected nodes (20 moderate/seven high), no critical. No force-upgrades or root overrides changed.

Pixel 8 emulator checks with Expo Go SDK 54 covered home at 320, 390, and 411 dp, and exercised the location picker, filtered catalog, service and product details, storefront, and sign-in and registration screens at 390 dp. iOS layout, real-device push delivery, and full device acceptance remain pending. The [merge review](../docs/MOBILE_MERGE_REVIEW.md) records the earlier live transport/checkout check with mocked native storage.

## Maps on Android and iOS

Set `EXPO_PUBLIC_API_URL` to an API reachable from the target device. Leave `EXPO_PUBLIC_MAP_STYLE_URL` empty for text/list review or supply the Liberty URL from the [map verification record](../docs/MAP_VERIFICATION.md) before building. The MapLibre and foreground location plugins are declared in `app.json`. Expo Go supports the fallback UI. Map rendering needs a native application with Expo SDK 54 and the new architecture enabled.

From `mobile/`, `npx expo run:android` builds, installs and starts the local Android app against Metro. On macOS with Xcode and CocoaPods, use `npx expo run:ios`. For team-owned internal distribution, the existing `preview` EAS profile supports `eas build --platform android --profile preview` (APK) or `eas build --platform ios --profile preview` (registered devices, Apple signing and provisioning required). No review build has been uploaded as part of this increment. The [verification record](../docs/MAP_VERIFICATION.md) identifies the native checks actually completed.
