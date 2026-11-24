# B4F submission handoff

Deadline from PDF page 9: **Tuesday, 24 November 2026 at 16:00, Asia/Damascus**. Source PDF is preserved at repository root. This repository is an initial setup, not a completed hackathon submission. Names and GitHub roster were deferred by the owner; never use the PDF's illustrative people as actual teammates.

## Required final deliverables

| Artifact                                       | Rule                                                                    | Current status                                                                |
| ---------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `اسم-الفريق_ملخص-المشروع.docx`                 | Replace team-name segment; Arabic, maximum one page                     | Pending real roster and final implementation                                  |
| `TeamName_ProjectBrief_EN.docx`                | English, maximum one page, same facts as Arabic                         | Pending                                                                       |
| `اسم-الفريق_الدراسة-التحليلية-والتصميمية.docx` | Arabic analysis/design                                                  | Pending                                                                       |
| `TeamName_AnalysisDesign_EN.docx`              | English analysis/design                                                 | Pending                                                                       |
| GitHub repository URL                          | Public or grant reviewer collaborator access incl. commits/contributors | Fadi-Habil17/syrian-marketplace; reviewer access acceptance pending           |
| Demo URL                                       | Include if available and document actual status                         | Temporary Sites demo; reviewer acceptance pending                             |
| APK or Expo review link                        | Required mobile review path plus local run instructions                 | Signed Android 10+ APK published and emulator-tested; physical review pending |
| Short demo video                               | Optional                                                                | Not scheduled                                                                 |

Use the PDF's filename convention with the actual chosen team name; the Arabic text's right-to-left display can reorder the `.docx` suffix visually. Save real filenames with a normal `.docx` extension. Markdown architecture documents do not replace these four Word files. Produce and render the Word files only after the final facts and roster are known; count pages and verify diagrams/readability in both languages.

## Brief content (both languages)

One page each: project name and short overview; problem and solution; target users and main features; NestJS, Next.js and React Native stack; each actual member's full name, primary role, main contribution and GitHub username; repository URL and demo link if available. Every contribution statement must match real Git history. Do not imply business features exist solely because they appear in this setup's design.

## Analysis/design content (both languages)

Prefer 4-5 pages per language, hard maximum 10 per language, including diagrams. Required sections: overview with goal/audience/problem/scope/out-of-scope; actors; functional requirements; relevant nonfunctional requirements (security/performance/usability/reliability/response/maintainability); at least three main use cases with brief scenarios; architecture diagram connecting Next/Nest/React Native/database/external services; entities/relationships/PK/FK and ERD; security covering authentication/authorization/roles/password hashing/protected endpoints/input validation. Use-case diagram optional. Business rules and main data flow optional additions if room allows. Source material is in SYSTEM_DESIGN, ERD, PERMISSIONS_MATRIX, API_CONVENTIONS and BUSINESS_RULES.

## Repository and reviewer gate

- Complete backend/frontend/mobile inside one repository with exact required root names, plus README/docs/.gitignore; packages is additive.
- Real members use their own primary GitHub accounts and matching Git emails. Preserve authorship, avoid squashes hiding contributors, never upload everyone else's code under one name. README roster and Word briefs agree with contribution history.
- README has all required sections, actual install/run/migrate/seed commands, reviewer-ready demo credentials with actual demo passwords, Swagger and Postman links, demo status, mobile artifact and known limitations.
- Separate environment templates contain every required variable per app and no real secrets. Public web/Expo variables use their correct prefixes. Never commit credentials, private keys, production keys or real database passwords.
- Swagger `/api/docs` includes DTO/request/response/auth/error detail; Postman v2.1 covers every route with auth/bodies/examples and `{{baseUrl}}`/`{{token}}` variables; no secrets. Domain folders agree with README overview.
- Final seed recreates each role, both currencies and demo scenarios. README documents actual seeded credentials; setup metadata seed does not satisfy this gate.
- Fresh-clone reviewer verifies web/mobile/API/worker, migrations/seed, both locales/admin interfaces, all minimum acceptance scenarios and mobile push on development builds.
- Confirm final URLs/reviewer access and test APK or Expo link before submission. Record exact verification and limitations in SETUP_REPORT or a later release report.

## Temporary private demo, 2026-11-24

This section records the initial Expo launch. The later main refresh and standalone APK below supersede its migration/test counts and mobile download instructions.

