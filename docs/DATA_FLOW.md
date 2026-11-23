# Data flow and transaction design

These are full workflow contracts. Holds, dispute opening/freezing, eligible completion and admin financial resolution now have internal transaction-scoped persistence code; HTTP orchestration and other flow commands are not wired. A successful HTTP response identifies the committed aggregate version and operation. An event is emitted only from a committed outbox row. Clients refetch authorized state after events; a notification is not proof of payment.

## Agreement and two service holds

```mermaid
sequenceDiagram
  participant C as Buyer (web/mobile)
  participant A as Nest application
  participant DB as PostgreSQL
  participant G as Local gateway
  participant W as Outbox worker
  C->>A: Accept scope / confirmed slot / itemized quote
  A->>DB: Commit agreed total, terms, schedule and deposit deadline
  C->>A: POST deposit + Idempotency-Key
  A->>DB: Begin SERIALIZABLE; lock order, escrow, wallet
  A->>A: Recheck actor, status, timer, currency, split
  A->>G: Simulate hold within same unit of work
  G->>DB: Available -> escrow balanced journal
  A->>DB: Snapshot commission; order + attempt + audit + outbox + result
  DB-->>A: Commit
  A-->>C: Deposit held; work may begin
  W->>DB: Claim committed outbox
  W-->>C: In-app / socket / mobile push
  Note over C,A: Provider starts, tracks progress and documents readiness
  C->>A: POST balance + new Idempotency-Key
  A->>DB: Same checks and atomic remaining hold; fully funded
  Note over C,A: Only then provider hands over and authorized buyer can download finals
```

Failure path: insufficient balance or selected simulated failure commits a failed attempt/idempotency response with no posting, changed escrow, advanced state or slot forfeiture. Unexpected exception rolls back everything. Retrying the same key returns the same failure; a deliberate new attempt uses a new key. The unique order/installment operation prevents a second successful deposit/balance even with different request keys. The server never trusts a client amount or deadline.

## Store checkout and delivery

1. Read one seller's published catalog, verify stock, hierarchy/service area and currency; compute a versioned items/delivery quote. Show address, chosen method, total, terms and cancellation amounts.
2. Checkout with idempotency key and quote version. Lock order/stock/wallet in consistent order. Validate stock and quote freshness; hold full amount, reserve stock, snapshot price/rate/commission, create order/chat/timeline/outbox, persist result in one transaction. Stock cannot be oversold by competing checkouts. Gateway failure rolls back stock reservation.
3. Seller accepts within 24h and prepares. Worker refunds and releases stock if unaccepted at expiry. Buyer cancellation races with acceptance on the order lock; whichever valid transition commits determines the next allowed command.
4. When ready, use seller delivery or publish an eligible platform job. Driver acceptance locks delivery, checks current coverage/role, inserts one active assignment with partial uniqueness. A competing driver gets 409; only the assigned driver obtains delivery-thread/address/proof grants.
5. Pickup/drop-off events retain immutable history/proof. Different method/fee/terms require buyer-approved terms revision and explicit delta hold/refund; failure leaves old agreement intact. No driver triggers the documented seller/reschedule/refund choice.
6. Consume reservations on fulfilled stock. For cancellation, reconcile reusable returns and non-restockable quantities once; preserve history. Record deliveredAt; show release deadline. Verified delivery/explicit buyer confirmation unlocks settlement eligibility.

## Dispute versus completion

```mermaid
sequenceDiagram
  participant B as Buyer/provider
  participant J as Due worker
  participant O as Order coordinator
  participant D as PostgreSQL
  B->>O: Open dispute with operation key
  J->>O: Complete due order with stable job key
  O->>D: Each command locks same order row first
  Note over O,D: Serial order of commits is the authority
  alt Dispute commits first
    O->>D: Freeze escrow; case + 72h evidence deadlines + audit/outbox
    O->>D: Completion rechecks open case and exits without settlement
  else Valid settlement commits first
    O->>D: Fully held + proof/confirmation + due + no case/revision
    O->>D: Unique settlement journal + allocations + completed + outbox
    O-->>B: Dispute rejected as settled; support-case path offered
  end
```

Admin decision: lock case/order/escrow, reauthorize assigned admin, validate reason/evidence and all allocation components against held amount/currency; calculate commission once on awarded eligible amount; post one balanced journal to refund, seller net, seller-delivery or driver, and commission. Commit case resolution/settlement/state/audit/outbox/result together. Duplicate resolution reuses the journal. Revision approval may instead unfreeze to work, keeping holds, previous versions and gating policy.

## Jobs and notification delivery

Persist deadlines on agreement, readiness, seller acceptance window, delivery review and case creation. Worker polls due rows every 30s using `FOR UPDATE SKIP LOCKED` claims; claims are not eligibility checks. Owner module command locks/rechecks current state/time and posts financial changes once. Unique `(orderId, kind, deadlineVersion)` prevents duplicate reminder/admin-case effects. Crash after commit is safe on retry; expired lease allows another worker to claim unfinished work. Retry backoff caps at 15 minutes and dead-letter records alert an admin without changing financial outcomes.

Outbox delivery is at least once. Consumers keep event IDs; in-app records and push delivery attempts have unique deduplication keys. Transient push failures retry; invalid device tokens are disabled. A disconnected client fetches notifications/order versions through REST. No event payload carries private files or grants that outlive permission changes.

## Session, chat and file flow

Web server obtains/refreshes bearer credentials from HttpOnly session cookies; mobile obtains them from its authenticated secure session. Nest enforces current role/ownership/workspace/order participation. The socket handshake is authenticated and each room join repeats participation/restriction checks. Chat append commits immutable message, attachment metadata, audit and outbox, then sends an event. Access-class-specific queries prevent drivers reading service chat/finals. Uploads go to quarantine; scanning/metadata validation precedes publication. Download authorizes the actor, attachment class and funding/assignment/case state before streaming private bytes; an optional <=60s backend ticket is reauthorized on redemption and never exposes a direct private storage URL. File identifiers alone never grant access.

## Workspace switch flow

Lock user and membership/profile rows; query all buyer/seller/driver active orders, unresolved cases, pending delivery and unsettled financial obligations under the same serializable transaction. Reject with structured blockers if any exist; do not leak another actor's private data. Otherwise archive old profile, reactivate/create target, append audit/outbox and commit. Order creation and driver acceptance lock the same user/profile eligibility boundary so they cannot race a switch into an invalid commitment. Historical FKs never migrate to the new business profile.

## Implemented execution and recovery

HTTP and socket adapters call actual feature services. Canonical DTO validation precedes command execution; transaction-scoped guards reread the actor/session and ownership after participant locks. A rejection rolls the domain unit of work back; stable idempotent rejections are remembered separately. Successful effects, audit and outbox commit atomically. File/storage/scanner and outbound email/push I/O occur outside financial transactions.

The separate worker claims persisted rows with leases and SKIP LOCKED. It rechecks current deadlines/state/proof/cases under order locks; stale jobs no-op. Scan events process actual stored bytes; mail events contain authenticated encryption; notification creation and push tickets/receipts remain durable. API gateways hydrate published references per current recipient grants and do not broadcast raw outbox payloads.

Overdue balance resumption closes its governing case without allocating money, records a distinct actual anchor/case reference and exact mutual deadline, reopens escrow, and schedules new reminders/expiry. The deposit and original readiness remain intact. A revision retains old submissions and paid balance; resubmission opens a fresh 72-hour review.
