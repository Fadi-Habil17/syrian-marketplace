# Syrian Marketplace | السوق السوري

A B4F hackathon project for Syrian freelance services, local professional bookings/quotes and home-produced goods, with shared web/mobile contracts and simulated wallet/escrow payments. **Current increment: database schema, migrations, fictional development seed and API contracts.** There are 72 domain models, guarded financial persistence and a complete OpenAPI 3.1 target contract. Only health/Swagger, the heartbeat worker and bilingual setup screens are wired; business HTTP/WebSocket handlers and client flows remain implementation work. See [current validation report](docs/DATABASE_CONTRACT_REPORT.md).

## Team members

The owner deferred the team name, full roster, primary roles, contributions and GitHub usernames. The initial setup commit uses the current contributor's configured identity, Mustafa Alshaar. No other contributors or GitHub usernames are inferred. Before submission, replace this paragraph with each real member's name, role, actual main contribution and primary GitHub username; match both Word briefs and Git history. Never copy the PDF's illustrative roster.

## Main features in release one

- Freelance listings, fixed-price agreements, progress-only milestones, two payment holds and gated final deliverables.
- Professional packages/bookings with confirmed schedules, inspections and approved itemized quotes; en-route/on-site tracking.
- Home Store single-seller checkout, stock, seller delivery and optional platform-driver assignment, pickup/drop-off proof.
- Customer/business roles, switching eligibility and preserved history; private order chat/files, verified reviews, in-app and mobile push notifications.
- Simulated SYP/USD wallets, escrow, refunds/payouts, immutable ledger, snapshotted commissions, disputes and automatic eligible completion.
- Arabic RTL and English LTR on web and iOS/Android, including the full admin dashboard for moderation, restrictions, commissions, disputes and audit history.

These are required deliverables, not a list of working features. All exact policies and defaults are in [business rules](docs/BUSINESS_RULES.md); progress is in the [complete checklist](docs/REQUIREMENTS_CHECKLIST.md).

## Tech stack and architecture

Backend: NestJS 10, strict TypeScript, PostgreSQL 16, Prisma 6, JWT/Passport/bcrypt, class-validator, Swagger, Jest, Socket.IO. Frontend: Next.js 15, React 19, Tailwind CSS, Redux Toolkit. Mobile: React Native 0.81 / Expo SDK 54 / React 19.1 / TypeScript. Modular monolith with SOLID feature ownership; no live funds or official ShamCash Sandbox. PaymentGatewayProvider has a local transaction-scoped simulator adapter; it performs no network or real-money payment.

