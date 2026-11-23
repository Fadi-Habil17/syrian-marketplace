# API conventions and release-one contract

Canonical machine-readable contract: [OpenAPI 3.1](api/openapi.yaml). All 145 operations have registered NestJS handlers and implementation status `implemented`; the Nest reflection integration test compares every actual method/path/operation ID. Runtime Swagger at `/api/docs` and `/api/docs-json` serves this contract. Request DTOs use class-validator for identity and AJV 2020 JSON Schema validation for canonical DTOs, with strict unknown-field rejection and typed shared output. This does not imply every branch or client flow has an acceptance test; see [actual evidence](BACKEND_IMPLEMENTATION_REPORT.md). The setup JSON snapshot is historical.

## Routes, authorization and representation

All REST paths include `/api/v1`; server base has no duplicate version prefix. Production uses HTTPS. IDs are UUIDs; UTC RFC3339 timestamps and deadline comparisons come from the server. Arabic/English catalog fields are explicit; locale/layout never changes enum values, currency, money arithmetic or order state. Role grants, active business workspace, ownership, order participation, restrictions and handling-admin assignment are rechecked on every request, socket subscription and private download. Business users retain customer capabilities. Public queries return only published records with eligible active owners; hidden/private existence is not disclosed.

JWT bearer authentication uses Passport. Access lasts 15 minutes; refresh lasts 30 days, is hashed/rotated with session family/reuse detection and revoked on password/session/restriction changes. Web server actions retain credentials in HttpOnly/Secure/SameSite cookies with Origin/CSRF checks; the browser does not persist tokens in Redux. Mobile uses secure native refresh storage and in-memory access tokens. The same backend contract serves both. Registration never grants ADMIN. DTOs omit passwords/hashes, refresh tokens except auth responses, private storage keys and unrestricted raw metadata from ordinary resources.

Money uses `{currency: SYP|USD, units: decimal-string}`; USD cents and SYP pounds. No floats, conversion, mixed-currency checkout or buyer-supplied funding amounts. Prices/totals are capped at 9000000000000 stored units. Service deposit is half-up one-third, balance is subtraction; reject zero installments. Home Store funds items plus agreed delivery in full. Commission starts at zero; explicit workspace zero overrides global; snapshot at first successful hold; round once on eligible seller award excluding refunds/delivery. API commands cannot PATCH balances, escrow, commission snapshots or arbitrary order states.

## Responses, pagination, filtering and sorting

Resources return typed JSON directly. Lists return `{items,nextCursor}`; default limit 20, maximum 100. Cursors are opaque/signed, bind filters/sort/locale and use stable `(sort-key,id)` ordering. A cursor for other filters is INVALID_CURSOR. Allowed filters and sort values are enumerated per operation in YAML: listings support category, location, currency/price, delivery time and rating; products category/store/location/currency/price; stores location; orders workspace/state/participation; reviews stars/time. Validate unsupported query fields/limits and invalid ranges rather than silently accepting them. Search is bilingual, with server normalization. Clients never infer authorization or authoritative financial state from a sorted list or event.

Creation uses 201, async file quarantine 202, synchronous commands 200, empty removals 204. Mutating order/quote/delivery/case commands require `If-Match: "<parent order.version>"`; quote/terms versions are distinct immutable snapshots. Stale version is 409 VERSION_CONFLICT. Commands are intent routes, not arbitrary status setters. PATCH catalog DTOs are partial, require at least one property and are merged/validated by backend. Draft language fields may be incomplete; explicit publish commands require complete Arabic/English content and verified eligible owner. Existing order snapshots never change with later catalog edits.

Errors use `{error:{code,message,details:[{field?,code,message?}],requestId}}` without credentials, raw input, stack traces or private file URLs. HTTP groups: 400 invalid input/currency/installments/cursor/allocation; 401 missing/expired/revoked session; 403 permission/restriction; 404 inaccessible/not found; 409 state/version/stock/assignment/deadline/idempotency/case conflicts; 413/415 upload size/type; 422 insufficient simulated funds/provider failure/serviceability; 429 rate limit; 503 transient/configuration failure. The exact ErrorCode enum and per-status responses are canonical in YAML. Retry-After accompanies actionable retry states. The global exception filter maps domain, validation, authentication and database errors into this envelope; exhaustive branch coverage is tracked in TEST_REPORT.md.

## Idempotency and financial effect

