# Syrian Multi-Workspace Marketplace — MVP Requirements

**Revision 1.2 — first delivery scope and simulated payment policy.** This document supersedes the original PDF where the payment integration is concerned. The first delivery covers a responsive web platform and an iOS/Android app backed by one API.

## 1. Product scope

The platform serves all Syrian governorates and offers three workspaces:

| Workspace | What customers can do |
|---|---|
| Freelance | Find digital services, order work, track progress, communicate, fund the order in two payments, and receive final deliverables. |
| Professionals | Book fixed-price local services or request inspection and an itemized quote, then fund and track the job through completion. |
| Home Store | Browse home-produced goods, buy from a single seller per checkout, track preparation and delivery, and confirm receipt. |

The MVP includes accounts, business profiles and listings, order tracking, simulated payments and escrow, order chat, verified reviews, notifications, and admin moderation and dispute resolution. The Home Store supports seller delivery and a platform driver workflow. Both delivery methods are supported in the first delivery. Platform driver assignment is optional for each order.

## 2. Clients and API

- Web supports desktop and mobile browsers.
- The mobile app supports iOS and Android. Mobile order, payment, and chat notifications include push notifications.
- Web and mobile consume the same REST and WebSocket contracts. Order transitions, pricing, authorization, and payment rules execute on the backend.
- Both clients support Arabic RTL and English LTR. Listings and storefronts support Arabic and English content fields.
- The admin dashboard covers commissions, moderation, disputes, account restrictions, and audit history. Provide the admin dashboard on both web and mobile, with access to all listed administrative actions.
- The project owner will choose the technology stack separately. Keep architecture requirements technology-neutral until then.

## 3. Accounts and access

- Customers can browse all workspaces, purchase, request quotes, use their order chats, and review completed orders.
- Users register as customers or choose one business role. Business roles are Freelancer, Professional, Store Owner, and Delivery Driver. Each retains customer purchasing capabilities.
- A user may operate one business workspace at a time. The API enforces role, record ownership, active workspace, and order participation.
- Switching business workspace is automatic when there are zero active orders, open disputes, pending deliveries, or unsettled escrow balances. Archive the previous business profile and retain user identity, purchase history, completed orders, reviews, and audit records. Define which orders count toward the switch and how an archived profile can be reactivated.
- Admins moderate listings, storefronts, products, and profiles, suspend or restrict accounts, configure commission, and resolve disputes. Audit administrative, order, and financial transitions.

## 4. Freelance workflow

- Freelancer profile includes title, bio, skills, languages, and portfolio. Listings include bilingual titles and descriptions, category, delivery time, and a fixed SYP or USD price. Freelancers can create, edit, and deactivate listings.
- Customers filter by category, price, delivery time, and rating.
- Order flow is agreed order → initial payment held → work in progress → freelancer marks ready → final payment held → final file delivery → confirmation, dispute, or automatic completion.
- Work starts after the deposit is held. Final deliverables are released to the customer after the remaining payment is held. Include progress tracking and order chat. Milestones track progress only. Payments follow the two order-level holds.

## 5. Professionals workflow

- Profile includes trade, experience, location, service area, and portfolio. Professionals can list fixed-price service packages.
- **Fixed-price booking.** Customer selects a service package and creates a booking. The professional must accept the request and confirm its schedule before the order can proceed to the deposit. If the professional proposes a different slot, the buyer must accept it before paying.
- **Inspection and quote.** Customer submits a description, photos, and location. Professional reviews the request or performs an agreed inspection, then sends an itemized quote. Customer approval establishes the agreed price before the deposit.
- Quote flow starts at pending quote, then quote sent, then approved. Both paths converge at deposit payment, in progress with en route and on-site tracking, ready for final payment, fully funded, delivered, and completed. A rejected booking or quote closes without a charge. An unanswered booking or quote expires after 72 hours. Apply the payment and dispute rules in section 8.
- The 1/3 and 2/3 escrow rules apply. Final handover follows the second successful payment.

## 6. Home Store and delivery workflow

- Store owner manages a storefront with bilingual name and description, logo, and governorate/city. Products include bilingual details, category, photos, stock, and SYP or USD price.
- Customers browse the catalog or a storefront, filter by category and location, and check out from one seller at a time. The amount held at checkout includes items and the agreed delivery fee.
- Order flow is paid in escrow → seller accepts and prepares → ready for delivery → out for delivery → delivered → completed. Capture seller rejection, stock release, payment failure, and delivery exceptions in the transition table.
- The seller may deliver directly or request a platform driver when the order is ready. Eligible drivers see jobs in their assigned city/governorate, accept an assignment, report pickup and drop-off, and receive the designated delivery fee on completion. A delivery can have only one active driver assignment.
- Show the serviceable address, delivery method options, and delivery fee before payment. A seller may request a driver at checkout or dispatch when the order is ready. If those options change the total or promised delivery terms, obtain buyer approval before applying the change. If a driver is unavailable, offer seller delivery under the agreed terms, a buyer-approved reschedule, or a full refund if fulfillment is unavailable. Reserve stock atomically when checkout succeeds. Return reusable stock on cancellation and record any non-restockable quantities.

