# Syrian Marketplace | السوق السوري

A B4F Syrian marketplace for freelance services, professional bookings/quotes and home-produced goods. **Current increment: implemented NestJS backend, 145 REST operations, authorized Socket.IO, PostgreSQL transactions and durable workers.** Payments are deliberately simulated with actual wallet/escrow/ledger records. The reviewed [Next.js web client](frontend/README.md) adds bilingual marketplace/admin workflows with [known API gaps](docs/FRONTEND_API_ISSUES.md). The [Expo mobile client](mobile/README.md) is partial; full client parity and release acceptance remain unfinished. See the [backend implementation and actual validation report](docs/BACKEND_IMPLEMENTATION_REPORT.md).

## Team members

The owner deferred the team name, full roster, primary roles, contributions and GitHub usernames. The original setup commit retains Mustafa Alshaar's attribution; subsequent backend/review work uses the verified repository-local Fadi-Habil17 identity. The mobile contribution retains its observed Git author nagham-jaza55, and the web contribution retains its author Molham alkaseer. This does not establish a team roster. No other contributors or GitHub usernames are inferred. Before submission, replace this paragraph with each real member's name, role, actual main contribution and primary GitHub username; match both Word briefs and Git history. Never copy the PDF's illustrative roster.

## Main features in release one

- Freelance listings, fixed-price agreements, progress-only milestones, two payment holds and gated final deliverables.
- Professional packages/bookings with confirmed schedules, inspections and approved itemized quotes; en-route/on-site tracking.
- Home Store single-seller checkout, stock, seller delivery and optional platform-driver assignment, pickup/drop-off proof.
- Customer/business roles, switching eligibility and preserved history; private order chat/files, verified reviews, in-app and mobile push notifications.
- Simulated SYP/USD wallets, escrow, refunds/payouts, immutable ledger, snapshotted commissions, disputes and automatic eligible completion.
- Arabic RTL and English LTR on web and iOS/Android, including the full admin dashboard for moderation, restrictions, commissions, disputes and audit history.

These are full-release deliverables. Backend implementation is mapped in the report; this list does not claim client acceptance or submission readiness. All exact policies and defaults are in [business rules](docs/BUSINESS_RULES.md); progress is in the [complete checklist](docs/REQUIREMENTS_CHECKLIST.md).

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

Node 22 LTS (>=22.13; Node 24 also allowed), npm 10 or 11 (lockfile generated using npm 11), Git; Docker Compose for local PostgreSQL, authenticated SeaweedFS S3 and ClamAV, or equivalent locally managed services. Expo-compatible development build/emulator or device for mobile; iOS native build/simulator needs macOS or EAS. Do not install a current default Expo SDK over the pinned SDK without coordinating React Native/React changes. Web React and Expo React are intentionally renderer-specific; respect nested workspace dependencies.

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

On a POSIX shell use the equivalent `cp` commands. Replace template markers with local values. Keep root Docker credentials and backend DATABASE_URL/storage credentials consistent. Local secrets remain ignored. The backend now requires PostgreSQL and configured JWT secrets. Uploads and the rich demo seed require the private S3 bucket and healthy ClamAV. Keep existing valid local environment files; copy templates only for a fresh setup.

## Environment variables

[backend/.env.example](backend/.env.example) contains placeholders only. Configure independent random JWT secrets (at least 32 characters), database URLs, trusted WEB_ORIGINS, matching private STORAGE credentials, CLAMAV_HOST/PORT and PAYMENT_PROVIDER=simulated. Access tokens last 15 minutes, refresh sessions 30 days and bcrypt uses cost 12. Root [.env.example](.env.example) configures Compose; its database/storage values must match the backend.

Development email verification/reset tokens are delivered to ignored `.local-data/mail` files. Production uses EMAIL_DELIVERY_URL/TOKEN and an independent EMAIL_OUTBOX_KEY; queued mail is encrypted. Set EXPO_PUSH_ENABLED=true only with a configured Expo project and registered real device tokens; EXPO_ACCESS_TOKEN is optional when required by the project. Push transport tracks provider tickets/receipts; in-app notices persist even if push is disabled or fails.

