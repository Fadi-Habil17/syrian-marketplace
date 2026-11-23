# Mobile API integration issues and remaining work

This is a partial mobile implementation on `feature/mobile`, not the complete requested mobile release. Backend and frontend source, Prisma models, migrations and shared contracts are unchanged.

## Contract review

The existing OpenAPI contract defines authentication, the three workspaces, order actions, wallets, delivery, cases, reviews, notifications and administration. No new endpoint is requested or invented by this increment. Mobile uses the generated shared `paths` through `openapi-fetch`. `/orders` Socket.IO is the existing namespace.

Known integration constraints to coordinate with the backend owner:

- `/driver/assignments` returns `DriverJobPage`, rather than assignment records. It supplies delivery IDs/order versions for a follow-up authorized delivery read. The client must not infer custody or assignment eligibility from the job projection.
- Notifications contain category/resourceId, with no typed resource-kind discriminator. A client cannot safely map every notification to a deep link by guessing whether its ID identifies an order, case or delivery. The current screen marks notices read; notification deep links are not implemented.
- There is no general admin user-search endpoint in the contract. Account restriction UX needs an existing authorized user reference; a searchable user picker would need backend-owner agreement.
- Staged inspection requests require at least one already uploaded photo. File staging/scanning integration must precede the inspection-request client flow.

These are contract observations, not proof that a backend endpoint is broken. No live backend acceptance session was run here.

## Implemented client code, not device verification

Expo Router, secure refresh storage/in-memory access, single-flight refresh and authenticated retry; email/password login, registration, verification/reset; Arabic/English view direction; freelance/professional/product browsing; freelance requests and professional booking requests; addresses; in-memory cart and server checkout preview/hold; order reads, server-offered basic commands, two holds; text order chat/realtime invalidation; notifications/read, Expo push registration adapter; driver available jobs/acceptance and delivery record screen; wallet read; dispute opening/list and review submission; seller overview and content moderation screen.

## Remaining required implementation

- Complete seller CRUD/publication, workspace/profile switching, store inventory and management screens.
- Inspection/photos, professional profile and quote composition/approval/rejection, schedule negotiation, en-route/on-site UX.
- Private file picking/upload/quarantine/status/download, digital final delivery and delivery proof capture.
- Driver assignment list/navigation, assignment release, exceptions, fallback, terms approval and custody workflows.
- Full admin commissions/rates/zones, restrictions, audit, case assignment/evidence/resolution/resumption and simulator topups.
- Dispute evidence/proposals/revisions, review editing, wallet transaction history.
- Full list pagination/filter pickers, complete state/enum translations, app-wide native RTL/navigation/device accessibility and visual comparison beyond the home adaptation.
- Push tap routing, token revocation lifecycle and real-device delivery/receipts acceptance.
- Durable handling of ambiguous network outcomes for every mutation; the deposit/balance holds retain their key/version on retry, while several other mutations still need this coverage.
- End-to-end API, authorization, offline/session races, screenshots and Android/iOS device acceptance. No APK was produced.

Do not mark these features complete because a route, adapter, schema or TypeScript build exists. Coordinate any contract changes with the backend owner rather than changing shared packages.
