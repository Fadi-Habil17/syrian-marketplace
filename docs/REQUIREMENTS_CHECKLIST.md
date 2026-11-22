# Requirements and submission checklist

Source of truth: complete `MARKETPLACE_REQUIREMENTS.md` revision 1.2, complete nine-page `B4F_HACKATHON_RULES.pdf`, and owner's stack/setup instruction. No source policy is optional unless explicitly labelled. All three workspaces, both clients/admin, both delivery paths and both locales belong to release one.

Status: **D/P** = designed, implementation and acceptance verification pending; **S** = setup artifact present, see `SETUP_REPORT.md` for actual checks; **P** = later deliverable pending; **O** = explicitly optional; **X** = explicitly outside release. A design is never counted as a running feature. Product rows include all clauses; A01-A14 separately retain every minimum scenario. Targets/defaults are distinguished in BUSINESS_RULES.

Document abbreviations: BR=`BUSINESS_RULES.md`, SD=`SYSTEM_DESIGN.md`, MB=`MODULE_BOUNDARIES.md`, DF=`DATA_FLOW.md`, PM=`PERMISSIONS_MATRIX.md`, SM=`ORDER_STATE_MACHINES.md`, ERD=`ERD.md`, API=`API_CONVENTIONS.md`, PLAN=`IMPLEMENTATION_PLAN.md`, SUB=`SUBMISSION_GUIDE.md`. All paths relative to `docs/`.

## Product, clients and identity

| ID   | Source          | Requirement                                                                                                                              | Design / delivery gate                                     | Status |
| ---- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------ |
| R001 | §1              | Serve all Syrian governorates with Freelance, Professionals and Home Store                                                               | BR scope/geography; PLAN 1-5                               | D/P    |
| R002 | §1              | Accounts, business profiles/listings, tracking, simulated escrow, order chat, verified reviews, notifications, admin moderation/disputes | SD/MB; PLAN 1-5                                            | D/P    |
| R003 | §1,6            | Seller delivery AND platform driver workflow; assignment optional per store order                                                        | BR D09-D10; SM store                                       | D/P    |
| R004 | §2              | Responsive desktop/mobile browser web and iOS/Android mobile                                                                             | SD; PLAN 5 device checks                                   | D/P    |
| R005 | §2              | Mobile push for order, payment and chat                                                                                                  | BR D18; API events; PLAN 5                                 | D/P    |
| R006 | §2              | Same REST/WebSocket contracts; backend owns transitions, pricing, authorization and payment                                              | MB/API/DF; per-slice contract gate                         | D/P    |
| R007 | §2              | Arabic RTL/English LTR on BOTH clients, bilingual listing/storefront content                                                             | BR D04; SD; A14                                            | D/P    |
| R008 | §2              | ALL admin commission/moderation/dispute/restriction/audit actions on web AND mobile                                                      | PM/API; PLAN 5                                             | D/P    |
| R009 | §2,11.1 + owner | Owner-selected stack resolves technology-neutral open decision                                                                           | SD; package manifests                                      | S      |
| R010 | §3              | Customer browse/purchase/quote/chat/completed-order review capabilities                                                                  | PM; PLAN 1-5                                               | D/P    |
| R011 | §3              | Register customer or one Freelancer/Professional/Store Owner/Driver role; all retain buying                                              | BR scope/D01; PM                                           | D/P    |
| R012 | §3              | One active business workspace; enforce role/ownership/active-workspace/participation                                                     | BR D02; PM; ERD constraints                                | D/P    |
| R013 | §3              | Automatic eligible switch only with zero active orders/open disputes/pending deliveries/unsettled escrow                                 | BR D02 defines counted buyer/seller/driver commitments; DF | D/P    |
| R014 | §3              | Archive previous profile; preserve identity/purchases/completions/reviews/audit; define reactivation                                     | BR D02; ERD; A08                                           | D/P    |
| R015 | §3              | Admin listing/storefront/product/profile moderation and suspension/restriction                                                           | BR D03; PM/API                                             | D/P    |
| R016 | §3              | Admin commission/dispute control and audit admin/order/financial transitions                                                             | DF/PM/ERD; PLAN 4-5                                        | D/P    |

