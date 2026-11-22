# Database and API contract validation report

Evidence recorded 23 November 2026; PostgreSQL execution verified in the follow-up on the same date. This increment implements schema, migration files, development seed, internal financial persistence and transport contracts. It does not register business controllers, authentication or a WebSocket gateway; health remains the only live REST operation. The worker remains a heartbeat and the clients remain setup shells.

## Delivered model and policies

- 72 domain models plus the preserved SetupMetadata infrastructure table; 41 enums. Domain identifiers are PostgreSQL UUIDs. Every relation is explicit with RESTRICT history foreign keys and query/FK indexes. The generated Mermaid ERD includes all 72 domain models and their physical relations.
- Users, grants/sessions/restrictions, profiles/portfolios, Syrian geography, catalog/store/products, bookings/inspection/itemized quotes, order specializations/timeline/schedules/progress/submissions, inventory reservations/returns, wallets/journals/entries/escrow/allocations, delivery terms/assignments/proof, chats/files, cases/evidence/proposals, reviews/versions, notifications/outbox/jobs and audit.
- BIGINT/TypeScript bigint with JSON decimal strings; USD cents and SYP whole pounds, no conversion. Exact rounded one-third deposit/remainder and full store checkout are preserved. Backend snapshots commission at the first successful hold; explicit workspace zero overrides global zero/inheritance.
- PostgreSQL migrations define partial uniqueness, schedule exclusion, currency/ownership/amount consistency, immutable ledger/history, balance-maintenance triggers, balanced posting, settlement conservation and once-only installment/settlement references. All migration SQL has now executed successfully on real PostgreSQL 16.16. The seven integration tests exercise the financial/locking guards listed below; this is not exhaustive coverage of every constraint or business flow.
- Internal SERIALIZABLE financial commands coordinate holds/failures/retries, successful checkout stock reservation, disputes/freezing, eligible buyer/worker completion, assigned-admin allocation and stock reconciliation, with atomic audit/outbox/idempotency. No live ShamCash or network payment provider exists.

The original setup migration is unchanged. Three new ordered migrations add the generated domain schema, database invariants and policy guards. All four migrations were applied successfully to both isolated development and test databases. Prisma migrate status reports the development schema up to date.

The opt-in nonproduction seed defines six fictional role accounts, all with SYP and USD wallets, balanced simulated funding, global/workspace 0% rates, bilingual catalog, coverage/geography, unfunded freelance/professional requests, an itemized draft quote and store previews for both delivery methods. Reruns retain posted journals and existing account/stock state. The seed executed twice successfully on each isolated database. The development database contains exactly six users, six wallets per currency and twelve one-time SIMULATED_TOPUP journals after both runs; no duplicate funding was observed. These minimal fixtures do not demonstrate complete HTTP/upload/business workflows. Demo credentials are documented in README.

## API and shared types

OpenAPI 3.1.0 / JSON Schema 2020-12 defines 125 paths, 145 operations and 187 component schemas. Routes use /api/v1, JWT bearer authentication, operation-specific role/ownership permissions, structured errors, pagination/filtering/sorting, parent-order If-Match and Idempotency-Key rules. A registry preserves all 72 authored transition rows, including internal worker transitions and each actor, guard and effect. REST commands cannot select arbitrary order states or client-calculated holds/commission/settlement.

WebSocket versioned commands/events/acknowledgements, ticket/JWT handshake, participant/driver/admin projections, replay/refetch, revocation and push policy are specified separately. HTTP and WebSocket types are generated together into packages/contracts, with type-only consumers on web and mobile and deterministic drift checks. Postman v2.1 includes all 145 operations, clearly labelled contract-only except health.

## Actual verification

| Check                                                       | Local result                                                                                                |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Prisma format / validate                                    | Passed with Prisma 6.19.3; validation used a placeholder DATABASE_URL and did not connect to a database     |
| Prisma client generation                                    | Passed                                                                                                      |
| Generated domain migration vs current Prisma datamodel diff | Exact match; no SQL execution or shadow database involved                                                   |
| Redocly OpenAPI 3.1 lint plus contract invariants           | Passed: 145 operations, 187 schemas, 72 transition rows                                                     |
| Generated HTTP/WebSocket type drift                         | Passed                                                                                                      |
| Generated ERD drift                                         | Passed: all 72 domain models                                                                                |
| Workspace type checks                                       | Passed: backend, frontend, mobile, contracts and i18n                                                       |
| Strict standalone seed type check                           | Passed                                                                                                      |
| Jest unit tests                                             | Passed: 2 suites, 14 tests, including split/commission/conservation/invalid-allocation cases                |
| Backend and Next.js production build                        | Passed                                                                                                      |
| Setup verification                                          | Passed: 20 JSON documents parsed and 47 local Markdown links resolved at verification time                  |
| Offline npm install dry run                                 | Passed: lockfile/workspace resolution consistent                                                            |
| Formatting / Git whitespace checks                          | Passed: Prettier check and git diff --check                                                                 |
| Original source integrity                                   | Requirement Markdown and nine-page B4F PDF hashes unchanged                                                 |
| PostgreSQL migrations / seed / seed rerun                   | Passed: four migrations and seed twice on both marketplace_dev and marketplace_test, using PostgreSQL 16.16 |
| PostgreSQL integration tests                                | Passed: all seven tests against actual PostgreSQL, including competing keys/completion and dispute races    |
| CI PostgreSQL job                                           | Configured with PostgreSQL 16, migrations, seed twice and the real DB suite; remote execution not observed  |

