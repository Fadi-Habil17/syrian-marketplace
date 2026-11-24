# Android internal preview, 2026-11-24

Source: `main` at `89bebbd`. This is an internal review artifact, not a completed mobile release or Play Store submission. The application uses the same NestJS API and PostgreSQL data as the web client.

## Connection and hosting

The preview embeds these public URLs at build time:

```dotenv
EXPO_PUBLIC_API_URL=https://dukkan-hara-mustafa.mustafa5555885555.chatgpt.site/api/v1
EXPO_PUBLIC_WS_URL=https://dukkan-hara-mustafa.mustafa5555885555.chatgpt.site/orders
EXPO_PUBLIC_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty
```

The phone can use a different network. The standalone release bundle does not need Expo Go, Metro or the development computer's LAN address. The Sites gateway still forwards web/API traffic to the current development computer through a temporary HTTPS tunnel. That computer, its services and its tunnel must stay running; this is not permanent backend hosting. Public map-provider reachability inside Syria remains unverified. A changed tunnel must be reconnected in the Sites environment and, for the current browser WebSocket configuration, the web environment.

## Local build recipe

Keep native output, caches, keys, passwords and APKs outside Git. Preserve the locked dependency versions and reviewed overrides. Install dependencies, generate Prisma and build shared packages as described in the root README, then use Expo prebuild for Android with `--no-install`. Do not overwrite existing environment files.

The Windows review build uses Expo 54.0.38, React Native 0.81.5, MapLibre 11.5.1, Gradle 8.14.3, Android platform 36, build tools 36.1.0 and JBR 21 with Gradle's Java 17 toolchain. The default NDK 27.1 download was interrupted; the complete installed NDK `29.0.14206865` is a local build override, not a dependency or framework upgrade. Native compilation must be checked before treating this override as suitable for another environment.

In generated, ignored `mobile/android/build.gradle`, set `ext.ndkVersion = '29.0.14206865'` before applying `expo-root-project`. In generated `app/build.gradle`, cap Metro workers with `react.extraPackagerArgs = ['--max-workers', '2']`. Set the app CMake staging directory to a short temporary path (`sm-apk-cxx`) and add `-DCMAKE_OBJECT_PATH_MAX=240` to its default-config CMake arguments. These adjustments address Windows path limits; they do not modify product behavior.

Use a short task-specific `GRADLE_USER_HOME`, set `JAVA_HOME`, `ANDROID_HOME`, `ANDROID_SDK_ROOT` and the public variables above, then run from the actual `mobile/android` path:

```powershell
./gradlew.bat :app:assembleRelease `
  '-PreactNativeArchitectures=arm64-v8a,armeabi-v7a,x86_64' `
  '-Pandroid.minSdkVersion=29' `
  '-Pandroid.buildToolsVersion=36.1.0' `
  '-Pkotlin.compiler.execution.strategy=in-process' `
  '-Dorg.gradle.jvmargs=-Xmx1536m -XX:MaxMetaspaceSize=512m -Djava.net.preferIPv4Stack=true' `
  --no-daemon --no-parallel --max-workers=1 --console=plain
```

The requested minimum is Android 10/API 29; all three listed architectures are included for modern phones, older ARM phones and emulator verification. A `subst` drive caused cross-drive codegen errors, so build from the actual workspace path. If moving a task-specific Gradle cache, stale generated Ninja dependency indexes can retain the old long path; remove only those generated indexes after verifying their resolved paths. Never remove SDKs or shared caches as a routine fix.

The generated release initially uses Expo's template debug signer. The distributed review artifact must be re-signed with the separate local review key and verified with Android `apksigner`; retain that key privately for compatible updates. Production application identity, ownership and signing remain a separate team decision. No credentials belong in client public variables or this document.

## Acceptance record

Download: [Android instructions](https://dukkan-hara-mustafa.mustafa5555885555.chatgpt.site/__preview/android) / [APK](https://dukkan-hara-mustafa.mustafa5555885555.chatgpt.site/__preview/android.apk), published with Sites version 4.

| Check                      | Actual result                                                                                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Release assembly           | PASS, Gradle `assembleRelease`, 368 tasks, 11m 58s on the final cached attempt                                                                                          |
| Package/version            | `com.syrianmarketplace.app`, `0.1.0`, version code `1`, launcher label `Syrian Marketplace`                                                                             |
| Compatibility declaration  | Minimum API 29 (Android 10), target/compile API 36; ARM64, ARMv7 and x86_64                                                                                             |
| Signing                    | PASS, APK Signature Scheme v3; separate local RSA 3072-bit review key, not the template debug certificate                                                               |
| Signer certificate SHA-256 | `2f15d1a6cbde7a249492cf36785b85a2a617e5f032165f8b4cb9905a82d69ab1`                                                                                                      |
| Artifact size              | 111,525,351 bytes (106.36 MiB)                                                                                                                                          |
| Artifact SHA-256           | `91a33bb21d9bcb2375ecabc87d5418ec0d08c5968e9200ac6cdfd2209afb8651`                                                                                                      |
| Embedded bundle            | PASS, 2,165,712-byte Hermes bundle; stable Site API/WebSocket URLs, map-style URL and all three native ABIs present                                                     |
| Standalone installation    | PASS, `adb install --no-incremental -r`, Pixel_7_Pro AVD, Android 16, 720×1280 at 320 dpi; Metro stopped                                                                |
| Current UI/API smoke       | PASS, Arabic home, physical-left drawer, English catalog, two live listings priced in USD/SYP, seeded-customer login, initials avatar, authenticated Account and logout |
| Native transport boundary  | PASS, Android-style login/me 200, anonymous admin 401, customer admin 403, native WebSocket connected, test session revoked                                             |
| Published download         | PASS, instructions/HEAD 200, MIME and size correct, byte range 206, complete external 111,525,351-byte download matches the SHA-256 above                               |
| Origin isolation           | PASS, untrusted direct gateway APK request 404; only the protected Sites forwarding route serves the artifact                                                           |

Screenshots and UI hierarchy dumps are ignored local evidence under `.local-data/run/apk-*`; they are not committed. The emulator's System UI briefly reported an ANR during first boot on the memory-constrained host; choosing Wait allowed the subsequent application checks to complete. No application crash was observed during those checks.

Physical Android 10 compatibility, physical-device push, iOS, the new map-editor gestures, accessibility, long-running background behavior and full client/admin parity remain separate release gates. Earlier Expo Go screenshots and JavaScript exports do not verify the new standalone APK. The local review key/password must remain private and retained for compatible future installs; its production replacement needs a team-owned signing plan.
