# UI acceptance tools

These tools drive real clients against an **isolated** backend. They do not replace API calls with fixture responses. The video-failure test intentionally aborts only the media request.

## Web

Use a production Next build at `http://127.0.0.1:14274`, configured to a separately seeded test API/database (the verification run used API port 14273). Keep the normal development server separate. The browser tools require Playwright, installed Chrome and axe-core; these are test-runner dependencies, not application bundle dependencies. The run used an existing Playwright installation and temporary axe-core 4.14.0. Set `PLAYWRIGHT_MODULE` to that module or install Playwright in your test runner, and `AXE_SCRIPT` to `axe.min.js`.

```powershell
$env:PLAYWRIGHT_MODULE = '<absolute path to playwright module>'
$env:AXE_SCRIPT = '<absolute path to axe.min.js>'
node scripts/ui/verify-web.cjs
node scripts/ui/verify-surfaces.cjs
node scripts/ui/capture.cjs after
```

`UI_BASE_URL` can select localhost on the same isolated port for the main suite. `UI_FILTER` optionally narrows case names when diagnosing a failure; unset it for a complete run. Results/logs go under ignored `tmp/ui-run`; reviewed screenshots and performance evidence go under `docs/ui-upgrade`. Baseline capture must run against the baseline build **before** replacing it. The script does not reconstruct an old application.

The suites use the repository's fictional seed credentials and create isolated fictional registrations. Never point them at production. Secure session cookie assertions wait for the authenticated page response; token values are never logged.

## Android

Requires Python 3, Android SDK `adb` under `%LOCALAPPDATA%`, emulator serial `emulator-5554`, and Expo Go SDK 54 with the isolated project open at `exp://10.0.2.2:8082/--/auth`. Metro must use `EXPO_PUBLIC_API_URL=http://10.0.2.2:14273/api/v1`; it must not point to the developer's normal database.

`android.py tree` reads the current accessibility tree. Taps resolve observed labels and valid bounds. `verify-android.py` executes **stateful phases**; read the phase's initial-state comment and put the app in that state first. It fails immediately on an unexpected control/state, rather than taking unrelated screenshots and calling them successful.

```powershell
python scripts/ui/android.py tree
python scripts/ui/verify-android.py layouts
python scripts/ui/verify-android.py auth
python scripts/ui/verify-android.py registration
python scripts/ui/verify-android.py appearance
python scripts/ui/verify-android.py matrix
python scripts/ui/verify-android.py a11y
```

The appearance phase changes only the test emulator's Android night mode and restores Light at the end. Restore `font_scale=1` after any manual larger-text checks. These scripts inspect native labels/states and exercise controls; they are not TalkBack or VoiceOver sessions. No iOS runtime is available on the Windows verification host.

`matrix` starts signed out on the Arabic auth route and completes Arabic/Dark and English/Light real login/rejection/logout cases. `a11y` starts signed out in Arabic/Light; it exercises keyboard-first Back, recovery and modal navigation, sets Android font scale to 2, reopens auth after Expo Go's activity recreation and restores scale 1 in `finally`. **Do not run accessibility-tree diagnostics concurrently with a native phase**: Android UIAutomator permits one instrumentation snapshot at a time. The snapshot helper reports bounded retries after interruption.