Required Idempotency-Key is scoped to actor/route/key and bound to a canonical validated request hash. Keep HTTP outcomes at least seven days. Same key/body replays its original success or failure, even if the parent version subsequently changed. Different body with same key -> 409 IDEMPOTENCY_CONFLICT. In-progress duplicate -> 409 REQUEST_IN_PROGRESS with Retry-After. After a definite failure a deliberate new attempt uses a new key; after timeout reuse the same key or query operation status. Repeated successful installment with another key cannot hold twice. Permanent journal/hold/settlement operation keys and database uniqueness never expire with the HTTP cache.

Completion, payout, case opening and admin resolution lock the same order in SERIALIZABLE transactions and recheck all eligibility before commit. A committed accepted dispute prevents settlement; completed settlements cannot silently replay/reverse. Conservation applies to held funds only. Never forfeit the deposit or collect the unfunded balance on FINAL_PAYMENT_OVERDUE; preserve gating and create one admin case. Outbox/audit/order/inventory/idempotency/financial writes are atomic, and local simulated failure does not advance order/stock/balance.

## Workflow, timers and permissions

Every transition, actor, guard, escrow/inventory effect and notification obligation is in [order state machines](ORDER_STATE_MACHINES.md); the [machine-readable registry](api/order-transitions.json) retains every authored transition row with stable TR IDs. Operation `x-transition-ids` references that registry. The [permissions matrix](PERMISSIONS_MATRIX.md) supplements operation-specific `x-permissions`. Worker expiry/review transitions are internal capabilities and have no public arbitrary-completion endpoint.

Bookings require provider acceptance/confirmed original slot or buyer acceptance of alternate slot before deposit. Approved exact-version itemized quotes establish total and converge on the funded service workflow. Requests/quotes expire after 72h, accepted service deposit after 48h; readiness starts 72h balance window plus 24/48h reminders. Store acceptance has 24h. Reviews start at recorded delivery, 72h; physical delivery without proof needs explicit buyer confirmation or admin review. Disputes/revisions pause release; resubmission starts a fresh review. Each party receives 72h evidence. Accepted store/work-started cancellation is a request and cannot silently refund/award; before work/store acceptance use the specified full-refund path. A mutually accepted split or assigned admin reason governs partial awards. Driver failure defaults to delivery fee refund; admin exceptions require substantiation. Stock returns include non-restockable units.

Store preview creates an unfunded DRAFT, immutable price/delivery/address view and parent version; no stock is reserved. Its technical quote lifetime is 15 minutes (default D20). Successful `/orders/store-checkout` atomically funds full total/reserves stock. Buyer sees serviceability, options, fee and promised terms before authorizing. Changed delivery terms require explicit approval; an adjusted fee posts only its versioned delta hold/refund and preserves commission snapshot. No driver means seller under agreed terms, buyer-approved reschedule, or full refund if unfulfillable. Only one driver assignment is active.

## Files, WebSockets and shared types

Private Files requests enforce target ownership/access class, size/extension/MIME/magic bytes, quarantine/scan and fresh download authorization. Final files stay gated until full service funding; driver attachments are delivery-only, not private quote/service/case files. Max image 10 MiB, PDF 20 MiB, final ZIP 50 MiB; binary private downloads stream through backend, no direct private storage URLs. SQL checks metadata, not actual file content.

ZIP validation additionally limits expanded contents to 50 MiB per entry, 100 MiB total and 1,000 entries. Only stored/deflated, unencrypted entries with safe paths and valid sizes/checksums are accepted; symbolic links are rejected. Validation streams entries without writing extracted files. These resource defaults preserve the required 50 MiB compressed final-upload limit. Invalid archives return `UNSUPPORTED_MEDIA_TYPE` (415), before private persistence.

Socket.IO namespace `/orders` and full typed event/ack/permission/replay/push behavior are in [WebSocket events](api/WEBSOCKET_EVENTS.md). Canonical RealtimeEvent/RealtimeCommand/RealtimeAck components are generated with HTTP types. Events are committed-outbox, at least once, recipient projected; reconnect/refetch recovers gaps. REST remains the money/state mutation authority.

Run `npm run contracts:validate`, `contracts:generate`, `contracts:check` and `contracts:postman`. Generated `packages/contracts/src/generated/openapi.ts` exports paths/operations/components; package root exports ApiSchemas and Realtime types. Both frontend and mobile have type-only API imports from that same package. Generated types are committed and checked for drift; never duplicate DTO definitions or edit generated output. This provides compile-time types, not runtime authorization/validation. Backend controllers/services are implemented. Web/mobile business integration remains separate; generated types never replace backend authorization.

