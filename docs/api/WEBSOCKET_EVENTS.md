# Socket.IO protocol, version 1

Namespace `/orders`; same contract for web and mobile. Canonical machine-readable schemas are `RealtimeCommand`, `RealtimeEvent` and `RealtimeAck` in [OpenAPI 3.1](openapi.yaml), generated into the shared contracts package. RealtimeModule registers the actual gateway. Send client envelopes on `command` with an acknowledgement callback; server envelopes arrive on `event`.

Browser obtains a single-use 60-second ticket through authenticated `/api/v1/realtime/ticket` via its web server action. Mobile sends a short-lived access JWT in the Socket.IO auth handshake. Never put tokens in URLs or logs. Validate current session/restrictions on connect and every command; recheck room ownership/participation on each subscribe/send and file redemption. Rotate/reconnect after expiry; revocation closes affected rooms immediately. No SSE or continuous GPS stream is used.

## Client commands

Every command has `{type,data}` and an acknowledgement callback. Success ack is `{ok:true,requestId,data}`, failure `{ok:false,requestId,error:ApiError}`. Domain commands call the same application use case as REST; transport is not a second authority.

| Type                | Data                                                          | Permission / effect                                                                                                                                  |
| ------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `order.subscribe`   | orderId, lastSeenVersion                                      | Buyer/provider for order room; driver only delivery projection; handling admin case-scoped. Returns authorized current version.                      |
| `order.unsubscribe` | orderId                                                       | Own subscription; idempotent.                                                                                                                        |
| `chat.send`         | roomId, clientMessageId UUID, optional text and attachmentIds | Room member; at least text or attachments, max 10 files. Sender/room/clientMessageId uniqueness prevents duplicate messages across REST and sockets. |
| `notification.ack`  | notificationId                                                | Recipient only; idempotent read acknowledgement.                                                                                                     |

Payments, refunds, admin decisions, slot/quote approvals and order mutations remain explicit authenticated REST commands with Idempotency-Key and parent-order If-Match. Socket commands cannot set order state, amount, commission, escrow or wallet balance. Attachment bytes use Files REST endpoints; no binary socket upload.

## Server events

Envelope: `{eventId:UUID,type,version:1,aggregateId:UUID,aggregateVersion:integer,occurredAt:UTC,data}`. Server timestamps and aggregate versions are authoritative. Data is a per-audience projection; never forward raw database rows or internal outbox payloads. Outbox reference payloads are hydrated into the canonical DTO after current authorization; financial outbox metadata must not leak to a driver room.

| Type                   | Data schema / contents                                                                           | Audience                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `order.updated`        | orderId, state, nullable deadlineAt                                                              | Buyer/provider, assigned handling admin. Driver receives delivery events instead.              |
| `payment.updated`      | operationId, status, installment, amount(currency, units string), simulated=true                 | Buyer/provider only; no wallet balances or tokens.                                             |
| `chat.message.created` | roomId, messageId, senderId                                                                      | Current authorized members of that room; fetch content through authorized REST.                |
| `delivery.updated`     | deliveryId, status, proofAvailable                                                               | Buyer/seller/current driver; contact/address only through assigned delivery REST projection.   |
| `driver.job.available` | redacted DriverJob: job/order IDs, parent order version, coarse city/area, summary, fee, readyAt | Eligible active drivers in assigned coverage only. No private address/contact.                 |
| `case.updated`         | caseId, status, evidenceDeadlineAt                                                               | Buyer/provider and handling admins; driver only explicit delivery-evidence scope through REST. |
| `notification.created` | notificationId, category, resourceId                                                             | Recipient user only.                                                                           |
| `permissions.revoked`  | roomId, reasonCode                                                                               | Affected actor; unsubscribe/disconnect and clear private cached projection.                    |

There is one shared private order thread for buyer/provider, plus a delivery thread when applicable. Driver sees only its current assignment's delivery thread/files and minimum delivery details. It never gains freelance final files, quote attachments, unrelated messages or private evidence. Case-admin assignment and sensitive reads are audited. Restriction/reassignment/session revocation removes grants without trusting a client unsubscribe.

## Delivery, replay and push

Events originate in committed transactional outbox rows and are delivered at least once. Deduplicate eventId, ignore older aggregateVersion, refetch authorized REST state on a gap. Reconnect supplies lastSeenVersion as a hint; no unlimited socket replay promise. REST notification/message/timeline cursors recover missed data. Acknowledging an event does not settle money. Client disconnect or push failure never resets a deadline.

Cap UTF-8 encoded event/command payloads at 32 KiB; rate-limit joins/sends per actor/IP. Return stable ApiError codes without stack traces. In-app notices are durable; mobile order/payment/chat changes also generate Expo push after OS permission/device registration. Denied push still leaves in-app notification. Lock-screen payloads contain only minimal IDs, and opening a deep link reauthorizes the target. Browser push, SMS and marketing email are outside the chosen default channels.

## Implemented transport notes

POST `/api/v1/realtime/ticket` requires `{orderId}`. Tickets are hashed in verification-token storage, consumed atomically once, and bound to the issuing session/order. Browser application code should receive only this ticket from its BFF; mobile may send its access JWT. The server does not infer native identity from an Origin header.

Every command and delivered projection reauthorizes current sessions, restrictions and room scope. A one-second permission sweep removes revoked grants; denied users cannot receive a private projection while waiting for that sweep. API instances hydrate committed, published outbox references independently; worker/API coordination does not assume an in-process event bus. Recover gaps through REST. Deduplicate eventId and track versions within the relevant event/resource stream, rather than dropping unrelated notification topics by another stream's version.

Expo transport is configured separately and stores provider acceptance/ticket IDs and later receipts. Local tests cover real Socket.IO and durable in-app records; real-device delivery is not claimed.
Order and delivery change events exclude written addresses and coordinates. Clients refetch through authorized REST when the screen regains focus or the order changes. A revoked grant invalidates the displayed destination.
