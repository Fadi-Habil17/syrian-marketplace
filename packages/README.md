# Shared packages

- `contracts`: infrastructure response and money representation types; future generated OpenAPI and versioned WebSocket transport contracts. Never export Prisma or backend authorization internals.
- `i18n`: Arabic/English message keys shared by web/mobile. Business catalog content remains bilingual data, not translation keys.

Build with `npm run build:packages` before consumers. Add runtime/business DTOs only after the slice contract gate. The backend `PaymentGatewayProvider` port belongs to its own feature and intentionally stays out of client packages.