## 7. Simulated payments, escrow, and commissions

- The MVP uses a **local simulated payment provider** behind a `PaymentGatewayProvider` interface. Simulate wallet balances, insufficient funds, successful and failed payments, escrow holds, releases, refunds, payouts, and transaction references. Show the simulated status in test environments. Live funds and an official ShamCash Sandbox integration are outside this delivery.
- Freelance and Professionals hold 1/3 of the agreed total before work starts. When work is ready, hold the outstanding 2/3 before final handover. Release the held funds upon completion, subject to commission and any dispute resolution.
- Home Store holds the full total at checkout, then settles the order and any driver fee at completion. Support SYP and USD. Use one currency per order and checkout. Store USD in cents and SYP in whole pounds for the simulator. Round one-third to the nearest stored unit with half-up rounding and calculate the balance by subtraction. Reject service totals that would produce a zero-sized installment.
- Commission starts at 0%. The admin can configure global or workspace-level percentages. The workspace rate overrides the global rate when configured, including when it is 0%. Snapshot the rate at the first successful hold. Apply it only to the seller's awarded service or item amount, excluding refunds and delivery fees. Round commission once to the nearest stored unit, half-up.
- Starting from the recorded delivery time, customers have 72 hours to confirm completion or open a dispute. A background job completes eligible orders once the window expires. Disputes freeze funds, and admins can release funds or issue full or partial refunds. The seller submits digital deliverables or records on-site handover. The seller or assigned driver records physical delivery with pickup/drop-off history and proof. A physical delivery without documented proof requires buyer confirmation or admin review before settlement. Both parties may open a dispute after a hold and before settlement.
- Record payment and escrow changes with atomic database transactions and a ledger audit trail. Repeating a request or job must produce at most one financial effect. Process completion, payout, and dispute actions consistently under concurrent requests.

## 8. Cancellation, non-payment, and dispute policy

These rules apply to the local simulator across both clients. Show terms, timers, and the amount at risk before the buyer authorizes a hold. Use server timestamps for all deadlines and notify affected parties of actionable changes.

| Situation | Required outcome |
|---|---|
| Accepted service booking or quote awaiting deposit | Give the buyer 48 hours to fund it. On expiry, close it with zero charges and release any reserved slot. |
| Service deposit held, work has not started | Either party can cancel. Return the full amount held to the buyer's simulated wallet and release the reserved time. |
| Buyer requests cancellation after work starts | Freeze the held funds. Let both parties accept a documented full or partial refund proposal. If either rejects or no agreement is reached within 72 hours, route the case to admin review. |
| Provider cancels or misses the agreed deadline | Provider cancellation refunds the held amount unless an existing dispute or accepted settlement already governs it. For missed deadlines, offer an extension or cancellation. If the provider contests the refund based on work already completed or buyer-caused delays, freeze the funds for admin review. |
| Service marked ready and buyer has not funded the balance | Require documented readiness before opening a 72-hour payment window. Prompt at readiness and remind after 24 and 48 hours while payment is pending. On expiry, enter `FINAL_PAYMENT_OVERDUE`. Keep the deposit held and final deliverables gated. Either party may open a dispute, and the system creates an admin case on expiry if none exists. |
| Buyer disputes delivery or asks for changes | Suspend the completion timer and hold all funds. A mutually accepted revision plan returns the order to work and starts a fresh 72-hour review after resubmission. Unresolved cases go to admin. |
| Home Store seller declines or does not accept within 24 hours | Refund items and delivery in full and release stock reservations. A buyer may cancel for a full refund before seller acceptance. |
| Store accepted, preparation or delivery underway | Buyer cancellation is a request. Apply a mutually accepted split or route it to admin review. Seller cancellation or seller-caused nondelivery defaults to a full refund unless an existing dispute governs it. |
| Delivery confirmed, or review window expires on verified delivery | Settle once if funds are fully held and no case or revision is open. Show the release deadline to both parties. |

For disputes, notify both parties, give each 72 hours to submit evidence, and make the order timeline, chat, quote, payment references, and delivery proof available to authorized admins. The admin records a reason and the amounts awarded. Award the seller only for substantiated work or fulfillment against the agreed scope. Refund unused funds to the buyer. A missed balance payment never automatically forfeits the deposit or charges the unfunded remainder. Deduct platform commission from the awarded eligible seller amount. Pay a platform driver from the delivery fee when delivery is completed and documented. If the case involves failed or disputed delivery, let the admin decide allocation from that fee. A failure attributable to the seller or driver defaults to refunding the buyer's delivery fee. Allocate each held unit exactly once between refund, seller net, driver payout, and commission.