## Full operation inventory

All listed routes have actual registered handlers. Postman folders match these tags and carry status descriptions, blank token/ID/idempotency variables and fictional request examples. Use the running backend and seeded isolated accounts; populate current IDs, dates, parent version and keys. Postman examples are not an automated acceptance runner.

| Domain         | Method | Route                                                          | operationId                 |
| -------------- | ------ | -------------------------------------------------------------- | --------------------------- |
| Infrastructure | GET    | `/api/v1/health`                                               | `getHealth`                 |
| Auth           | POST   | `/api/v1/auth/register`                                        | `register`                  |
| Auth           | POST   | `/api/v1/auth/login`                                           | `login`                     |
| Auth           | POST   | `/api/v1/auth/refresh`                                         | `refreshSession`            |
| Auth           | POST   | `/api/v1/auth/verify-email`                                    | `verifyEmail`               |
| Auth           | POST   | `/api/v1/auth/forgot-password`                                 | `forgotPassword`            |
| Auth           | POST   | `/api/v1/auth/reset-password`                                  | `resetPassword`             |
| Auth           | POST   | `/api/v1/auth/logout`                                          | `logout`                    |
| Auth           | GET    | `/api/v1/auth/me`                                              | `getSessionUser`            |
| Profiles       | GET    | `/api/v1/me`                                                   | `getMe`                     |
| Profiles       | PATCH  | `/api/v1/me`                                                   | `updateMe`                  |
| Profiles       | GET    | `/api/v1/business-profiles`                                    | `listOwnBusinessProfiles`   |
| Profiles       | POST   | `/api/v1/business-profiles`                                    | `createBusinessProfile`     |
| Profiles       | PATCH  | `/api/v1/business-profiles/{profileId}`                        | `updateBusinessProfile`     |
| Profiles       | POST   | `/api/v1/business-profiles/switch`                             | `switchBusinessWorkspace`   |
| Profiles       | POST   | `/api/v1/business-profiles/{profileId}/reactivate`             | `reactivateBusinessProfile` |
| Profiles       | GET    | `/api/v1/profiles/{profileId}`                                 | `getPublicProfile`          |
| Profiles       | POST   | `/api/v1/business-profiles/{profileId}/portfolio`              | `createPortfolioItem`       |
| Profiles       | DELETE | `/api/v1/business-profiles/{profileId}/portfolio/{itemId}`     | `removePortfolioItem`       |
| Profiles       | GET    | `/api/v1/business-profiles/{profileId}/service-areas`          | `listServiceAreas`          |
| Profiles       | POST   | `/api/v1/business-profiles/{profileId}/service-areas`          | `addServiceArea`            |
| Profiles       | DELETE | `/api/v1/business-profiles/{profileId}/service-areas/{areaId}` | `removeServiceArea`         |
| Geography      | GET    | `/api/v1/geography/governorates`                               | `listGovernorates`          |
| Geography      | GET    | `/api/v1/geography/cities`                                     | `listCities`                |
| Geography      | GET    | `/api/v1/geography/areas`                                      | `listAreas`                 |
| Geography      | GET    | `/api/v1/me/addresses`                                         | `listAddresses`             |
| Geography      | POST   | `/api/v1/me/addresses`                                         | `createAddress`             |
| Geography      | PATCH  | `/api/v1/me/addresses/{addressId}`                             | `updateAddress`             |
| Geography      | DELETE | `/api/v1/me/addresses/{addressId}`                             | `archiveAddress`            |
| Catalog        | GET    | `/api/v1/categories`                                           | `listCategories`            |
| Catalog        | GET    | `/api/v1/listings`                                             | `listListings`              |
| Catalog        | POST   | `/api/v1/listings`                                             | `createListing`             |
| Catalog        | GET    | `/api/v1/listings/{listingId}`                                 | `getListing`                |
| Catalog        | PATCH  | `/api/v1/listings/{listingId}`                                 | `updateListing`             |
| Catalog        | POST   | `/api/v1/listings/{listingId}/publish`                         | `publishListing`            |
| Catalog        | POST   | `/api/v1/listings/{listingId}/deactivate`                      | `deactivateListing`         |
| Catalog        | GET    | `/api/v1/stores`                                               | `listStores`                |
| Catalog        | POST   | `/api/v1/stores`                                               | `createStore`               |
| Catalog        | GET    | `/api/v1/stores/{storeId}`                                     | `getStore`                  |
| Catalog        | PATCH  | `/api/v1/stores/{storeId}`                                     | `updateStore`               |
| Catalog        | POST   | `/api/v1/stores/{storeId}/publish`                             | `publishStore`              |
| Catalog        | POST   | `/api/v1/stores/{storeId}/deactivate`                          | `deactivateStore`           |
| Catalog        | GET    | `/api/v1/products`                                             | `listProducts`              |
| Catalog        | POST   | `/api/v1/products`                                             | `createProduct`             |
| Catalog        | GET    | `/api/v1/products/{productId}`                                 | `getProduct`                |
| Catalog        | PATCH  | `/api/v1/products/{productId}`                                 | `updateProduct`             |
| Catalog        | POST   | `/api/v1/products/{productId}/publish`                         | `publishProduct`            |
| Catalog        | POST   | `/api/v1/products/{productId}/deactivate`                      | `deactivateProduct`         |
| Catalog        | PATCH  | `/api/v1/products/{productId}/stock`                           | `setProductStock`           |
| Orders         | POST   | `/api/v1/orders/freelance`                                     | `createFreelanceOrder`      |
| Orders         | POST   | `/api/v1/orders/professional-bookings`                         | `createBooking`             |
| Orders         | POST   | `/api/v1/orders/inspection-requests`                           | `requestInspectionQuote`    |
| Orders         | POST   | `/api/v1/orders/store-preview`                                 | `previewStoreCheckout`      |
| Payments       | POST   | `/api/v1/orders/store-checkout`                                | `checkoutStore`             |
| Orders         | GET    | `/api/v1/orders`                                               | `listOrders`                |
| Orders         | GET    | `/api/v1/orders/{orderId}`                                     | `getOrder`                  |
| Orders         | GET    | `/api/v1/orders/{orderId}/timeline`                            | `getOrderTimeline`          |
| Orders         | GET    | `/api/v1/orders/{orderId}/actions`                             | `getAllowedOrderActions`    |
| Orders         | POST   | `/api/v1/orders/{orderId}/agree`                               | `agreeOrder`                |
| Orders         | POST   | `/api/v1/orders/{orderId}/accept-booking`                      | `acceptBooking`             |
| Orders         | POST   | `/api/v1/orders/{orderId}/propose-schedule`                    | `proposeSchedule`           |
| Orders         | POST   | `/api/v1/orders/{orderId}/accept-schedule`                     | `acceptSchedule`            |
| Orders         | POST   | `/api/v1/orders/{orderId}/reject`                              | `rejectOrder`               |
| Orders         | POST   | `/api/v1/orders/{orderId}/start`                               | `startWork`                 |
| Orders         | POST   | `/api/v1/orders/{orderId}/progress`                            | `recordProgress`            |
| Orders         | POST   | `/api/v1/orders/{orderId}/ready`                               | `markReady`                 |
| Orders         | POST   | `/api/v1/orders/{orderId}/deliver`                             | `deliverService`            |
| Orders         | POST   | `/api/v1/orders/{orderId}/confirm`                             | `confirmReceipt`            |
| Orders         | POST   | `/api/v1/orders/{orderId}/cancel`                              | `cancelOrder`               |
| Orders         | POST   | `/api/v1/orders/{orderId}/request-extension`                   | `requestExtension`          |
| Orders         | POST   | `/api/v1/orders/{orderId}/accept-extension`                    | `acceptExtension`           |
| Orders         | POST   | `/api/v1/orders/{orderId}/accept-store`                        | `acceptStoreOrder`          |
| Orders         | POST   | `/api/v1/orders/{orderId}/ready-for-delivery`                  | `markStoreReady`            |
| Orders         | POST   | `/api/v1/orders/{orderId}/delivery/request-driver`             | `requestPlatformDriver`     |
| Orders         | POST   | `/api/v1/orders/{orderId}/milestones`                          | `createMilestone`           |
| Orders         | GET    | `/api/v1/orders/{orderId}/milestones`                          | `listMilestones`            |
| Orders         | GET    | `/api/v1/orders/{orderId}/submissions`                         | `listSubmissions`           |
| Quotes         | GET    | `/api/v1/orders/{orderId}/quotes`                              | `listOrderQuotes`           |
| Quotes         | POST   | `/api/v1/orders/{orderId}/quotes`                              | `sendQuote`                 |
| Quotes         | POST   | `/api/v1/orders/{orderId}/inspection-schedule`                 | `agreeInspectionSchedule`   |
| Quotes         | POST   | `/api/v1/quotes/{quoteId}/approve`                             | `approveQuote`              |
| Quotes         | POST   | `/api/v1/quotes/{quoteId}/reject`                              | `rejectQuote`               |
| Payments       | GET    | `/api/v1/wallets`                                              | `listWallets`               |
| Payments       | GET    | `/api/v1/wallets/{currency}/transactions`                      | `listWalletTransactions`    |
| Payments       | GET    | `/api/v1/orders/{orderId}/payments`                            | `listOrderPayments`         |
| Payments       | GET    | `/api/v1/orders/{orderId}/settlement`                          | `getSettlement`             |
| Payments       | GET    | `/api/v1/operations/{operationId}`                             | `getOperation`              |
| Payments       | POST   | `/api/v1/orders/{orderId}/payments/deposit`                    | `holdDeposit`               |
| Payments       | POST   | `/api/v1/orders/{orderId}/payments/balance`                    | `holdBalance`               |
| Delivery       | GET    | `/api/v1/delivery-options`                                     | `getDeliveryOptions`        |
| Delivery       | GET    | `/api/v1/driver/jobs`                                          | `listDriverJobs`            |
| Delivery       | GET    | `/api/v1/driver/assignments`                                   | `listDriverAssignments`     |
| Delivery       | GET    | `/api/v1/deliveries/{deliveryId}`                              | `getDelivery`               |
| Delivery       | POST   | `/api/v1/deliveries/{deliveryId}/accept`                       | `acceptDeliveryJob`         |
| Delivery       | POST   | `/api/v1/deliveries/{deliveryId}/release-assignment`           | `releaseDriverAssignment`   |
| Delivery       | POST   | `/api/v1/deliveries/{deliveryId}/pickup`                       | `recordPickup`              |
| Delivery       | POST   | `/api/v1/deliveries/{deliveryId}/dropoff`                      | `recordDropoff`             |
| Delivery       | POST   | `/api/v1/deliveries/{deliveryId}/exception`                    | `reportDeliveryException`   |
| Delivery       | POST   | `/api/v1/deliveries/{deliveryId}/fallback`                     | `chooseDeliveryFallback`    |
| Delivery       | POST   | `/api/v1/deliveries/{deliveryId}/terms`                        | `proposeDeliveryTerms`      |
| Delivery       | POST   | `/api/v1/deliveries/{deliveryId}/terms/{revisionId}/approve`   | `approveDeliveryTerms`      |
| Chat           | GET    | `/api/v1/orders/{orderId}/chat-rooms`                          | `getOrderRooms`             |
| Chat           | GET    | `/api/v1/orders/{orderId}/messages`                            | `listMessages`              |
| Chat           | POST   | `/api/v1/orders/{orderId}/messages`                            | `sendMessage`               |
| Files          | POST   | `/api/v1/files/uploads`                                        | `uploadFile`                |
| Files          | GET    | `/api/v1/files/{fileId}/status`                                | `getFileStatus`             |
| Files          | GET    | `/api/v1/files/{fileId}/download`                              | `downloadFile`              |
| Disputes       | GET    | `/api/v1/orders/{orderId}/cases`                               | `listOrderCases`            |
| Disputes       | POST   | `/api/v1/orders/{orderId}/cases`                               | `openCase`                  |
| Disputes       | GET    | `/api/v1/cases/{caseId}`                                       | `getCase`                   |
| Disputes       | POST   | `/api/v1/cases/{caseId}/evidence`                              | `submitEvidence`            |
| Disputes       | GET    | `/api/v1/cases/{caseId}/evidence`                              | `listEvidence`              |
| Disputes       | GET    | `/api/v1/cases/{caseId}/proposals`                             | `listProposals`             |
| Disputes       | POST   | `/api/v1/cases/{caseId}/proposals`                             | `proposeResolution`         |
| Disputes       | POST   | `/api/v1/cases/{caseId}/proposals/{proposalId}/accept`         | `acceptResolutionProposal`  |
| Disputes       | POST   | `/api/v1/cases/{caseId}/proposals/{proposalId}/reject`         | `rejectResolutionProposal`  |
| Disputes       | POST   | `/api/v1/cases/{caseId}/revisions/accept`                      | `acceptRevisionPlan`        |
| Reviews        | GET    | `/api/v1/profiles/{profileId}/reviews`                         | `listVerifiedReviews`       |
| Reviews        | POST   | `/api/v1/orders/{orderId}/review`                              | `createReview`              |
| Reviews        | PATCH  | `/api/v1/reviews/{reviewId}`                                   | `editReview`                |
| Notifications  | GET    | `/api/v1/notifications`                                        | `listNotifications`         |
| Notifications  | POST   | `/api/v1/notifications/{notificationId}/read`                  | `readNotification`          |
| Notifications  | POST   | `/api/v1/notifications/read-all`                               | `readAllNotifications`      |
| Notifications  | POST   | `/api/v1/devices`                                              | `registerDevice`            |
| Notifications  | DELETE | `/api/v1/devices/{deviceId}`                                   | `revokeDevice`              |
| Notifications  | POST   | `/api/v1/realtime/ticket`                                      | `createRealtimeTicket`      |
| Admin          | GET    | `/api/v1/admin/audit`                                          | `listAuditHistory`          |
| Admin          | GET    | `/api/v1/admin/moderation`                                     | `listModerationQueue`       |
| Admin          | GET    | `/api/v1/admin/cases`                                          | `listAdminCases`            |
| Admin          | GET    | `/api/v1/admin/commission-rates`                               | `listCommissionRates`       |
| Admin          | POST   | `/api/v1/admin/commission-rates`                               | `configureCommission`       |
| Admin          | GET    | `/api/v1/admin/delivery-rates`                                 | `listDeliveryRates`         |
| Admin          | POST   | `/api/v1/admin/delivery-rates`                                 | `configureDeliveryRate`     |
| Admin          | GET    | `/api/v1/admin/driver-zones`                                   | `listDriverZones`           |
| Admin          | POST   | `/api/v1/admin/driver-zones`                                   | `assignDriverZone`          |
| Admin          | POST   | `/api/v1/admin/moderation/{resourceId}/decision`               | `moderateResource`          |
| Admin          | POST   | `/api/v1/admin/users/{userId}/restrictions`                    | `restrictAccount`           |
| Admin          | POST   | `/api/v1/admin/cases/{caseId}/assign`                          | `assignAdminCase`           |
| Admin          | POST   | `/api/v1/admin/cases/{caseId}/resolve`                         | `resolveAdminCase`          |
| Admin          | POST   | `/api/v1/admin/deliveries/{deliveryId}/reassign`               | `reassignDelivery`          |
| Admin          | POST   | `/api/v1/admin/reviews/{reviewId}/moderate`                    | `moderateReview`            |
| Admin          | POST   | `/api/v1/admin/simulator/topups`                               | `simulateWalletTopUp`       |
| Admin          | POST   | `/api/v1/admin/restrictions/{restrictionId}/revoke`            | `revokeRestriction`         |
| Admin          | DELETE | `/api/v1/admin/driver-zones/{zoneId}`                          | `removeDriverZone`          |
| Admin          | POST   | `/api/v1/admin/cases/{caseId}/resume-final-payment`            | `resumeOverdueFinalPayment` |