## Workspace workflows

| ID   | Source | Requirement                                                                                                              | Design / delivery gate         | Status |
| ---- | ------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------ | ------ |
| R017 | §4     | Freelance title/bio/skills/languages/portfolio                                                                           | BR catalog; ERD; PLAN 1        | D/P    |
| R018 | §4     | Bilingual freelance listings/category/delivery time/fixed SYP or USD; create/edit/deactivate                             | BR D04; ERD/API                | D/P    |
| R019 | §4     | Freelance filters category/price/delivery time/rating                                                                    | API catalog; PLAN 1            | D/P    |
| R020 | §4     | Agreed order -> initial hold -> work -> ready -> final hold -> final files -> confirm/dispute/auto-complete              | SM freelance; A02              | D/P    |
| R021 | §4     | Start only after deposit; final file access only after remaining hold                                                    | BR service; DF/PM              | D/P    |
| R022 | §4     | Progress/chat; milestones track progress only, never milestone payments                                                  | BR/SM/ERD                      | D/P    |
| R023 | §5     | Professional trade/experience/location/service area/portfolio and fixed-price packages                                   | BR catalog; ERD                | D/P    |
| R024 | §5     | Booking provider acceptance AND schedule confirmation before deposit                                                     | SM professional entry; A01/A11 | D/P    |
| R025 | §5     | Buyer explicitly accepts provider's alternate slot before payment                                                        | BR D06; SM                     | D/P    |
| R026 | §5     | Inspection request description/photos/location; review/agreed inspection/itemized quote; buyer approval fixes total      | BR/SM/ERD; A01                 | D/P    |
| R027 | §5     | pending quote -> sent -> approved; both paths converge at deposit/work/en-route/on-site/ready/funded/delivered/completed | SM professional                | D/P    |
| R028 | §5     | Rejected booking/quote closes free; unanswered expires 72h                                                               | SM timers; A11                 | D/P    |
| R029 | §5     | Same 1/3 and 2/3 escrow and dispute rules; final handover after second successful hold                                   | BR/SM; A02                     | D/P    |
| R030 | §6     | Store bilingual name/description/logo/governorate/city                                                                   | BR/ERD; PLAN 1                 | D/P    |
| R031 | §6     | Bilingual products/category/photos/stock/SYP or USD; browse catalog/storefront/category/location                         | BR/API/ERD                     | D/P    |
| R032 | §6     | One seller per checkout; items and agreed delivery held                                                                  | BR/DF/SM; A04                  | D/P    |
| R033 | §6     | Paid escrow -> seller accepts/prepares -> ready -> out -> delivered -> completed                                         | SM store                       | D/P    |
| R034 | §6     | Transition table includes rejection/stock release/payment failure/delivery exceptions                                    | SM store/shared                | D/P    |
| R035 | §6     | Seller direct delivery or request driver when ready; eligible assigned-city/governorate jobs                             | BR D05/D10; PM                 | D/P    |
| R036 | §6     | Driver accept/pickup/drop-off/designated fee on completion; unique active assignment                                     | SM/ERD constraints; A05        | D/P    |
| R037 | §6     | Show serviceable address/method options/fee before payment                                                               | BR D09; DF                     | D/P    |
| R038 | §6     | Driver request at checkout or readiness; buyer approves changed total/promised terms first                               | BR D09; SM; API delivery       | D/P    |
| R039 | §6     | No driver: agreed seller delivery, buyer-approved reschedule, or full refund if unfulfillable                            | BR D10; SM exception           | D/P    |
| R040 | §6     | Atomic successful-checkout stock reserve; reusable return on cancel, record non-restockable units                        | DF/ERD/SM                      | D/P    |

## Payment, escrow, cancellation and disputes

