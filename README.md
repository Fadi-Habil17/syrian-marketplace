# Syrian Marketplace | السوق السوري

A B4F hackathon project for Syrian freelance services, local professional bookings/quotes and home-produced goods, with shared web/mobile contracts and simulated wallet/escrow payments. **Current increment: production-structured repository setup and design only.** Health/Swagger, worker heartbeat, bilingual setup screens and a metadata migration are available; business features are planned, not implemented.

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

Backend: NestJS 10, strict TypeScript, PostgreSQL 16, Prisma 6, JWT/Passport/bcrypt, class-validator, Swagger, Jest, Socket.IO. Frontend: Next.js 15, React 19, Tailwind CSS, Redux Toolkit. Mobile: React Native 0.81 / Expo SDK 54 / React 19.1 / TypeScript. Modular monolith with SOLID feature ownership; no live funds or official ShamCash Sandbox. PaymentGatewayProvider is a domain port prepared for a local simulator in the payment slice.

The [reference project](https://github.com/b4f-cohort8-salamiyah/b4f-board-final) informs module composition and server-only API access; its business logic is not copied. Inspection limitations and adaptations are in [system design](docs/SYSTEM_DESIGN.md).

## Project structure

```text
syrian-marketplace/
  backend/       Nest API, separate worker entry, Prisma foundation
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

Migration deployment uses `prisma migrate deploy`; seed is idempotent and writes only `SetupMetadata.phase=setup`. It does **not** create business users, wallets, orders or review logins. Full all-role/both-currency seed is a mandatory later release gate.

For future local schema development:

```powershell
npm run db:migrate:dev --workspace backend -- --name descriptive_change
npm run db:validate --workspace backend
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

Swagger routes are documentation infrastructure, not business resources. Future domains and all planned methods/paths are explicitly listed in [API conventions](docs/API_CONVENTIONS.md): Auth, Profiles, Geography, Catalog, Orders, Quotes, Payments, Delivery, Chat, Files, Disputes, Reviews, Notifications, Admin. No listed planned route is exposed now.

### Swagger documentation

`@nestjs/swagger` serves `/api/docs` and `/api/docs-json`; health response schema is documented. The generated [setup OpenAPI snapshot](docs/api/openapi.setup.json) contains only the health resource. Future controllers must include validated DTOs, bearer/session requirements, bodies, responses and main errors. Review/freeze each slice's OpenAPI and WebSocket events before connecting either client.

### Postman collection

Import [Postman Collection v2.1](docs/postman/syrian-marketplace.postman_collection.json). It covers every currently implemented REST resource (health), with an example response, `{{baseUrl}}` and blank `{{token}}`. Health is noauth; later authenticated examples inherit bearer auth. Add every new endpoint to its README-matching domain folder when implemented. No real token is committed.

## Verification

```powershell
npm run verify:setup
npm run typecheck
npm test
npm run build
npm run db:validate --workspace backend
```

Prisma validation requires DATABASE_URL from the backend template or local environment. CI uses an isolated test PostgreSQL database and applies the foundation migration/seed. Current Jest tests validate configuration safety, not missing domain features. Actual performed checks and limitations are recorded in [setup report](docs/SETUP_REPORT.md).

## Demo accounts

None yet: authentication and all-role demo seed are not implemented. Final submission must list **actual review-only usernames/passwords** for Customer, Freelancer, Professional, Store Owner, Delivery Driver and Admin, reproducible by the seed, including both currencies/scenarios. Never put production credentials here.

## Demo URL and mobile APK / Expo link

No hosted demo, public repository URL, APK or Expo review link has been created in this local setup increment. They remain required submission work as applicable; track them in [submission guide](docs/SUBMISSION_GUIDE.md). Do not submit the project with these placeholders.

## Known limitations and design navigation

No business features, live payment, login, admin, chat, push, domain migrations, full seed or automatic completion yet. Shell RTL is not proof of full future app parity. Database/containers/native runtime checks depend on local tools; SETUP_REPORT distinguishes performed and pending verification. Four bilingual Word deliverables are pending the actual team/final product; Markdown designs do not replace them. Remaining upstream dependency advisories and compatible security overrides are documented in [dependency security](docs/DEPENDENCY_SECURITY.md); this scaffold is not approved for production deployment.

- [Requirements checklist](docs/REQUIREMENTS_CHECKLIST.md), [business rules/defaults](docs/BUSINESS_RULES.md), [system design](docs/SYSTEM_DESIGN.md), [module boundaries](docs/MODULE_BOUNDARIES.md)
- [Data flow](docs/DATA_FLOW.md), [permissions](docs/PERMISSIONS_MATRIX.md), [order transitions](docs/ORDER_STATE_MACHINES.md), [ERD](docs/ERD.md)
- [API conventions](docs/API_CONVENTIONS.md), [implementation plan](docs/IMPLEMENTATION_PLAN.md), [submission guide](docs/SUBMISSION_GUIDE.md)
- [Permanent engineering rules](AGENTS.md), [all created files and verification](docs/SETUP_REPORT.md)