## Runtime details

The exact collection is [marketplace.postman_collection.json](postman/marketplace.postman_collection.json). The older filename is an identical compatibility artifact. Browser realtime tickets require orderId and are consumed once within 60 seconds. Inspection images may be staged owner-only and atomically claimed. A custom quote has nullable agreed due/total until approval. `mine=true` is authenticated management scope; ordinary catalog reads hide moderated/draft records. Admin moderation rows include typed content for review, and own User responses include current restrictions. Required nonempty text rejects whitespace-only input.

An explicit administrative driver award requires driverAssignmentId. Collected-goods cancellation proposals snapshot inventoryReturns for the same two-party approval; original funds/commission remain unchanged until authorized settlement. Payment resumption records balanceResumedAt and balanceResumptionCaseId, preserving original readyAt, and requires the exact agreed deadline within a new maximum 72-hour window. Cursor signatures bind sorted filters and actor scope. A successful command replay returns the original result; stable domain rejections are cached only after their failed transaction has rolled back.

Rate limits per minute: identity 60 (registration 20), reads 300, ordinary writes 120, fund/checkout/confirmation/administrative-resolution operations 30, plus an IP bound. Socket commands also have actor/socket limits and a 32 KiB cap. Rate-limit rejection includes Retry-After. These counters assume one API instance or an upstream distributed limiter.