Frontend NEST_API_URL remains server-only; mobile EXPO_PUBLIC_API_URL/WS_URL contain public URLs only. Physical devices need a reachable development-machine address, and Android emulators usually use `10.0.2.2`. Never expose private storage or ClamAV ports publicly or put secrets in client environment variables.

## Database migration and seed

From root, with root `.env` populated:

```powershell
docker compose up -d --wait --wait-timeout 600 postgres storage clamav
npm run db:generate
npm run db:migrate
npm run db:seed
```

Migration deployment uses `prisma migrate deploy`. Set `ALLOW_DEMO_SEED=true` in backend/.env only for a dedicated nonproduction database before `db:seed`. The seed creates all roles, both currencies, wallets funded through balanced simulator journals and bilingual sample catalog/order requests. Stable operation keys prevent repeated seed topups. All nine migrations were applied to separate local PostgreSQL development/test databases. The richer seed ran twice in development and separately in test, including actual S3 objects and antivirus scans. See the current backend report for final test counts. Migration SQL generation/Prisma validation alone are not deployment evidence. See [database notes](docs/DATABASE.md).

Create the separate test database before running integration tests, for example `docker compose exec postgres createdb -U marketplace_local marketplace_test` (use your configured database user). Set DATABASE_TEST_URL to that database and apply migrations/seed there too. Never point test commands at production.

For subsequent schema development:

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

Separate root terminal: `npm run dev:frontend`. Per-folder equivalent: `cd frontend`, `npm install`, `npm run dev`. Open `http://localhost:3000` (redirects to `/ar`); English `/en`. These pages now include marketplace/customer/business/admin workflows; see [combined merge verification](docs/FRONTEND_MERGE_REVIEW.md) for actual tests and remaining limits. `npm run start --workspace frontend` serves a completed production build.

## Mobile setup and run

Separate root terminal: `npm run dev:mobile`. Per-folder equivalent: `cd mobile`, `npm install`, `npx expo start`. Use a compatible development build; Expo Go in the current store may target another SDK. Use `npm run android --workspace mobile` or `npm run ios --workspace mobile` with an available emulator/simulator. The partial Expo Router client includes session transport, browsing, basic requests/orders, checkout, text chat and selected driver/admin screens. Full workflows, native SecureStore/push/device acceptance and navigation RTL remain pending; see [mobile README](mobile/README.md) and [merge review](docs/MOBILE_MERGE_REVIEW.md).

## Durable background worker

Run `npm run worker:dev` in a separate terminal, or `npm run worker --workspace backend` after building. This is a real worker: persisted deadlines, atomic financial commands, file scans, encrypted email, outbox notifications, push delivery/receipts and retention. Keep it running alongside the API. Claims/retries are durable; restarting a process does not reset a financial deadline or authorize a second settlement. Operational behavior is in [data flow](docs/DATA_FLOW.md) and the backend report.

## Backend API overview

All 145 operations under `/api/v1` have registered handlers: auth/users/profiles, geography/catalog, freelance/bookings/quotes, storefronts/products/inventory, orders/payments/wallets, delivery/drivers, chat/files, cases/reviews/notifications and administration. [API conventions](docs/API_CONVENTIONS.md) contains the complete method/path inventory. Public catalog reads are anonymous; private actions use JWT plus backend role, ownership, workspace and restriction checks. Money and state are always calculated/validated by the backend.

### Swagger documentation

Open `http://localhost:4000/api/docs` or `/api/docs-json`. Runtime Swagger serves the canonical [OpenAPI 3.1 contract](docs/api/openapi.yaml), including DTOs, errors, security and permissions. `/api/v1/health` returns process liveness with phase=backend; it is not a database-readiness probe. [openapi.setup.json](docs/api/openapi.setup.json) remains a historical setup snapshot.

### Postman collection