| ID   | Source        | Requirement                                                                                                                  | Design / delivery gate                       | Status |
| ---- | ------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------ |
| R041 | §7            | Local simulated provider behind PaymentGatewayProvider                                                                       | Port scaffold; BR D13; PLAN 2 implementation | D/P    |
| R042 | §7            | Simulate balances, insufficient funds, successful/failed payments, holds/releases/refunds/payouts/references                 | BR/DF/API; A03                               | D/P    |
| R043 | §7            | Visible simulated status; no live funds or official ShamCash Sandbox                                                         | BR/SD; shell badges                          | D/P    |
| R044 | §7            | Services hold 1/3 before work and outstanding remainder before handover; release at completion subject to commission/case    | BR/SM                                        | D/P    |
| R045 | §7            | Store full checkout hold, completion settlement incl. driver fee                                                             | BR/SM/DF                                     | D/P    |
| R046 | §7            | Support SYP/USD, single currency order/checkout; USD cents, SYP whole pounds                                                 | BR D11; ERD                                  | D/P    |
| R047 | §7            | One-third half-up to stored unit; remainder by subtraction; reject zero installment                                          | BR D11 examples; PLAN arithmetic tests       | D/P    |
| R048 | §7            | Initial commission 0%; admin global/workspace; explicit workspace 0% overrides global                                        | BR D12; A13                                  | D/P    |
| R049 | §7            | Snapshot first successful hold; eligible seller award only; exclude refunds/delivery; round once half-up                     | BR/DF/ERD; A12/A13                           | D/P    |
| R050 | §7            | 72h from recorded delivery to confirm/dispute; worker completes eligible orders                                              | SM timers; A06/A07                           | D/P    |
| R051 | §7            | Disputes freeze; admin release/full/partial refund                                                                           | BR/SM; A12                                   | D/P    |
| R052 | §7            | Digital submission/on-site handover; seller/driver physical pickup/drop-off/proof                                            | BR D10; SM/ERD                               | D/P    |
| R053 | §7            | Unproven physical delivery requires buyer confirmation/admin review before settlement                                        | BR D10; SM                                   | D/P    |
| R054 | §7            | Either buyer or provider may dispute after a hold and before settlement                                                      | PM/SM                                        | D/P    |
| R055 | §7            | Atomic payment/escrow/ledger; repeat request/job at most one financial effect; concurrency consistent                        | DF/ERD; A02/A06/A07/A12                      | D/P    |
| R056 | §8 intro      | Terms/timers/amount at risk before hold; server deadlines; actionable notifications                                          | BR/API/SM                                    | D/P    |
| R057 | §8 table      | Accepted service has 48h to fund; expires free/releases slot                                                                 | SM timers                                    | D/P    |
| R058 | §8 table      | Deposit before work: either party cancels, full refund and slot release                                                      | SM shared                                    | D/P    |
| R059 | §8 table      | Buyer cancel after work: freeze, documented mutual full/partial split; rejection/no agreement at 72h -> admin                | BR/SM                                        | D/P    |
| R060 | §8 table      | Provider cancel refunds held unless existing case/accepted settlement governs                                                | SM shared                                    | D/P    |
| R061 | §8 table      | Missed deadline: extension/cancel; provider contests work or buyer delay -> freeze/admin                                     | SM shared                                    | D/P    |
| R062 | §8 table      | Document readiness before 72h balance window; prompt +24h/+48h reminders                                                     | BR D07; SM timers                            | D/P    |
| R063 | §8 table      | Balance expiry FINAL_PAYMENT_OVERDUE; keep deposit/gate finals; either dispute; one system admin case                        | SM; A10                                      | D/P    |
| R064 | §8 table      | Delivery dispute/change request pauses review/freezes all; mutual revision returns to work; new 72h after resubmission       | BR D08; SM                                   | D/P    |
| R065 | §8 table      | Store rejection/no accept at 24h refunds items+fee/releases stock; preaccept buyer full cancel                               | SM store                                     | D/P    |
| R066 | §8 table      | Accepted/preparing/delivering buyer cancellation requires mutual split/admin                                                 | SM shared                                    | D/P    |
| R067 | §8 table      | Seller cancellation/seller-caused nondelivery full refund unless existing dispute governs                                    | SM shared                                    | D/P    |
| R068 | §8 table      | Confirmed or 72h verified-delivery review expiry settles fully-held orders once, no case/revision; show deadline             | SM/DF                                        | D/P    |
| R069 | §8 dispute    | Both notified, 72h evidence each; authorized admins see timeline/chat/quote/references/proof                                 | BR D14; PM/ERD                               | D/P    |
| R070 | §8 dispute    | Admin reason/amounts, substantiated seller scope award, unused funds refunded                                                | BR/DF; A12                                   | D/P    |
| R071 | §8 dispute    | Missing balance never forfeits deposit or charges unfunded remainder                                                         | BR/SM; A10                                   | D/P    |
| R072 | §8 dispute    | Commission only eligible awarded seller amount; driver fee for documented complete delivery                                  | BR D12/D13                                   | D/P    |
| R073 | §8 dispute    | Failed/disputed delivery fee allocation by admin; seller/driver-caused failure defaults to buyer fee refund                  | BR D13; SM                                   | D/P    |
| R074 | §8 dispute    | Every held unit exactly once among refund/seller net/driver/commission (seller delivery included in seller payout)           | BR conservation; ERD; A12                    | D/P    |
| R075 | §8 final      | Default time limits, atomic decision/wallet movement; auto-release eligibility checked in transaction                        | DF/SM                                        | D/P    |
| R076 | §8 final      | Dispute accepted before settlement commit prevents release; completed payout cannot silently replay/reverse; support allowed | DF/SM; A06/A07                               | D/P    |
| R077 | §8 references | External examples informative only; project split/timers/settlement control                                                  | BR authority                                 | S      |

