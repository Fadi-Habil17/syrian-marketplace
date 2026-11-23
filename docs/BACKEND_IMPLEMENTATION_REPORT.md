# Backend implementation and verification

This records the completed backend increment before the later partial mobile merge. See [mobile merge review](MOBILE_MERGE_REVIEW.md) for current client coverage; the backend test evidence below is historical to that increment.

This increment implements the NestJS backend. Web and mobile still have setup screens and shared generated contracts; their marketplace/admin screens, device push acceptance, deployment and B4F submission artifacts remain separate work. The original requirements and hackathon PDF are unchanged.

All **145 OpenAPI operations have actual registered Nest handlers**, verified by reflecting the running Nest module/controller table and comparing every method, path and operation ID with the canonical contract. This is registration coverage, not a claim that every possible branch has an acceptance test. No business endpoint returns a scaffold/mock response. Payments deliberately use the local simulator and actual PostgreSQL double-entry postings.

## Feature implementation

| Requested feature              | Runtime ownership / behavior                                                                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth and sessions              | AuthModule; bcrypt 12, verified-email flow, JWT access and rotating refresh families, reuse detection, reset/logout revocation                       |
| Users and roles                | UsersModule; customer capability plus one business grant, live session/role/restriction checks                                                       |
| Workspaces/profiles            | ProfilesModule; serialized eligibility checks, archive/reactivation, retained history, portfolios and service areas                                  |
| Geography/addresses            | GeographyModule; hierarchy validation, owned private addresses and serviceability                                                                    |
| Categories/listings/portfolios | CatalogModule and ProfilesModule; bilingual content, publication/moderation gates, scoped search and pagination                                      |
| Freelance                      | FreelanceModule; authoritative listing price and explicit two-party agreement                                                                        |
| Professional bookings          | BookingsModule/SchedulingModule; confirmed original or explicitly accepted alternate slot, PostgreSQL exclusion protection                           |
| Inspections/itemized quotes    | QuotesModule; scoped photos, free inspection agreement, immutable sent versions and calculated/approved total                                        |
| Stores/products                | StoresModule/ProductsModule; bilingual publishing, images, stock and single-store pricing                                                            |
| Inventory/reservations         | InventoryModule; sorted locks, reserve/consume/release and documented reusable/non-restockable reconciliation                                        |
| Orders/state machines          | OrderCoreModule/OrdersModule/OrdersReadModule; version checks, timeline, progress, readiness and gated submissions                                   |
| Simulated wallets              | WalletsModule/LedgerModule; separate SYP/USD accounts, own history, audited nonproduction simulator funding                                          |
| Payment gateway                | PaymentGatewayModule; injectable local simulator delegates real postings to LedgerPostingService                                                     |
| Escrow/immutable ledger        | EscrowModule/LedgerModule; liability lifecycle, balanced journals, immutable records and SQL invariants                                              |
| Commission/settlement          | SettlementModule/CommissionRatesModule; first-hold snapshot, workspace override including explicit zero, conserved once-only allocations             |
| Delivery/drivers               | DeliveryModule; coverage, one active assignment, race-safe acceptance, custody-aware reassignment, proof, fallback and approved fee delta            |
| Chat/attachments               | ChatModule/FilesModule; private order/delivery scopes, immutable messages, cross-transport deduplication and authorized downloads                    |
| Notifications                  | NotificationsModule and durable dispatcher; in-app records, own devices, Expo transport, retry/backoff and push receipt tracking                     |
| Reviews                        | ReviewsModule; completed-order buyer only, one edit in seven days, immutable versions and database rating cache                                      |
| Disputes                       | DisputesModule; frozen funds, per-party evidence windows/privacy, exact-version proposals, revisions and administrative resumption                   |
| Admin/audit                    | AdminModule; content inspection/moderation, restrictions, versioned rates/zones, assigned case decisions and immutable reasons/audit                 |
| Jobs/expiration                | JobsModule and separate worker entry; durable claims, retries, stale-job checks, 24/48/72h policies, scans/mail/outbox/push and attachment retention |

Controllers are thin adapters. Auth uses class-validator DTOs; other request DTOs are validated against their canonical OpenAPI 3.1 JSON Schema with AJV 8.20.0. Successful responses are projected/validated against the same schemas. Missing response data fails rather than being fabricated. Private fields are removed. JSON metadata explicitly declared as extensible remains intact.

## Persistence and operational behavior