- Web: [Dukkan & Hara](https://dukkan-hara-mustafa.mustafa5555885555.chatgpt.site). Created with owner-only access; the current Sites configuration reports public access. This redirect repair preserved that existing setting and sent no invitations.
- Android: open the [connection page](https://dukkan-hara-mustafa.mustafa5555885555.chatgpt.site/__preview/android) on the phone, install the linked Expo Go build for SDK 54, then choose the app launch link. The phone can use a different network because both Metro and the API have HTTPS connections.
- Hosting boundary: a separate Sites Worker forwards to the original local Next.js app through a protected origin. NestJS, PostgreSQL, storage, antivirus and the durable worker remain on the development computer. Stopping the computer or tunnel disconnects this preview; restarting the temporary tunnel requires updating its URLs. This does not deliver permanent hosting or production approval.
- Actual checks: clean locked dependency installation recovered; shared builds, all workspace TypeScript checks, Nest/Next builds, Prisma validation and seed compilation passed. The local development database has all 11 migrations. Backend unit tests: 39 passed; mobile regression tests: 25 passed. PostgreSQL integration suites and a fresh dependency audit were not rerun for this launch task.
- Runtime coverage: the deployed private Site served Arabic, English, products, static assets and Android instructions. A fictional seeded customer signed in through the hosted Next Server Action (303), received secure HttpOnly session cookies and opened the authenticated account page (200); the verification session was then revoked (200). Expo Go 54.0.8 on the Android emulator opened the same external project link and displayed the Arabic/English freelance catalog from the shared API, including SYP and USD records. Android manifest and bundle downloads returned HTTP 200 externally. The initial bundle required local warmup after an external timeout; a Windows Metro watcher crash was repaired by excluding transient Next/cache output.
- Still pending: the owner's physical-device connection, iOS, native map/push acceptance, complete client/admin parity, reviewer access, standalone APK and the existing submission deliverables. This preview does not close those release gates.

### Root-link repair, 2026-11-24

Sites version 2 fixes the root redirect to https://localhost:3000/ar by translating both HTTP and HTTPS local Next.js redirects to the published Site origin. Five proxy boundary/redirect tests passed. Anonymous external requests followed the root link to the Site's /ar page (HTTP 200); /ar, /en and the Android connection page also returned 200. The temporary local-runtime dependency and outstanding native/release checks remain unchanged.

### Updated main and shared runtime, 2026-11-24

Fast-forwarded to `89bebbd`, preserving contributor history and restoring the existing local preview/setup edits without conflicts. The latest web/mobile shell and location-editor source is included. The reviewed email-verification removal migration was applied to both development and separate integration-test databases; both have all 12 migrations. Password reset remains available.

All workspace type checks, Nest/Next builds, Prisma validation, setup verification and contract checks passed. Contracts cover 147 operations, 194 schemas and 75 transition rows, with matching Postman pairs. Tests passed: backend unit 39, web 20, mobile 28 and real PostgreSQL integration 221 in 11 suites (308 total). Seven separate Sites proxy tests passed. Existing dependency versions and compatible overrides were preserved; the production security dispositions remain in DEPENDENCY_SECURITY.

The updated public Site returned 200 for Arabic/English pages, products and login; new bilingual footer content was present and no email-verification link was rendered. Native Android-style login through the stable Site API returned 200, authenticated `/auth/me` returned 200, anonymous/customer admin requests returned 401/403, the native WebSocket connected and the verification session was revoked. These HTTP checks do not establish full browser, mobile/admin, accessibility or physical-device acceptance. The [Android preview record](ANDROID_APK_PREVIEW.md) tracks the separate standalone build and its exact runtime scope.

### Standalone Android delivery, 2026-11-24

Sites version 4 publishes the [download page](https://dukkan-hara-mustafa.mustafa5555885555.chatgpt.site/__preview/android) and [signed APK](https://dukkan-hara-mustafa.mustafa5555885555.chatgpt.site/__preview/android.apk). The Android 10+ universal artifact is 111,525,351 bytes, SHA-256 `91a33bb21d9bcb2375ecabc87d5418ec0d08c5968e9200ac6cdfd2209afb8651`, with a separate private review signer. It embeds the stable public Site API/WebSocket URLs and an offline Hermes bundle. Expo Go, Metro and a shared Wi-Fi network are unnecessary. The current computer/services/tunnel still supply the backend and download, so this is a temporary internal review deployment.

Actual Android 16 emulator coverage: release APK installation, updated Arabic home, drawer/language switch, English catalog with live USD/SYP records, customer sign-in, authenticated Account/initials avatar and logout. Native map gestures, physical Android 10 devices, push, iOS and complete admin/business acceptance remain pending. The public instructions and APK HEAD returned 200, byte-range download returned 206, and a complete external download matched the tested artifact's size/hash. Untrusted direct origin access to the APK returned 404. Exact tools, signing, build caveats and coverage are in [Android preview verification](ANDROID_APK_PREVIEW.md). This does not close the existing submission/security gates or outstanding Word deliverables.

### Existing showcase data activation, 2026-11-24

The deployed runtime initially contained only the base seed (one store, two products, four listings and no reviews). Backed up the local review database, then ran the existing `backend` command `npm run db:seed:showcase` against the shared nonproduction `marketplace_dev` database. The source catalog, media sheets and history generators were used unchanged; no additional catalog data was authored.

The seed loaded all six repository showcase stores, 12 products, 24 listings across eight professional/four freelance profiles and 178 historical simulated-order reviews. Including the base data, the external API returned seven stores, 14 products and 28 listings. Verified every showcase title/price against its repository definition, all 27 public catalog images through the Site media route, all 178 reviews and all eight Arabic/English catalog pages. A read-only database check found zero unbalanced ledger journals. The existing APK uses this same updated API; no binary or Sites source redeployment was needed. This activates fictional review data and does not add release acceptance coverage.