## Shared features and handoff

| ID   | Source     | Requirement                                                                                                                                        | Design / delivery gate                            | Status |
| ---- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------ |
| R078 | §9         | One Syria/governorate/city-or-district/area hierarchy reused profiles/drivers/addresses                                                            | BR D05; ERD                                       | D/P    |
| R079 | §9         | Private per-order chat for buyer/provider/assigned driver/handling admin; text/images/files, immutable audit                                       | BR D15; PM/API                                    | D/P    |
| R080 | §9         | Define driver access to attachments/details                                                                                                        | BR D15; PM delivery thread                        | S      |
| R081 | §9         | Completed-order verified buyer reviews, 1-5 stars; defined limits/edit policy                                                                      | BR D16; ERD                                       | D/P    |
| R082 | §9         | Relevant order/payment/chat notices; channels and client permissions defined                                                                       | BR D18; API                                       | D/P    |
| R083 | §9 + owner | bcrypt (owner choice) and JWT access/refresh for both clients                                                                                      | SD/PM; PLAN 1                                     | D/P    |
| R084 | §9         | Server authorization HTTP/sockets/downloads                                                                                                        | PM/API/DF; A09                                    | D/P    |
| R085 | §9         | Server MIME/extension/size validation; file limits/storage decided before upload implementation                                                    | BR D17; PM                                        | D/P    |
| R086 | §10.1      | ERD + role/ownership matrix + workspace transitions with actor/preconditions/state/escrow/inventory/notices                                        | ERD/PM/SM                                         | S      |
| R087 | §10.2      | OpenAPI agreement and WebSocket events before either client connects; errors/pagination/payment retry                                              | API; PLAN contract gate                           | D/P    |
| R088 | §10.3      | Vertical slices auth/listings -> orders/payments -> chat/delivery/disputes/reviews/notifications                                                   | PLAN                                              | S      |
| R089 | §10.3      | All workspaces/admin both clients, seller delivery and optional platform driver in first delivery                                                  | SD/PLAN; no deferral                              | D/P    |
| R090 | §10.4      | Local setup/env templates/migrations and seed for EVERY role and BOTH currencies                                                                   | README + foundation migration; full seed PLAN 1-6 | D/P    |
| R091 | §10.4      | Commands for web/mobile/API/automatic-completion worker                                                                                            | README; worker shell only; PLAN 4                 | D/P    |
| R092 | §10.5,11   | Resolve stack, booking/logistics/rate administration, sign-in/verification/reactivation/languages/geography, file/retention/notification decisions | BR D01-D19; SD stack                              | S      |