The [reference project](https://github.com/b4f-cohort8-salamiyah/b4f-board-final) informs module composition and server-only API access; its business logic is not copied. Inspection limitations and adaptations are in [system design](docs/SYSTEM_DESIGN.md).

## Project structure

```text
syrian-marketplace/
  backend/       Nest API, separate worker entry, Prisma schema/migrations/seed
  frontend/      Next App Router web and future admin
  mobile/        Expo iOS/Android and future admin
  docs/          Design, checklist, API collection, submission handoff
  packages/      Shared transport types and Arabic/English messages
  scripts/       Setup verification
  .github/       CI checks
  AGENTS.md      Permanent engineering/contribution rules
  README.md
  .gitignore
```

## Prerequisites

Node 22 LTS (>=22.13; Node 24 also allowed), npm 10 or 11 (lockfile generated using npm 11), Git; Docker Compose for local PostgreSQL/MinIO, or equivalent locally managed services. Expo-compatible development build/emulator or device for mobile; iOS native build/simulator needs macOS or EAS. Do not install a current default Expo SDK over the pinned SDK without coordinating React Native/React changes. Web React and Expo React are intentionally renderer-specific; respect nested workspace dependencies.

## Installation

From a fresh clone, enter the repository root and run:

```powershell
npm ci
npm run build:packages
npm run verify:setup
```

`npm ci` uses the committed root lockfile. A contributor intentionally changing dependencies runs `npm install` at the root and commits the lockfile. npm workspace install from `backend/`, `frontend/` or `mobile/` also belongs to this root workspace; do not introduce nested lockfiles.

Copy environment templates (PowerShell):

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
Copy-Item mobile/.env.example mobile/.env
```

On a POSIX shell use the equivalent `cp` commands. Replace template markers with local values. Keep root Docker credentials and backend DATABASE_URL/storage credentials consistent. Local secrets remain ignored. The API/frontend shells do not require a database until running migration/seed or future domain slices.

## Environment variables

| File                               | Variables / purpose                                                                                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Root `.env`                        | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`; `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` for local Compose                                               |
| `backend/.env` active shell        | `NODE_ENV`, `PORT` (4000), `WEB_ORIGINS` comma-separated trusted origins, `PAYMENT_PROVIDER` (simulated only), `WORKER_POLL_MS` (30000)                                        |
| `backend/.env` database            | `DATABASE_URL` used by Prisma generate/validate/migrate/seed and future database adapter                                                                                       |
| `backend/.env` future sessions     | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL_SECONDS`, `JWT_REFRESH_TTL_SECONDS`, `BCRYPT_ROUNDS`; not consumed by a working auth feature yet                    |
| `backend/.env` future uploads/push | `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_FORCE_PATH_STYLE`, optional `EXPO_ACCESS_TOKEN`; adapters planned |
| `frontend/.env`                    | `NEST_API_URL` server-only base; future public `NEXT_PUBLIC_WS_URL` URL, never a secret                                                                                        |
| `mobile/.env`                      | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_WS_URL`, future `EXPO_PUBLIC_PROJECT_ID`; all public build-time values                                                                     |

Physical phones need the development machine's LAN address; Android emulator uses `10.0.2.2` instead of host `localhost`. Do not publish shared secrets using any public prefix. Storage bucket creation/quarantine/scan/push provider setup belongs to the corresponding future slice; MinIO service availability alone does not implement uploads.

## Database migration and seed

From root, with root `.env` populated:

```powershell
docker compose up -d postgres minio
npm run db:generate
npm run db:migrate
npm run db:seed
```

Migration deployment uses `prisma migrate deploy`. Set `ALLOW_DEMO_SEED=true` in backend/.env only for a dedicated nonproduction database before `db:seed`. The seed creates all roles, both currencies, wallets funded through balanced simulator journals and bilingual sample catalog/order requests. Stable operation keys prevent repeated seed topups. The four migrations and seed twice have now succeeded locally on isolated PostgreSQL 16.16 development/test databases; all seven real PostgreSQL tests passed. Migration SQL generation/Prisma validation alone are not deployment evidence. See [database notes](docs/DATABASE.md).

For future local schema development:

```powershell
npm run db:migrate:dev --workspace backend -- --name descriptive_change
npm run db:validate --workspace backend
npm run contracts:validate
npm run contracts:check
npm run db:erd:check
# With explicit isolated DATABASE_TEST_URL:
npm run db:test
```

Commit generated migration SQL and schema together. Do not use `db push` as deployment history. Bind local database/storage ports to loopback as Compose does; avoid destructive volume removal when data matters.

## Backend setup and run

In a terminal at root:

```powershell
npm run dev:backend
```

B4F per-folder equivalent after workspace installation/shared build:

```powershell
cd backend
npm install
npm run start:dev
```

API health: `http://localhost:4000/api/v1/health`. Swagger: `http://localhost:4000/api/docs`; JSON: `http://localhost:4000/api/docs-json`. Root `npm run build` builds shared packages, backend and web. Compiled API: `npm run start --workspace backend`.

## Frontend setup and run

Separate root terminal: `npm run dev:frontend`. Per-folder equivalent: `cd frontend`, `npm install`, `npm run dev`. Open `http://localhost:3000` (redirects to `/ar`); English `/en`. These are setup pages only. `npm run start --workspace frontend` serves a completed production build.

## Mobile setup and run

Separate root terminal: `npm run dev:mobile`. Per-folder equivalent: `cd mobile`, `npm install`, `npx expo start`. Use a compatible development build; Expo Go in the current store may target another SDK. Use `npm run android --workspace mobile` or `npm run ios --workspace mobile` with an available emulator/simulator. Native push, SecureStore, full navigation RTL and all business/admin screens are implementation work; see [mobile README](mobile/README.md).

## Automatic-completion worker

Separate root terminal: `npm run worker:dev`. Compiled: `npm run worker --workspace backend`. **The initial worker logs a heartbeat only.** Deadline/outbox/settlement commands will be added in phase 4. A running foundation worker does not automatically settle anything. It must ultimately process due deadlines and transactional outbox with durable claims/retries described in [data flow](docs/DATA_FLOW.md).

## Backend API overview

| Domain         | Implemented endpoint | Authentication | Result                                                |
| -------------- | -------------------- | -------------- | ----------------------------------------------------- |
| Infrastructure | GET `/api/v1/health` | Public         | Process liveness, phase=setup, simulatedPayments=true |

Swagger routes are documentation infrastructure, not business resources. Future domains and all planned methods/paths are explicitly listed in [API conventions](docs/API_CONVENTIONS.md): Auth, Profiles, Geography, Catalog, Orders, Quotes, Payments, Delivery, Chat, Files, Disputes, Reviews, Notifications, Admin. Only the health route is exposed now; the complete [OpenAPI 3.1 contract](docs/api/openapi.yaml) is the specification for the next slices.

### Swagger documentation

`@nestjs/swagger` serves `/api/docs` and `/api/docs-json`; health response schema is documented. The generated [setup OpenAPI snapshot](docs/api/openapi.setup.json) contains only the health resource. Future controllers must include validated DTOs, bearer/session requirements, bodies, responses and main errors. Review/freeze each slice's OpenAPI and WebSocket events before connecting either client.

### Postman collection

Import [Postman Collection v2.1](docs/postman/syrian-marketplace.postman_collection.json). It covers all 145 target operations in matching domain folders. Health is implemented/noauth; other requests are clearly labelled contract-only. Set `{{baseUrl}}`, blank `{{token}}`, resource IDs, `{{orderVersion}}` and `{{idempotencyKey}}` for a running slice. Reuse an idempotency key on timeout. Examples use fictional seed data; no real token is committed. Regenerate with `npm run contracts:postman`.

## Verification

```powershell
npm run verify:setup
npm run typecheck
npm test
npm run build
npm run db:validate --workspace backend
npm run contracts:validate
npm run contracts:check
npm run db:erd:check
# With explicit isolated DATABASE_TEST_URL:
npm run db:test
```

Prisma validation requires DATABASE_URL from the backend template or local environment. CI is configured with isolated PostgreSQL, applies all migrations, runs seed twice, and runs real PostgreSQL invariant/concurrency tests. This remote CI has not been claimed as run. Local unit tests check configuration and minor-unit arithmetic; database tests require DATABASE_TEST_URL and never count a missing database as success. Actual evidence is in the [current report](docs/DATABASE_CONTRACT_REPORT.md); the [setup report](docs/SETUP_REPORT.md) records the historical foundation.

## Demo accounts

Seed-defined fictional review accounts below all use **Marketplace123!** (bcrypt hashed in the database). Apply migrations and run the explicitly enabled seed first. They have been created in the isolated local marketplace_dev database. API login is not implemented; these are not currently working HTTP logins. Never use these credentials for production. Every account receives SYP and USD simulated wallets.

| Role            | Seed email                              |
| --------------- | --------------------------------------- |
| Customer        | `customer@demo.marketplace.test`        |
| Freelancer      | `freelancer@demo.marketplace.test`      |
| Professional    | `professional@demo.marketplace.test`    |
| Store Owner     | `store_owner@demo.marketplace.test`     |
| Delivery Driver | `delivery_driver@demo.marketplace.test` |
| Admin           | `admin@demo.marketplace.test`           |

## Demo URL and mobile APK / Expo link

Repository: [Fadi-Habil17/syrian-marketplace](https://github.com/Fadi-Habil17/syrian-marketplace). No hosted demo, APK or Expo review link has been created. They remain required submission work as applicable; track them in [submission guide](docs/SUBMISSION_GUIDE.md). Do not submit the project with these placeholders.

## Known limitations and design navigation

Domain schema, migrations, seed and internal financial persistence are implemented. Local migrations, seed reruns and the seven PostgreSQL integration tests passed; see the current validation report for coverage limits. No business HTTP/client features, live payment, login, admin UI, chat/push transport or automatic-completion scheduling are wired yet. Shell RTL is not proof of full future app parity. Database/containers/native runtime checks depend on local tools; SETUP_REPORT distinguishes performed and pending verification. Four bilingual Word deliverables are pending the actual team/final product; Markdown designs do not replace them. Remaining upstream dependency advisories and compatible security overrides are documented in [dependency security](docs/DEPENDENCY_SECURITY.md); this scaffold is not approved for production deployment.

- [Requirements checklist](docs/REQUIREMENTS_CHECKLIST.md), [business rules/defaults](docs/BUSINESS_RULES.md), [system design](docs/SYSTEM_DESIGN.md), [module boundaries](docs/MODULE_BOUNDARIES.md)
- [Data flow](docs/DATA_FLOW.md), [permissions](docs/PERMISSIONS_MATRIX.md), [order transitions](docs/ORDER_STATE_MACHINES.md), [ERD](docs/ERD.md)
- [API conventions](docs/API_CONVENTIONS.md), [implementation plan](docs/IMPLEMENTATION_PLAN.md), [submission guide](docs/SUBMISSION_GUIDE.md)
- [Permanent engineering rules](AGENTS.md), [all created files and verification](docs/SETUP_REPORT.md)

Database-only variables: `ALLOW_DEMO_SEED` (false by default, true explicitly for development seed), `DATABASE_TEST_URL` (separate test/CI database). See backend/.env.example. Use `npm run contracts:generate` before shared package builds if the contract changes.

## Validated local PostgreSQL instance

The follow-up environment check found native PostgreSQL 18 running and Docker available outside the sandbox. Validation used a separate PostgreSQL 16.16 container, `syrian-marketplace-validation`, on `127.0.0.1:15432`, with isolated `marketplace_dev` and `marketplace_test` databases. Existing native databases were not changed. Local credentials/URLs are configured only in ignored `backend/.env`; the named Docker volume retains this project's data. With Docker Desktop running, use `docker start syrian-marketplace-validation` if the container is stopped, then `npm run db:test` to run the dedicated database tests. This workstation setup does not replace the fresh-clone environment/Compose instructions above.
