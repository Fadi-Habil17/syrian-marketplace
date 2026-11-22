# Database implementation and operating notes

Canonical model: `backend/prisma/schema.prisma`. The unchanged setup migration is followed by a generated 72-model domain migration, PostgreSQL-specific invariant migration and policy-guard migration. UUID defaults are generated in PostgreSQL; the legacy SetupMetadata key is the only non-UUID infrastructure primary key. The [ERD](ERD.md) is generated from Prisma's datamodel, not maintained independently. `LedgerJournal` is the financial transaction record and `LedgerEntry` is its immutable double-entry breakdown.

## Money and ledger

USD is stored in cents, SYP in whole pounds, using BIGINT. JSON transports decimal strings. Service deposit is half-up rounded one-third, balance is subtraction, minimum total 2 stored units; milestones never fund money. Store checkout holds all items plus the agreed delivery fee. One currency per account/order/journal; composite currency FKs and deferred checks reject mixed postings. Commissions use integer basis points: global starts at zero, nullable workspace scope means global, a configured workspace zero overrides global. Snapshot the selected version/rate at the first successful hold and never alter it later.

Accounts start at zero. Ledger-entry triggers maintain account balances and matching escrow held counters. Direct balance writes fail. Journals/entries are append-only, entries can only be appended in their journal's creating transaction, and deferred checks require at least two positive single-sided entries with equal debit/credit totals. Clearing accounts alone can be negative, representing fictional simulator funding. Journal operation keys never expire. Successful installment partial indexes prevent a second deposit/balance/full hold even with another client key; settlement order/journal uniqueness prevents a second payout.

Settlement allocation is exactly held amount = buyer refund + seller net + seller delivery award + driver payout + commission. Seller delivery and net can share an account, so journal credits are compared against grouped recipient totals. Commission is rounded once on the awarded service/item amount only. No commission on refunds/delivery. Unfunded balances cannot be allocated. Admin decisions require assigned admin, a reason/substantiation, and both parties' 72h evidence windows. Disputes lock the same order as completion and freeze escrow. A completed order may create a support case, never replay/reverse its original settlement.

Delivery terms revisions retain previous/new fee and a unique optional journal reference. Nonzero approved adjustments require exactly their matching signed delta hold/refund; no-fee changes have no money posting. Changing terms never creates another service installment. This revision infrastructure is implemented; the delivery negotiation application command is still a subsequent slice.

## Transaction boundaries

`MarketplaceFinance` contains internal application commands for deposit/balance/full checkout holds, dispute opening/freezing, eligible completion and admin partial/full resolution. `LocalSimulatedGateway` implements the backend-only PaymentGatewayProvider port with transaction-scoped postings and simulated references/failures. It performs no network calls. There is no real or official ShamCash adapter.

Use SERIALIZABLE transactions with at most three total attempts for serialization/operation-key races. Retry raw-query P2010 only for PostgreSQL SQLSTATE 40001/40P01, plus Prisma P2034/P2002; rerun the entire rolled-back transaction. Global lock order is participant User rows sorted by UUID -> order -> inventory/delivery/schedule resources -> ledger accounts sorted by UUID. Read the original immutable participants, lock, then reread order eligibility. This refines the earlier order-first proposal to serialize workspace switching with order creation; it changes no business policy. New-order/profile/assignment guards acquire the same participant eligibility lock. Existing-case acceptance and settlement serialize on the order row.

Persist order/version/timeline, journal/entries, successful or failed attempt, idempotency outcome, audit and outbox in the same transaction. A simulator failure records a failed attempt but posts no money, consumes no stock and does not advance the order. Reusing the same actor/route/key with another body fails. Reusing a successful installment with another key returns its original financial effect. Timeout clients retry the same key or query operation status. Completion rechecks funding, proof/confirmation, review deadline and open-case/paused status under lock. Admin cancellation/refund reconciles each reserved/consumed stock quantity once, including non-restockable units.

The persistence layer is not a complete application: authentication/controllers, booking/quote agreement commands, immediate and mutual cancellation orchestration, revision/resubmission, delivery dispatch/fee-change orchestration, notification dispatch and due-job scheduling still need their feature slices. Their policies are defined in the [state tables](ORDER_STATE_MACHINES.md) and [API contract](api/openapi.yaml). The heartbeat worker does not execute these jobs yet. Never call the gateway with a deserialized client posting/amount; only an authorized backend use case may construct its commands.

## Constraints and permissions

Prisma owns explicit relations, RESTRICT history FKs, enum fields, ordinary unique constraints and query/FK indexes. Custom SQL adds partial uniqueness, schedule exclusion via btree_gist, normalized email, hierarchy parent consistency, matching seller/currency/amount/quote totals, stock counters/returns, profile eligibility, one financial case and unique delivery assignment, immutable audit/chat/review versions and financial records, file limits, review window/rating, evidence parties and monetary conservation. Upload MIME checks in SQL validate metadata only; actual byte signatures, quarantine scanning and download authorization remain mandatory backend Files work.

Production must use a migration owner separate from a least-privileged application role. Triggers are not a defense against a database superuser who can disable them. PUBLIC update/delete privileges on immutable tables are revoked; application permissions must not include DDL, trigger disabling, ownership or arbitrary SQL execution. Backups and reconciliation must include journals, entries, allocations and immutable references.

## Run and validate

Copy/fill the environment templates and start local PostgreSQL before applying migrations. Use a dedicated development database. Do not use `prisma db push`, delete applied migrations or silently reset a database.

```powershell
npm run db:generate
npm run db:validate --workspace backend
npm run db:migrate
# In backend/.env set ALLOW_DEMO_SEED=true and NODE_ENV=development.
npm run db:seed
npm run db:erd
npm run db:erd:check
npm run contracts:validate
npm run contracts:generate
```

Use `npm run db:migrate:dev --workspace backend -- --name descriptive_change` for subsequent development changes, and deploy the reviewed SQL with `db:migrate:deploy`. Custom SQL features intentionally extend Prisma notation; retain their migrations rather than treating a datamodel-only diff as a complete drift check. The initial setup migration is preserved. All four migrations and two seed runs per database have now succeeded locally on isolated PostgreSQL 16.16, and all seven database tests passed; coverage and environment evidence are in [validation report](DATABASE_CONTRACT_REPORT.md).

## Development seed

The seed refuses production and requires `ALLOW_DEMO_SEED=true`. It creates all six roles, verified fictional accounts, active business profiles, the 14 governorates and a clearly labelled sample Salamiyah city/area, coverage/driver zone, portfolio/skills/language, bilingual listings/store/products and fees in both currencies, zero global commission and an explicit zero workspace override. Every user gets an SYP and USD wallet funded from simulator clearing using immutable balanced journals. Stable operation keys prevent double topups. Seeded orders are unfunded requests/previews, not evidence of completed feature workflows. It does not reset existing accounts, inventory or posted financial history on rerun. Account passwords are bcrypt hashed; plaintext credentials in README are fictional review credentials only. City/area data are curated demo facts, not an authoritative Syrian address database or a licensed imported dataset.