## Every minimum acceptance scenario

All pending executable feature verification. See PLAN A01-A14 for test approach.

| ID  | Requirement section 10 scenario                                        | Status |
| --- | ---------------------------------------------------------------------- | ------ |
| A01 | Fixed-price booking and separately approved custom quote converge      | D/P    |
| A02 | Two payments gate work/finals; retries do not duplicate holds          | D/P    |
| A03 | Insufficient funds do not advance balance/order                        | D/P    |
| A04 | One-seller checkout and selected delivery tracked on both clients      | D/P    |
| A05 | Two drivers race: at most one active assignment                        | D/P    |
| A06 | Dispute during review freezes funds against concurrent completion      | D/P    |
| A07 | Eligible 72h inactivity auto-settles exactly once across retries       | D/P    |
| A08 | Active commitment blocks switch; eligible switch preserves history     | D/P    |
| A09 | Another account cannot access private chat/deliverable                 | D/P    |
| A10 | Final nonpayment: no charge/forfeiture, deposit held, one admin case   | D/P    |
| A11 | Declined fixed booking cannot be funded and closes free                | D/P    |
| A12 | Partial refund allocations conserve held units and post once           | D/P    |
| A13 | Changed admin rate does not change order snapshot                      | D/P    |
| A14 | Arabic/English direction and consistent currency/state on both clients | D/P    |

## B4F submission rules, all pages

