# Shared packages

- `contracts`: generated OpenAPI request/response types, versioned WebSocket envelopes, infrastructure responses and money representations. Both web and mobile import this package. Never export Prisma or backend authorization internals.
- `i18n`: Arabic/English message keys shared by web/mobile. Business catalog content remains bilingual data, not translation keys.

Build with `npm run build:packages` before consumers. Regenerate from `docs/api/openapi.yaml` with `npm run contracts:generate`; CI checks drift with `contracts:check`. These transport types provide compile-time contracts; runtime DTO validation and authenticated clients belong to subsequent feature slices. The backend `PaymentGatewayProvider` port belongs to its own feature and intentionally stays out of client packages.