Treat these time limits as project defaults. The escrow decision and wallet movements must be atomic. Before auto-release, check disputed or paused status and eligibility in the same transaction. If a dispute is accepted before the settlement commits, settlement must not proceed. A completed order can generate a support case, but the original payout cannot be silently replayed or reversed.

### Policy references

Upwork provides examples of prefunding and a review period for fixed-price work. Fiverr provides examples of a three-day review period for digital delivery and cancellation or extension paths. The installment split, deadlines, and settlement rules above are specific to this project.

- [Upwork fixed-price payments](https://support.upwork.com/hc/en-us/articles/211063718-How-payments-for-milestones-and-fixed-price-contracts-work)
- [Fiverr order statuses and review period](https://help.fiverr.com/hc/en-us/articles/37552517993105-The-complete-guide-to-your-Fiverr-order-Statuses-and-process)

## 9. Shared features and security

- Use one geographic hierarchy for Syria, governorate, city or district, and neighborhood or area. Reuse it for seller profiles, driver assignments, and addresses.
- Create a private chat room for each order. Allow access to the buyer, seller/provider, assigned driver where applicable, and admins handling a dispute. Support text, images, and files with an immutable audit trail. Define driver access to order attachments and delivery details.
- Allow customers with completed orders to leave verified reviews with 1–5 stars. Define review limits and edit policy.
- Notify participants about relevant order changes, payment requests, and chat messages. Define additional channels and permissions for each client.
- Use Argon2 or bcrypt for passwords and JWT access/refresh tokens for web and mobile sessions. Authorize HTTP requests, WebSocket subscriptions, and downloads on the server.
- Validate uploaded MIME type, extension, and size on the server. Define file limits and storage before implementing uploads.

## 10. Implementation handoff for Codex

1. Produce an ERD, a role/ownership permission matrix, and a transition table per workspace. For each transition document initiator, preconditions, resulting state, and effects on escrow, inventory, and notifications.
2. Agree on an OpenAPI contract and document WebSocket events before connecting either client. Define HTTP errors, pagination, and payment retry semantics.
3. Implement end-to-end slices over the shared API. Start with authentication and listings, then order flows and simulated payments, then chat, delivery, disputes, reviews, and notifications. All three workspaces and the admin dashboard are required on web and mobile in the first delivery. Include seller delivery and optional platform driver assignment.
4. Include local setup instructions, example environment variables, database migrations, and seed data for every role and both currencies. Document how to run the web client, mobile app, API, and automatic-completion worker.
5. Turn the open decisions below into explicit rules before implementing their dependent behavior.

### Minimum acceptance scenarios

| Scenario | Expected outcome |
|---|---|
| Book a fixed-price trade service and approve a separate custom quote | Both paths enter the same funded service workflow from their agreed totals. |
| Fund a service order in two payments | Work begins after the first hold. Final delivery follows the second hold. Repeated payment requests do not duplicate holds. |
| Pay with insufficient simulated funds | The ledger balance and order state do not advance as if payment succeeded. |
| Store checkout and delivery | Only one seller is included. The order can be tracked on web and mobile through the selected delivery path. |
| Two drivers accept the same job | At most one assignment succeeds. |
| Buyer opens a dispute during the review window | Funds remain held until an admin decision. A concurrent completion job cannot produce an extra settlement. |
| No buyer action by the 72-hour deadline | The worker completes an eligible order and settles it once, including across retries. |
| User tries to switch workspaces with an active commitment | The switch is rejected. Once eligible, switching preserves past orders and audit records. |
| Another account requests an order chat or private deliverable | The API denies access. |
| Buyer misses the final payment deadline | No additional charge or automatic forfeiture. The deposit remains held and one admin case exists. |
| Provider declines a fixed-price booking | The buyer cannot fund it and the booking closes without charges. |
| Admin resolves a partial refund | Refund, seller net, driver payout, and commission sum to the held amount, and each ledger entry posts once. |
| Admin changes commission after the first hold | The order settles at its snapshotted rate. |
| Arabic and English on both clients | Layout direction changes correctly, and order state and currency agree across clients. |

## 11. Open decisions for the project owner

1. **Technology stack.** The project owner will provide the stack separately.
2. **Booking and logistics.** Choose the scheduling granularity, service-area rules, and who administers delivery-rate tables. The buyer must see the agreed total before funding.
3. **Account and catalog details.** Choose the sign-in method, verification rules, archived profile reactivation rules, required listing languages, and the source for Syrian geographic data.
4. **Operational limits.** Specify upload size limits, retention rules, and any notifications beyond in-app and mobile push.
