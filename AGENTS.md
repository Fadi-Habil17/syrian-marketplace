# Permanent engineering rules

## Authority and scope

1. Read `MARKETPLACE_REQUIREMENTS.md` completely and `B4F_HACKATHON_RULES.pdf` completely before changing product scope or submission policy. The requirements revision 1.2 controls simulated payments; the owner's specified stack resolves the technology decision. Never replace an explicit rule with a default.
2. Consult `docs/REQUIREMENTS_CHECKLIST.md`, `docs/BUSINESS_RULES.md`, and `docs/ORDER_STATE_MACHINES.md` before implementation. Mark requirements designed, implemented, and verified separately; a document or scaffold is not a delivered feature.
3. The foundation increment was setup only. The currently authorized increment implements database schema/migrations/seeds, transaction-safe financial persistence and API/WebSocket contracts. HTTP business controllers, authentication and client flows remain separate implementation slices. Never claim a contract or seed is a working endpoint.
4. Keep the exact root names `backend/`, `frontend/`, `mobile/`, `docs/`, `packages/`. Do not copy the reference repository's `api/` and `web/` names or its business logic.

## Architecture

- Modular monolith: NestJS 10, TypeScript strict mode, PostgreSQL, Prisma, REST and WebSockets. Next.js 15 / React 19 / Tailwind / Redux Toolkit for web; Expo / React Native / TypeScript for iOS and Android.
- Organize by feature with thin transport controllers, application use cases, domain policies, and infrastructure adapters. Follow SOLID; introduce abstractions at real module boundaries, especially `PaymentGatewayProvider`.
- Each feature owns its writes. Use exported application interfaces across modules, never another module's repository or internal Prisma queries. A transactional orchestration use case may coordinate module-owned financial/order operations through an explicit unit of work.
- Backend owns all authorization, pricing, deadlines, transitions, inventory, and money. Neither client is an authority. Share transport contracts and translations, never database models or secrets.
- Web REST passes through a server-only typed API client and Server Actions/route handlers. Use a short-lived, room-scoped backend-issued credential for browser WebSockets. Mobile uses the same backend contracts directly.
- Use Redux for scoped UI state. Do not persist tokens, private files, wallet balances, or authoritative order state in Redux persistence.

## Business and financial invariants

- All three workspaces, full admin actions on both clients, both delivery paths, both languages, and simulated payments are first-release requirements.
- One active business workspace per user; business users retain buying capabilities. Workspace switching is a transaction with the commitment checks in `BUSINESS_RULES.md`.
- Services use exactly two order-level holds (rounded 1/3, remainder by subtraction). Milestones never hold money. Gate work on deposit and final handover on balance.
- Use integer minor units (`BigInt` in PostgreSQL/application arithmetic, decimal strings in JSON). USD cents, SYP whole pounds; no floating-point money or currency conversion.
- Commission defaults to zero; explicit workspace zero overrides global. Snapshot at first successful hold. Exclude refunds and delivery fees from its base.
- All wallet, escrow, ledger, inventory, order-transition, idempotency, audit, and outbox changes in one atomic database transaction. Lock the order/financial records and recheck dispute eligibility before release. Retry serialization failures safely.
- Never forfeit a deposit or charge the unfunded balance after a missed final-payment deadline. Never silently reverse or replay a completed settlement.
- Private immutable ledger and audit trails; corrections are new records. Allocate every held unit exactly once. Driver assignment must be unique while active.

## Security and quality

- JWT access/rotating refresh sessions, Passport, bcrypt; server authorization by role, active workspace, ownership, participation, restriction, and dispute assignment. Reauthorize WebSocket room joins and file downloads.
- Validate DTOs and upload contents, MIME, extension, size, and authorization. Keep private files outside public web roots. Never log credentials, tokens, chat contents, or signed file URLs.
- Use Arabic RTL and English LTR, bilingual catalog fields, accessible labels and logical CSS properties. Test web and mobile parity, including admin and real devices for push.
- Freeze the OpenAPI and WebSocket contract for a slice before connecting either client. Update Swagger, Postman v2.1, the requirement checklist, and relevant docs with each delivered slice.
- Add meaningful tests for money conservation, timing boundaries, permissions, retries and races. PostgreSQL integration tests must verify actual constraints and locking; in-memory substitutes cannot prove them.
- Run `npm run verify:setup` for setup changes. Once dependencies are installed run type checks, backend Jest, builds, Prisma validation, and relevant integration checks. Report checks that could not run honestly.
- Migrations are reviewed SQL, committed with Prisma schema changes; seed fictional review data for every role and both currencies, never production data. Never modify an applied migration.
- Preserve reviewed compatible dependency overrides and rerun affected checks when changing them. Consult `docs/DEPENDENCY_SECURITY.md`; unresolved upstream findings require disposition before production. Do not introduce SSE or expose affected file parsers while their findings remain unresolved.
- Keep source documents unchanged. Record defaults explicitly and reconcile their impact before changing dependent behavior.

## Git and submission

- Commit only under the current contributor's own configured Git identity. Never invent teammates, impersonate authors, rewrite their history, or squash away contributor attribution. Verify effective author/committer before each commit.
- Never commit secrets, real passwords, generated build products, dependencies, private uploads, local databases, or `.env` files. Only clearly fictional demo credentials are permitted and must match an actual seed when implemented.
- Team roster, GitHub usernames and contributions must match actual history and the bilingual briefs. Do not substitute the PDF's example team for real people.
- Track all B4F deliverables and reviewer access in `docs/SUBMISSION_GUIDE.md`. Do not describe an unfinished release as submission-ready.