- There are 72 domain models plus setup metadata. Nine forward migrations have been applied to both isolated local databases. Applied migrations were never edited. Prisma and the generated Mermaid ERD share one model source.
- Money is BIGINT stored units: SYP whole pounds, USD cents, JSON decimal strings. Services hold rounded one-third and the remainder; stores hold items plus delivery in full. A fee revision changes only its approved delta. There is no real ShamCash integration or currency conversion.
- SERIALIZABLE transactions lock participant users, then the order and owned resources/accounts, and retry serialization/unique-operation races. Order/version, inventory, money, idempotency, audit and outbox commit together. Permanent installment/settlement uniqueness supplements HTTP idempotency.
- Final-payment expiry retains the deposit and creates one frozen case. A separate resumption anchor and case FK preserve original readiness. Resumption requires the exact mutually accepted plan and assigned admin authorization; SQL checks the reference/approvals. It never creates another deposit.
- Cancellation proposals retain immutable stock-return snapshots. Mutual and administrative allocations conserve held money. Collected goods require explicit inventory reconciliation; driver custody cannot be silently released.
- Jobs persist deadlines in PostgreSQL. Unanswered requests/quotes expire at 72h, accepted unpaid agreements at 48h, store acceptance at 24h, final balance at 72h with 24/48h reminders, and evidence/proposal/review windows at 72h. A missed service due date offers extension/cancellation; an unassigned driver request escalates after two hours without automatic forfeiture.
- Automatic review completion requires funding, current proof/version, no open financial case or restriction and a unique settlement. Unproven physical handover goes to admin review. Worker retries do not reset timers or award money by default.
- Uploads use authenticated private S3 storage and real ClamAV INSTREAM scanning. Images are decoded/re-encoded with Sharp 0.35.5. MIME, extension, signatures, limits, archive names and authorization are checked; downloads reauthorize and verify the stored hash. Finals require balance funding; drivers lose grants on release/completion. Admins may inspect referenced unpublished catalog media with audit.
- Retention tombstones eligible private attachments after one year from terminal closure and uses an outbox deletion operation. Open cases act as a hold. Financial/audit records are not automatically deleted; the five-year minimum does not authorize destructive ledger cleanup.
- Socket.IO `/orders` accepts mobile access JWTs or one-use, order-scoped 60s tickets. Each command/event rechecks current grants; a periodic check removes revoked subscriptions. REST and sockets use the same chat service. Socket payments/state changes are unavailable.

## Actual local validation

The local environment includes a native PostgreSQL installation and a working Docker engine. Earlier sandbox connection failures were not proof that these services were absent. Validation used dedicated containers and volumes; the native database was not changed.

| Check                            | Evidence                                                                                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PostgreSQL                       | Actual PostgreSQL 16.16 container, loopback port 15432, separate marketplace_dev and marketplace_test databases                                                                                               |
| Storage/scanner                  | Authenticated SeaweedFS S3 on 19000 and healthy ClamAV on 13310; real uploads, reads, scans and downloads                                                                                                     |
| Migrations                       | All nine deployed to development and test databases                                                                                                                                                           |
| Seed                             | Development seed ran twice; test seed ran separately; all six roles, both currencies, actual scanned demo media; stable journals prevent repeated topups                                                      |
| Prisma/ERD/OpenAPI/types/Postman | Prisma validate passed; actual database/schema drift was empty; ERD matches 72 models; OpenAPI 3.1 validates 145 operations / 188 schemas / 75 transition rows; generated types and Postman coverage match    |
| Unit and integration checks      | 27 unit tests in six suites and 65 actual PostgreSQL integration tests in ten suites passed; final whole integration rerun passed after the dispatch-release assertion                                        |
| Runtime processes                | Compiled API and worker started; health, Swagger 3.1 (145 routes), seeded customer login and authorized wallets returned HTTP 200; worker batch started without failure; only these subprocesses were stopped |

Integration scenarios exercise registration/verification/refresh/reset/logout, permissions and profile lifecycle, publication/search, real file quarantine/scan, service entry, two-hold fulfillment, prestart/mutual refunds, delivery fee holds/refunds, stock returns, driver acceptance races/revocation, verified reviews, REST/socket deduplication, private evidence, early-admin rejection, expired evidence adjudication, final-payment resumption and proof-dependent automatic completion. Expiration tests create deliberately expired fixture timestamps while preserving PostgreSQL interval constraints; they do not claim to have waited 24/48/72 real hours. Financial integration tests also cover insufficient funds, rollback, immutability, duplicate operations and dispute/completion races.

## Contract clarifications filling implementation gaps

These are technical defaults, not changes to the required payment workflow:

1. Inspection photos can be staged as owner-only ORDER_SHARED files, then atomically claimed by the new request. Case evidence remains separately scoped. Pending custom quotes have nullable agreed total/due date until approval.
2. `mine=true` provides an authenticated management view of listings/stores/products; public queries continue hiding drafts and moderated content. Product sorting does not offer a nonexistent service delivery-duration field.
3. Browser ticket requests require orderId. Device registration accepts Expo tokens. Input fields requiring nonempty text also reject whitespace-only values. Admin moderation items include typed content inspection; own-account responses include current restrictions.
4. Cancellation/settlement DTOs include stock reconciliation where collected goods require it. An administrative driver award requires its explicit assignment ID.
5. Delivery rates provide a default 48-hour promise when a checkout preview is created. The preview lasts 15 minutes. Changed promises/fees require the approved terms-revision route. Ordinary rejection, cancellation, timeout and refund outcomes follow the authored state tables.
6. A password-authenticated suspended account can read its history and use controlled case/evidence channels. Refresh, ordinary writes, administrative powers and sockets remain blocked. Suspended participants cannot use mutual proposals to bypass frozen-fund review.
7. Admin-authorized payment resumption records actual resumption time and the governing case, with an exact mutually agreed future deadline no more than 72 hours away. Original readiness is preserved; obsolete reminder jobs no-op.
8. The referenced MinIO image could not be pulled. The S3 adapter remains provider-neutral; local Compose uses the tested authenticated [SeaweedFS image](https://github.com/seaweedfs/seaweedfs) and real ClamAV, pinned by digest. This changes infrastructure only.

## Practical limits and remaining release work

- Real-device Expo delivery and production email delivery were not exercised: no real Expo project/device credentials or production mail gateway were supplied. In-app delivery, token ownership, the local mail adapter and real socket transport were exercised. The [Expo adapter](https://docs.expo.dev/push-notifications/sending-notifications/) records acceptance separately from provider receipts; a ticket is not proof of device receipt.
- Remote GitHub Actions has not been observed for this increment. CI now defines actual PostgreSQL/S3/ClamAV services and the checks; configuration is not a claim of a successful remote run.
- In-memory rate limits assume one API instance (plus a trusted edge limit). Multi-instance load testing/distributed rate limits, backup-restore drills, production mail/push credentials, least-privileged database roles and deployment approval remain operational gates.
- Dependency audit is not clean. See [dependency security](DEPENDENCY_SECURITY.md) for exact current counts and reachable-surface assessment. Nest 10 is retained as requested; no SSE endpoint or affected file-type parser is used for uploads.
- Frontend/mobile business flows, native push permission/deep-link acceptance, full client admin parity and B4F roster/briefs/reviewer access remain pending. This backend increment is not a completed hackathon submission.

## Final verification record

Executed locally on 2026-11-23 against the actual isolated services:

| Command/check                                                   | Actual result                                                                                                                   |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`                                             | Passed for backend, frontend, mobile and shared packages                                                                        |
| `npm test`                                                      | 27 tests / six suites passed                                                                                                    |
| `npm run db:test`                                               | 65 tests / ten suites passed; final rerun 62.178 seconds, none skipped                                                          |
| `npm run build`                                                 | Nest compiled and Next.js production build succeeded                                                                            |
| `npm run db:validate --workspace backend`                       | Prisma 6.19.3 schema valid                                                                                                      |
| `prisma migrate status` in each database                        | Nine migrations, database up to date for development and test                                                                   |
| `prisma migrate diff` development DB to schema                  | No difference detected, exit 0                                                                                                  |
| `npm run db:seed:check --workspace backend`                     | Seed TypeScript compiled                                                                                                        |
| `npm run contracts:validate`                                    | OpenAPI 3.1 valid, 145 operations, 188 schemas, 75 transition rows; database/API enum and state-table consistency checks passed |
| `npm run contracts:check`, `npm run db:erd:check`               | Generated types and 72-model Mermaid ERD match their sources                                                                    |
| Postman coverage                                                | v2.1, all 145 method/path pairs match OpenAPI; blank token variables; compatibility copy identical                              |
| `npm run verify:setup`                                          | Required structure, JSON and local Markdown links passed                                                                        |
| `npm run format:check`, `git diff --check`                      | Passed                                                                                                                          |
| `docker compose --env-file <ignored local file> config --quiet` | Passed; no credentials printed                                                                                                  |
| Compiled API/worker smoke                                       | Actual HTTP 200 health, Swagger UI/JSON, seeded login and own wallets; real worker activation and initial batch without failure |
| Production dependency audit                                     | Nonzero: 22 nodes (18 moderate, four high), no critical; full tree 33 (three low, 23 moderate, seven high)                      |

A sandbox-only Prisma checksum fetch and a migration-status invocation from the root without DATABASE_URL initially failed. The successful results above used the correct backend environment and approved local service access. Initial dispatch-test enum typo was corrected to the actual READY job state; the complete final suite passed afterward. No migration, seed, database test or provider delivery is inferred from a scaffold. The source requirements/PDF have no Git diff. Repository artifacts are listed in [backend file inventory](BACKEND_FILE_INVENTORY.md).