| ID   | PDF page | Requirement                                                                                         | Artifact / remaining gate                                       | Status |
| ---- | -------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------ |
| B001 | 1,4,9    | One repository contains complete Nest backend, Next frontend, React Native mobile                   | Exact roots scaffolded; full code PLAN 1-6                      | D/P    |
| B002 | 2,9      | Arabic Word project brief, required Arabic filename, max ONE page                                   | SUB filenames; real roster first                                | P      |
| B003 | 2,9      | English TeamName_ProjectBrief_EN.docx, max ONE page, same information                               | SUB                                                             | P      |
| B004 | 2        | Brief name/summary/problem/solution/audience/main features/tech                                     | SD source material; SUB document gate                           | P      |
| B005 | 2        | Brief every real member/name/role/main contribution/GitHub username                                 | Roster deferred by owner; no example members copied             | P      |
| B006 | 2        | Brief repository URL and demo link if available; contributions checked against Git                  | SUB + final actual history                                      | P      |
| B007 | 3,9      | Arabic and English Word analysis/design, prescribed filenames, each <=10 pages, preferably 4-5      | SUB; markdown designs are source, not these Word deliverables   | P      |
| B008 | 3        | Count diagrams within page limit                                                                    | SUB render/page-count QA                                        | P      |
| B009 | 3        | System overview goal/audience/problem/scope/out-of-scope                                            | SD; final Word export                                           | D/P    |
| B010 | 3        | Actors/user roles                                                                                   | PM/SD; final Word export                                        | D/P    |
| B011 | 3        | Functional requirements                                                                             | This checklist/BR; final Word export                            | D/P    |
| B012 | 3        | Nonfunctional security/performance/usability/reliability/response/maintainability as applicable     | SD D19; final Word export                                       | D/P    |
| B013 | 3        | At least THREE main use cases with short scenarios; use case diagram optional                       | SD three scenarios; final Word export                           | D/P    |
| B014 | 3        | High-level architecture diagram links Next/Nest/React Native/DB/external services                   | SD Mermaid; final Word rendering                                | D/P    |
| B015 | 3        | Database entities/relationships/PK/FK and ERD                                                       | ERD; final Word rendering                                       | D/P    |
| B016 | 3        | Authentication/authorization roles/hash/endpoint protection/input validation                        | SD/PM/API; final Word export                                    | D/P    |
| B017 | 3        | Business rules and main data flow optional in analysis document                                     | BR/DF prepared                                                  | O      |
| B018 | 4        | Exact root README.md/backend/frontend/mobile/docs/.gitignore                                        | Root setup                                                      | S      |
| B019 | 4        | Every member uses main GitHub account and appears as actual contributor                             | AGENTS; final team history check                                | P      |
| B020 | 4        | Git user.email linked to own primary GitHub; never one author for team work                         | Current configured contributor only; owner confirmation; AGENTS | S      |
| B021 | 4        | Avoid squash/history hiding; brief contributions match commits                                      | AGENTS; final team review                                       | P      |
| B022 | 4        | Public repo OR reviewer collaborator with code/contributor/history access                           | Not published; SUB                                              | P      |
| B023 | 5        | README overview/team/main features/stack/structure/prerequisites                                    | README present; roster pending                                  | D/P    |
| B024 | 5        | README env/install/backend/frontend/mobile run/db migration & seed                                  | README foundation commands; final feature seed pending          | D/P    |
| B025 | 5        | README API overview/Swagger/Postman                                                                 | README current vs planned; collection                           | S      |
| B026 | 5        | README demo accounts/demo URL/APK or Expo link/known limits                                         | Explicit pending sections; final actual artifacts needed        | D/P    |
| B027 | 5        | README each member name/role/contribution/GitHub matches brief and history                          | Roster deferred; SUB                                            | P      |
| B028 | 6        | Document actual Nest npm install/start:dev and project migration/seed commands                      | README workspace and per-folder commands                        | S      |
| B029 | 6        | Document Next npm install/dev                                                                       | README                                                          | S      |
| B030 | 6        | Document mobile npm install/Expo start or native Android                                            | README/mobile README                                            | S      |
| B031 | 6,9      | Provide APK OR Expo review link plus local instructions                                             | Not generated; SUB                                              | P      |
| B032 | 7,9      | Separate backend/frontend/mobile .env.example with ALL variables per part                           | Templates distinguish shell/future variables                    | S      |
| B033 | 7        | No actual secrets/real values in templates; browser NEXT_PUBLIC_, Expo EXPO_PUBLIC_ as needed       | Templates/.gitignore; final audit                               | S      |
| B034 | 7        | Never Git database passwords/JWT secrets/private keys/production API keys                           | AGENTS/.gitignore; final scan                                   | S      |
| B035 | 7,9      | Actual review-only demo login credentials incl. passwords in README when auth exists                | Auth not implemented; no fictional working accounts claimed     | P      |
| B036 | 7,9      | Repeatable demo account seed preferred (project requirement makes all-role/currency seed mandatory) | Foundation seed only; PLAN 1-6                                  | D/P    |
| B037 | 8        | README important endpoints grouped by domain with HTTP method/path; Swagger/Postman full detail     | README + API table; update every slice                          | S      |
| B038 | 8,9      | @nestjs/swagger at /api/docs                                                                        | Backend bootstrap                                               | S      |
| B039 | 8        | Swagger DTO/auth/body/response schemas and main errors                                              | Health schema now; domain schemas/errors pending                | D/P    |
| B040 | 8,9      | Postman Collection v2.1                                                                             | docs/postman/syrian-marketplace.postman_collection.json         | S      |
| B041 | 8        | Use {{baseUrl}}/{{token}} variables, no hardcoded values/secrets/tokens                             | Collection variable declarations and noauth health              | S      |
| B042 | 8        | Postman covers ALL backend endpoints incl. auth/body/examples                                       | Current health covered; future all-route gate                   | D/P    |
| B043 | 8        | Collection domain folders match README overview                                                     | Infrastructure now; API planned domain folders                  | S      |
| B044 | 9        | Submit four Word docs plus GitHub repository link                                                   | SUB                                                             | P      |
| B045 | 9        | Demo URL if available                                                                               | Deployment pending                                              | P      |
| B046 | 9        | Short demo video optional                                                                           | SUB                                                             | O      |
| B047 | 9        | Complete code and clear contributor history for ALL members                                         | Feature implementation/team contributions pending               | P      |
| B048 | 9        | Deadline Tuesday 24 November 2026, 16:00 Asia/Damascus                                              | SUB deadline and PLAN phase 6                                   | S      |

