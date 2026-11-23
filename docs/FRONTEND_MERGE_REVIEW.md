# Frontend and combined branch merge review

Review date: 2026-11-23. The owner authorized inspection of new branches and merging reviewed changes into main. The initial fetch found feature/mobile at cd17bc9; a later fetch discovered frontend at 694cbd1. origin/mobile matched the original main and had no separate changes.

## Attribution and integration

The mobile contribution by nagham-jaza55 is preserved with its original commit. The web contribution by Molham alkaseer is preserved with its original commit. Review corrections and merge commits use the verified Fadi-Habil17 identity. No contributor history is squashed or rewritten and no remote branch is deleted.

The frontend was prepared on an isolated integration branch after the validated mobile merge. Conflicts were limited to the dependency lockfile and appended requirement-checklist sections. Both client sections are retained. The combined manifests include all new native dependencies plus frontend Socket.IO and ESLint; requested framework major versions and root overrides are retained. Prisma remains 6.19.3, Nest 10, Next 15, web React 19.1.10 and mobile React 19.1.0. Optional SWC entries are present for the locked Next version. Original requirements/PDF, backend business modules, Prisma schema/migrations and shared API contracts are unchanged.

## Findings and corrections

| Finding                                                                                             | Correction                                                                                                                                                                                             |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Concurrent web refresh actions could rotate the same credential twice and trigger family revocation | Server-only coordinator shares one in-flight result per hashed refresh credential and a five-second completed-result grace; failures are not cached, entries expire and capacity is bounded            |
| An old tab/form could submit its payload after the browser switched accounts                        | Public actor ID scopes/remounts client forms; server actions compare the captured expected subject to the actual authenticated user before writes/uploads. Backend authorization remains authoritative |
| HTTP 5xx and other uncertain command outcomes could discard the retry key                           | Preserve response status and retain the original command on transport/server failures, authentication uncertainty, throttling and in-progress/conflicting intents                                      |
| Malformed server-action params could throw before a controlled rejection                            | Validate params shape and positive versions before dispatch                                                                                                                                            |
| Mobile catalog used kind/search rather than the canonical workspace/q query parameters              | Typed query helpers use the canonical fields, with contract-driven tests and live API search/workspace checks                                                                                          |
| Mobile wallet displayed USD cents as if they were whole currency                                    | Format stored units using the existing money display helper; never calculate authoritative prices or allocations                                                                                       |
| Real integration tests retained Jest's five-second unit timeout                                     | Database harness now uses 30 seconds for PostgreSQL, bcrypt, S3 and antivirus scenarios; assertion/financial policies are unchanged                                                                    |
| CI omitted web registry/lint/tests                                                                  | Add the frontend checks alongside the mobile regression suite                                                                                                                                          |

The refresh coordinator assumes one Next.js server process for coalescing. A horizontally scaled deployment needs shared refresh coordination/BFF session storage and dedicated session-race acceptance. No raw JWT is returned by a generic browser mutation. JWT cookies remain HttpOnly, Secure in production, SameSite=Lax and host-scoped; socket access uses one-use order tickets. The actor ID is a UI safety binding and does not grant permissions.

## Actual combined validation

| Check                            | Actual result                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Combined TypeScript              | Passed for backend, frontend, mobile and shared packages                                                                                                                                                                              |
| Web ESLint and production build  | Passed; marketplace/member/admin routes compiled. Optional SWC metadata is complete and the final build has no lock-patch warning                                                                                                     |
| Frontend tests                   | 15 passed: contract, money/input handling, refresh concurrency and server-action account binding/status propagation                                                                                                                   |
| Mobile tests                     | 21 passed: session/checkout/socket adapters and canonical catalog queries                                                                                                                                                             |
| Backend unit tests               | 27 passed, six suites                                                                                                                                                                                                                 |
| PostgreSQL integration tests     | Final 65 passed, ten suites, 160.844 seconds; none skipped                                                                                                                                                                            |
| Final Android/iOS Hermes exports | Both passed on the combined tree, 1246/1248 modules; ignored outputs, not APK/IPA                                                                                                                                                     |
| Real web HTTP acceptance         | Compiled Next + Nest + marketplace_test: both locales/directions, anonymous member redirect, sign-in, HttpOnly/Secure/SameSite cookies, account/wallet/orders/workspace/inbox, customer rejection from admin, refresh and sign-out    |
| Role-scoped web pages            | Actual freelancer/professional/store-owner workspace, available/assigned driver pages and all five admin tabs rendered without server errors; bearer credentials absent from HTML                                                     |
| Mobile live transport            | Actual REST/PostgreSQL, mocked native storage: login/refresh/auth-me/wallets, workspace/search filters, server-priced store preview, restored command key/replay with one hold, full preaccept refund, logout and unauthorized denial |
| Canonical artifacts              | 145 operations / 188 schemas / 75 transitions valid; Postman and generated registries match; ERD matches 72 models; Prisma valid                                                                                                      |
| Repository checks                | Required structure/local links and whitespace checked; final formatting checked before commit                                                                                                                                         |

Total passing automated tests: **128** (27 backend unit + 65 database + 21 mobile + 15 frontend). Live HTTP checks are separate. Only the mobile native storage boundary is replaced by an isolated map; PostgreSQL, Nest, Next Server Actions and simulated financial postings are real. Test HTTP subprocesses were stopped after validation.

A parallel native-bundling run hit the five-second Jest default in two multi-request integration scenarios (63/65 passed). The harness now explicitly allows 30 seconds for real PostgreSQL/bcrypt/S3/antivirus work; the complete final rerun above passed. No assertions or business deadlines changed. Next's initial optional-SWC metadata repair encountered a registry timeout; complete entries were verified and the final production rebuild passed without that warning.

The latest successful production audit before adding frontend development tooling reported 27 nodes (20 moderate, seven high, no critical). A fresh combined-tree audit could not retrieve the npm advisory endpoint because the TLS connection disconnected. No clean or complete final audit is claimed; existing findings still require disposition before deployment.

## Remaining acceptance boundaries

- See [frontend API issues](FRONTEND_API_ISSUES.md): readable pending delivery-term revisions, public contact/directory completeness, admin ID lookup and other backend-contract gaps are still open. No replacement payment or delivery workflow was invented to hide a gap.
- See [mobile remaining work](MOBILE_API_ISSUES.md): seller/admin/case/file/delivery parity and other release-one workflows remain partial.
- Browser access host was unavailable during review. Web acceptance used the actual production HTTP server and rendered Server Action forms, not a GUI browser; there is no new visual/responsive/accessibility certification.
- Native SecureStore, push delivery/tap/revocation, permission restart behavior, APK/IPA builds, production mail/provider verification, deployment/load/backup checks and remote GitHub Actions remain unverified.
- Dependency audit findings remain unresolved. A successful merge or compile is not production approval or a completed B4F submission.