The seven real PostgreSQL tests cover insufficient-funds retries, competing installment keys, unbalanced/direct balance rejection, currency/immutability/late-append rejection, competing completion, dispute versus completion, and workspace-switch commitments. All seven passed locally against the dedicated marketplace_test database. The initial run exposed raw row-lock serialization errors (PostgreSQL SQLSTATE 40001 via Prisma P2010); whole-transaction retry now handles 40001/40P01 alongside P2034/P2002, retaining the three-attempt limit. The suite passed after that correction. Migrations, seeded aggregate integrity and these particular concurrency scenarios are verified; other contract-only workflow combinations remain for future slices. Prisma validation alone does not establish these results.

The Prisma 6 package.json seed configuration emits an upstream deprecation warning for Prisma 7; the project stays on Prisma 6. Existing dependency/security limitations remain documented in DEPENDENCY_SECURITY.md; no claim of production security approval is made.

## Local environment diagnosis and observed state

The earlier unavailable report was based on missing psql/postgres commands in PATH and an unsuccessful Docker access check. A broader follow-up found native Windows service postgresql-x64-18 running, installed under C:/Program Files/PostgreSQL/18, and Docker Engine 29.3.1 accessible outside the sandbox. The native PostgreSQL installation and its databases were left untouched.

A separate persistent container syrian-marketplace-validation runs postgres:16-alpine (server 16.16), bound only to 127.0.0.1:15432, with named volume syrian_marketplace_validation_data. It owns marketplace_dev and marketplace_test. An ignored backend/.env now configures both URLs with generated local credentials; ignored tmp/postgres-validation.env contains the container environment. No credentials are committed or printed. Start it later with docker start syrian-marketplace-validation after Docker Desktop is running.

Direct read-only reconciliation in marketplace_dev found 73 domain/setup tables, 41 enum types, four successful migrations, zero unbalanced journals, zero account/ledger discrepancies and zero escrow/account discrepancies. Integration fixtures are confined to marketplace_test.

## Reproduce the database checks

Start PostgreSQL 16 with btree_gist available. Configure the development DATABASE_URL and a separate DATABASE_TEST_URL whose database name contains test or ci. Apply migrations and explicitly enable ALLOW_DEMO_SEED=true in a nonproduction environment. Apply/seed the dedicated test database as well before running db:test; do not point tests at development or production data.

```powershell
npm run db:generate
npm run db:validate --workspace backend
npm run db:migrate
npm run db:seed
npm run db:seed
# For the following commands DATABASE_URL must point at the dedicated test DB.
npm run db:migrate
npm run db:seed
npm run db:test
```

CI provides this isolated database automatically. No database reset is performed by the tests. Test fixtures use unique identities and remain in the disposable test database.

## Scope remaining after this increment

The local database verification blocker is resolved. Authentication, actual upload validation and authorization, business HTTP handlers, booking/quote agreement orchestration, immediate/mutual cancellation/refund orchestration, revisions, delivery dispatch/terms changes, durable deadline scheduling, notification/socket dispatch and web/mobile feature screens remain subsequent application slices. Their contracts and policies are defined; they are not claimed as delivered runtime features. The four final B4F Word deliverables, deployment/mobile artifacts and actual team roster remain tracked separately.

## New files in this increment

- `backend/prisma/migrations/20261123010000_domain_schema/migration.sql`
- `backend/prisma/migrations/20261123020000_domain_constraints/migration.sql`
- `backend/prisma/migrations/20261123030000_policy_guards/migration.sql`
- `backend/src/modules/payments/application/marketplace-finance.db.spec.ts`
- `backend/src/modules/payments/application/marketplace-finance.ts`
- `backend/src/modules/payments/domain/money.spec.ts`
- `backend/src/modules/payments/domain/money.ts`
- `backend/src/modules/payments/infrastructure/local-simulated-gateway.ts`
- `docs/DATABASE.md`
- `docs/DATABASE_CONTRACT_REPORT.md`
- `docs/api/WEBSOCKET_EVENTS.md`
- `docs/api/openapi.yaml`
- `docs/api/order-transitions.json`
- `frontend/src/lib/api/contracts.ts`
- `mobile/src/api/contracts.ts`
- `packages/contracts/src/generated/openapi.ts`
- `scripts/generate-contracts.mjs`
- `scripts/generate-erd.mjs`
- `scripts/generate-postman.mjs`
- `scripts/require-test-database.mjs`
- `scripts/validate-contracts.mjs`
