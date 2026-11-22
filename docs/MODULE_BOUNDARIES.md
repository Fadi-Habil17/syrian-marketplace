# Module boundaries

Planned feature modules; the initial code only registers infrastructure/health. Read an exported query or invoke an exported command across a boundary. No cross-module direct table writes or client-computed policy. Within one database transaction, a coordinator passes a typed unit-of-work context to participants; participants own their invariants and repositories.

| Module           | Owns                                                                                                                          | Exports / allowed consumers                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Identity         | Users, credentials, sessions, verification, restrictions                                                                      | Authenticate/authorize actor; all transports                             |
| BusinessProfiles | Active/archived profiles, skills, languages, portfolio links                                                                  | Switch/reactivate and public profile query; catalog/orders/delivery      |
| Geography        | Country, governorate, city/district, area, zone validation                                                                    | Read/validate address and eligibility; profiles/catalog/delivery         |
| Catalog          | Freelance listings, professional packages, storefronts, products/categories, moderation visibility                            | Published snapshots and availability; orders/search/admin                |
| Scheduling       | Confirmed time reservations and inspections                                                                                   | Reserve/release/validate provider schedule; professional orders          |
| Orders           | Order aggregate, agreement snapshots, service/store specializations, progress/milestones, transitions, delivery review timers | Commands for all workflow mutations; REST/worker/disputes                |
| Quotes           | Inspection requests, quote versions/items and accept/reject                                                                   | Immutable approved offer; orders                                         |
| Inventory        | Product quantities/reservations/returns/nonrestockable reconciliation                                                         | Reserve/release/consume in transaction; store orders/catalog             |
| Payments         | Attempts, gateway adapter, idempotent hold requests, transaction references                                                   | Hold/refund commands coordinated with orders; no arbitrary client payout |
| WalletsLedger    | Currency accounts, journal/entries, available balance and reconciliation                                                      | Balanced posting/read balance under transaction; payments/escrow         |
| EscrowSettlement | Escrow liabilities, commission snapshot, resolution allocations, settlement uniqueness                                        | Fund/freeze/allocate/settle in order transaction; orders/disputes        |
| Delivery         | Service areas/rates, quoted terms, deliveries, assignments, pickup/drop-off proof                                             | Dispatch/accept/status/proof; store orders/drivers/admin                 |
| Disputes         | Financial cases, evidence, proposals, revision agreements, admin assignment/decision                                          | Open/freeze/resolve via coordinator; participants/admin/worker           |
| Chat             | Order rooms, delivery threads, immutable messages/attachment grants                                                           | Participant-filtered queries/send; authenticated transports              |
| Files            | Object metadata, access class, quarantine/scan/download grants/retention                                                      | Authorized upload/download; catalog/chat/orders/disputes                 |
| Reviews          | Completed-order verified review and immutable edits/moderation                                                                | Published review query/submit; catalog/buyer/admin                       |
| Commissions      | Global/workspace versioned rates                                                                                              | Effective rate lookup at first hold; escrow/admin                        |
| ModerationAdmin  | Restriction/moderation decisions and administrative command authorization                                                     | Orchestrate owner-module commands, never bypass ledger/state machine     |
| Audit            | Append-only actor/request/aggregate transition records and order timeline                                                     | Append in transaction; scoped admin history                              |
| Notifications    | In-app records, preferences, device push tokens, delivery attempts                                                            | User notification read/ack; outbox consumer                              |
| Realtime         | Authenticated socket subscriptions, ack/version and permission recheck                                                        | Publish sanitized committed events; no independent domain transitions    |
| JobsOutbox       | Durable scheduled work, event IDs, claims/retries                                                                             | Run owner-module commands after claims; API/worker                       |

## Dependency direction

Transport -> application -> domain ports <- infrastructure adapters. Shared contracts carry request/response/event schemas only. Domain rules do not import Next.js, React Native, Prisma or a provider SDK. Backend infrastructure wires ports to Prisma, storage and local simulator.

Orders coordinates Scheduling, Inventory, Payments, EscrowSettlement and Audit in one unit of work. Payments delegates postings to WalletsLedger; EscrowSettlement depends on Commissions lookup at first hold. Disputes coordinates Orders and EscrowSettlement rather than editing balances. Admin invokes the same validated commands. After commit, JobsOutbox invokes Notifications and Realtime. Those consumers cannot reopen a transaction to change its awarded money.

## Client ownership

`frontend/src/app` owns route composition; `frontend/src/lib/api` server-only transport; `frontend/src/lib/actions` authenticated mutations; `frontend/src/features` domain presentation; `frontend/src/store` UI state. Equivalent `mobile/src/features`, `api`, `store`, `i18n` consume the same contract and permissions, with secure native token storage and device push adapters. Both have full admin feature surfaces; hiding a control is never authorization.

`packages/contracts` may expose generated OpenAPI DTO/event types; `packages/i18n` owns shared message keys and ar/en strings. Neither imports backend internals. Any later shared validation must not become a duplicate client authority for order transitions or money.
