# Marketplace map verification

## Private destinations

The address book accepts a written address with an optional point. A PATCH that omits `pin` preserves it. Sending `null` removes it. Store preview, fixed-price booking and inspection copy the selected address into the order. Editing the address book later affects future orders. Both private and public migrations add nullable columns and enforce complete, bounded coordinate pairs in PostgreSQL. Existing order snapshots can be read without a pin.

The buyer and authorized fulfillment participants read the snapshot through REST. An unassigned job exposes its service region. A driver reads the exact destination during the active assignment. Clients refetch on change and focus. Delivery command replay also checks the current assignment before returning a destination. Private markers are constructed on the client. The map host receives viewport tile requests, which can reveal the vicinity. The application uses no reverse geocoding and includes no address, pin, order ID or marketplace credential in tile requests.

## Public venues and discovery

Store owners and professionals enter a separate point and confirm that the venue receives visitors before publishing it. Withdrawal removes the public point. The public API selects venue and geographic fields independently of the address book and order snapshots. Approximate entries use a reviewed business city center. A missing point still leaves a result in the list. The initial dataset contains one reviewed center for Salamiyah in Hama. The migration uses the GeoNames coordinates without modification, and synthetic demo areas have no guessed center. [GeoNames place 164947](https://www.geonames.org/164947/as-salamiyah.html) · [GeoNames dataset and license](https://download.geonames.org/export/dump/readme.txt)

A city search includes city-wide service. Selecting an area also includes businesses that serve that area. A rounded, optional foreground fix changes distance ordering within that coverage. It remains in screen memory. Signed cursors bind to a digest of the search criteria. The list and map use the same result page, with unmapped businesses sorted last. The backend currently ranks eligible candidates in memory. Large-catalog performance is unmeasured.

## Provider review

OpenFreeMap's public Liberty style is a candidate for zero-cost hosting. It requires no marketplace API key and offers no availability guarantee. On the review host, the style returned a version 8 document, its tile source supplied attribution, and a fixed regional tile returned HTTP 200. The web renderer uses the style source's attribution. Native also displays OpenFreeMap, OpenMapTiles and OpenStreetMap credit. OpenFreeMap describes its infrastructure logging and retention in its privacy policy. [Quick start and attribution](https://openfreemap.org/quick_start/) · [Terms](https://openfreemap.org/tos/) · [Privacy](https://openfreemap.org/privacy/)

The example configuration leaves both map style variables empty. Written addresses, coordinate entry and the discovery list operate in that configuration. For a review build, set `NEXT_PUBLIC_MAP_STYLE_URL` and `EXPO_PUBLIC_MAP_STYLE_URL` to `https://tiles.openfreemap.org/styles/liberty` before building. A physical device also needs a reachable marketplace API. Expo Go exercises the list and written-address fallback. The native renderer requires a build with the MapLibre plugin. [Expo native setup](https://maplibre.org/maplibre-react-native/docs/setup/expo/)

The production audit has no critical findings after updating the web renderer. The [dependency review](DEPENDENCY_SECURITY.md) records the remaining advisories.

## Verification record

| Environment | Evidence |
| --- | --- |
| Private slice gate | 28 PostgreSQL-backed store and service tests passed before implementing public discovery. Covered both delivery methods, professional booking and inspection, address mutation and snapshot reads. |
| Combined backend | 221 integration tests across 11 suites passed against the isolated local PostgreSQL database. They exercised publication and withdrawal, coverage, driver assignment and revocation, replay and malformed coordinates. All 39 backend unit tests passed, including ranking and cursor checks. |
| Web | Chrome exercised the production build and real local API. It placed a pin by clicking the map, denied the one-shot location request, saved a manual point, preserved it on text edit and cleared it during a simulated provider outage. Arabic and English discovery links opened their detail pages by keyboard. In the online-style fixture, the displayed marker counts, overlapping points and list order matched the same API result page. In the owner workspace, Chrome verified that publication required consent, the entered point was saved, and withdrawal removed it. The browser intercepted provider requests to inspect their headers and make failures repeatable. |
| Mobile | On a Pixel 8 Android emulator, Expo Go opened the address book and exercised governorate/city selection, discovery and the no-provider fallback. A signed-in fictional buyer edited a saved address on Android with tiles disabled. Separate authenticated REST reads confirmed both the manually entered coordinates and the null pin after an explicit removal from a saved address. Gradle assembled x86_64 debug and self-contained release-variant APKs with native MapLibre. The installed standalone APK displayed live OpenFreeMap tiles and attribution on the Arabic address screen. Tapping the map populated its coordinate fields, a second tap moved the pin, and removing it cleared both fields. Both platforms produced Hermes exports. All 25 mobile tests passed, including foreground permission denial, timeout and one-shot success with mocked device services. Native OS and human accessibility acceptance are tracked separately below. |
| Database scope | Both reviewed migrations were applied and the fictional seed reran on the isolated test database. Deployment environments need the migrations before the new code serves requests. A locked Windows Prisma engine prevented in-place regeneration in this checkout. Verification used a client generated from the same schema in a separate directory with a matching engine checksum. |

The Android debug launch hit a React Native Metro inspector exception. The standalone APK ran without Metro and supplied the native map evidence above. Its first denial check opened the OS dialog and exposed an off-screen feedback message. The updated standalone APK showed the Android foreground permission dialog on button press. Denial displayed the translated alert beside the button and left manual coordinate entry enabled. Android reported a low-memory exit in an earlier combined run while switching between test apps.

Workspace type checks, backend and web production builds, 16 web tests, Prisma schema and seed checks, setup verification, and contract drift checks passed. OpenAPI and both Postman collections cover 148 operations.

### Reproduce the browser check

Build the backend and web with the candidate style and configure a seeded local `DATABASE_TEST_URL`. Install Chrome and supply Playwright through the normal Node resolver or `PLAYWRIGHT_MODULE`. With `TEST_MAP_STYLE=1`, run `node scripts/verification/map-web.cjs` from the root. It starts local API/web listeners, registers a fictional test buyer and leaves the test records in the test database. Review native build commands in the [mobile guide](../mobile/README.md).

### Windows Android build

The default build under the long OneDrive workspace path reached Ninja's 260-character limit. The emulator build succeeded with the repository's optional [CMake init script](../scripts/verification/android-cmake-short-path.gradle), a temporary drive mapping to an ignored build directory and `-PreactNativeArchitectures=x86_64`. The SDK components were Android platform 36, NDK 27.1.12297006 and CMake 3.22.1. Run the Gradle task from `mobile/android` with `JAVA_HOME`, `ANDROID_HOME` and `MARKET_MAP_CXX` set.

```powershell
.\gradlew.bat :app:assembleDebug -PreactNativeArchitectures=x86_64 --init-script ../../scripts/verification/android-cmake-short-path.gradle --max-workers=3
```

The resulting `mobile/android/app/build/outputs/apk/debug/app-debug.apk` targets the x86_64 emulator. Windows embedded builds resolve the Expo Router entry from `mobile/` and retain the workspace watch folders for hoisted packages. The existing souk image uses its JPEG extension so Android can compile the original bytes. The same init script and `:app:assembleRelease` produced a self-contained emulator APK with Hermes and the candidate style. It uses the template’s local debug signing key and a loopback review API. For the standalone address-screen check, install `app-release.apk` with `adb install -r` on the emulator, then open `dukkanhara:///addresses`. Scroll to the pin field, tap two different map positions and remove the pin. Observe that both coordinate fields change with each tap and clear on removal. The native build directory and APKs are ignored by Git.

### Pending acceptance

- Run the candidate provider on a known in-country user connection. Sample urban and rural places across all 14 Syrian governorates. Check Arabic and English basemap labels, coverage, placement accuracy, and slow or unavailable tiles.
- Exercise both workflows on physical iOS and Android devices. Confirm foreground permission grant, denial, timeout and return from Settings, pin adjustment and removal, list fallback, and the former driver's screen after assignment changes. Verify with VoiceOver and TalkBack. Expo config introspection confirmed an Arabic permission explanation and a foreground-only iOS location purpose. iOS compilation and signing require an Apple build environment.
- Measure discovery opens as a share of discovery sessions after release. Measure address clarification or failed visits/deliveries only where a structured reason exists. Any such measurement should use aggregate counts and exclude addresses, coordinates and device locations.