Import [marketplace.postman_collection.json](docs/postman/marketplace.postman_collection.json), Collection v2.1, covering every endpoint. `{{baseUrl}}` defaults to `http://localhost:4000/api/v1`; `{{token}}` starts blank. Login/refresh can save local collection tokens. Fill resource IDs, current `{{orderVersion}}`, dates and an `{{idempotencyKey}}` for each new intent. Retry an identical intent with the same key. Refresh the order version after a mutation. Request examples are starting points, not an automatic end-to-end runner. The older collection filename is retained as an identical compatibility copy. Regenerate with `npm run contracts:postman`.

### WebSocket protocol

Socket.IO namespace `/orders` uses `command` with `{type,data}` and acknowledgement, and server `event` envelopes. Browser backends issue one-use 60-second order-scoped tickets; mobile uses access JWTs. [WebSocket events](docs/api/WEBSOCKET_EVENTS.md) specifies permissions, DTOs and replay/refetch behavior. Payments, refunds and state transitions remain explicit REST commands.

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

Prisma validation requires DATABASE_URL from the backend template or local environment. CI is configured with isolated PostgreSQL, applies all migrations, runs seed twice, and runs real PostgreSQL invariant/concurrency tests. This remote CI has not been claimed as run. Local unit tests cover policies, upload validation, DTO projection and money; database tests require DATABASE_TEST_URL and never count a missing database as success. Actual evidence is in the [current report](docs/BACKEND_IMPLEMENTATION_REPORT.md); the [setup report](docs/SETUP_REPORT.md) records the historical foundation.

## Demo accounts

Seed-defined fictional review accounts below all use **Marketplace123!** (bcrypt hashed in the database). Apply migrations and run the explicitly enabled seed first. They have been created in the isolated local marketplace_dev database. Login works at POST `/api/v1/auth/login` with email, password and client WEB/IOS/ANDROID. The seed is forbidden in production and requires explicit ALLOW_DEMO_SEED=true plus working local S3/ClamAV. Never use these credentials for production. Every account receives SYP and USD simulated wallets.

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

Backend business routes, financial transactions, private files/chat/sockets, administrative commands and durable jobs are implemented. Actual validation and limits are in the backend report. Native Expo delivery and a production mail gateway have not been verified with real credentials/devices; remote CI and deployment are not claimed. Web/mobile still show setup screens, and full marketplace/admin/RTL acceptance remains pending. Team details and four bilingual Word deliverables are also pending. See [submission guide](docs/SUBMISSION_GUIDE.md) and [dependency security](docs/DEPENDENCY_SECURITY.md); backend implementation is not production security or B4F submission approval.

- [Requirements checklist](docs/REQUIREMENTS_CHECKLIST.md), [business rules/defaults](docs/BUSINESS_RULES.md), [system design](docs/SYSTEM_DESIGN.md), [module boundaries](docs/MODULE_BOUNDARIES.md)
- [Data flow](docs/DATA_FLOW.md), [permissions](docs/PERMISSIONS_MATRIX.md), [order transitions](docs/ORDER_STATE_MACHINES.md), [ERD](docs/ERD.md)
- [API conventions](docs/API_CONVENTIONS.md), [implementation plan](docs/IMPLEMENTATION_PLAN.md), [submission guide](docs/SUBMISSION_GUIDE.md)
- [Permanent engineering rules](AGENTS.md), [all created files and verification](docs/SETUP_REPORT.md)

Database-only variables: `ALLOW_DEMO_SEED` (false by default, true explicitly for development seed), `DATABASE_TEST_URL` (separate test/CI database). See backend/.env.example. Use `npm run contracts:generate` before shared package builds if the contract changes.

## Validated local PostgreSQL instance

The follow-up environment check found native PostgreSQL 18 running and Docker available outside the sandbox. Validation used a separate PostgreSQL 16.16 container, `syrian-marketplace-validation`, on `127.0.0.1:15432`, with isolated `marketplace_dev` and `marketplace_test` databases. Existing native databases were not changed. Local credentials/URLs are configured only in ignored `backend/.env`; the named Docker volume retains this project's data. With Docker Desktop running, start the existing validation database/storage/scanner containers if needed, then `npm run db:test` to run the dedicated database tests. This workstation setup does not replace the fresh-clone environment/Compose instructions above.
