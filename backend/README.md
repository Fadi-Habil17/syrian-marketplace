# Backend

NestJS 10 modular monolith with 145 registered REST operations under `/api/v1`, Swagger at `/api/docs`, authenticated Socket.IO, PostgreSQL transactions and a separate durable worker. Follow the [root README](../README.md) for environment, dependency, storage/scanner, migration and seed setup. `npm run dev:backend` starts the API; `npm run worker:dev` processes deadline jobs, private file scans, email, outbox notifications and push receipts.

Features live in `src/modules/<feature>` with thin controllers and injected services. Financial operations use the local simulator, immutable double-entry ledger and escrow; no real ShamCash integration exists. See [module boundaries](../docs/MODULE_BOUNDARIES.md), [database notes](../docs/DATABASE.md), the [OpenAPI contract](../docs/api/openapi.yaml) and [actual verification report](../docs/BACKEND_IMPLEMENTATION_REPORT.md).

Run `npm test` for unit checks and `npm run db:test` for real PostgreSQL integration scenarios from the root. The latter requires an explicitly isolated DATABASE_TEST_URL and real private S3/ClamAV services. Do not point tests or demo seed at production. Browser/mobile business screens and production mail/device acceptance remain separate work.