## Owner task and setup scope

| ID  | Requirement                                                                                             | Status                           |
| --- | ------------------------------------------------------------------------------------------------------- | -------------------------------- |
| T01 | Read both supplied files completely before designing; inspect accessible reference                      | S                                |
| T02 | NestJS 10/TS/PostgreSQL/Prisma/JWT/Passport/bcrypt/class-validator/Swagger/Jest                         | S                                |
| T03 | Next.js 15/React 19/TS/Tailwind/Redux Toolkit; React Native/Expo/TS                                     | S                                |
| T04 | REST + WebSockets, local simulated gateway/wallet/escrow/ledger, Modular Monolith/SOLID/feature modules | D/P                              |
| T05 | Exact required roots plus packages/README/AGENTS/.gitignore                                             | S                                |
| T06 | Create permanent AGENTS and all ten requested tracking/design documents                                 | S                                |
| T07 | Include complete first-release scope in design; no full business implementation yet                     | S                                |
| T08 | Exact source business policies; clearly documented defaults only for gaps                               | S                                |
| T09 | Prepare repository/root configuration; initial commit with current contributor identity only            | S                                |
| T10 | After completion list every created file and unresolved blockers                                        | SETUP_REPORT plus final response | S   |

Live funds and official ShamCash Sandbox: **X** per requirements §7. Optional video/use-case diagram/analysis business-rule section are never excuses to omit required code, admin surfaces, delivery methods, core diagrams or four Word files at final submission.

## Database and API contract increment (23 November 2026)

These are source/contract implementation statuses, not end-to-end release acceptance. Product rows above stay D/P until complete backend/client behavior and live PostgreSQL tests pass.

| ID    | Deliverable                                                                                                           | Status                                                                                          |
| ----- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| DB01  | 72 domain Prisma models / UUID identifiers / complete role and workspace relationships                                | Implemented; Prisma schema/client checked                                                       |
| DB02  | BIGINT currency-safe money, order specializations, financial journal/entry/escrow/allocation relationships            | Implemented; migrations applied on PostgreSQL 16.16                                             |
| DB03  | FK/query indexes, partial uniqueness, schedule exclusion, stock/geography/quote/review constraints                    | Applied; selected guards covered by real DB tests                                               |
| DB04  | Immutable balanced ledger, controlled balance updates, installment/settlement/adjustment uniqueness                   | Implemented; seven real PostgreSQL tests passed                                                 |
| DB05  | Atomic holds, failed-attempt idempotency, store reservations, freeze/dispute, completion and admin partial resolution | Internal commands implemented; selected financial/race tests passed; HTTP orchestration pending |
| DB06  | Nonproduction idempotent six-role/two-currency seed and README credentials                                            | Executed twice per dev/test DB; no duplicate topups observed                                    |
| DB07  | ERD generated from complete Prisma model                                                                              | Generated; drift command provided                                                               |
| API01 | OpenAPI 3.1, JWT, all release-one operations/DTOs/error schemas                                                       | Implemented and schema validated                                                                |
| API02 | Pagination/filter/sort, If-Match and Idempotency-Key conventions                                                      | Defined per operation                                                                           |
| API03 | Every source transition actor/guards/effects and per-operation permissions                                            | 72 transition rows linked to canonical state tables                                             |
| API04 | WebSocket event/command/ack and room/push/replay policy                                                               | Documented and typed in canonical contract                                                      |
| API05 | Generated HTTP/WebSocket types shared by web/mobile, drift checks                                                     | Implemented; clients remain unconnected to contract-only endpoints                              |
| API06 | Matching-domain Postman v2.1 for every target operation                                                               | Generated; only health is implemented at runtime                                                |

Actual results and untested boundaries are in [database/contract report](DATABASE_CONTRACT_REPORT.md).
