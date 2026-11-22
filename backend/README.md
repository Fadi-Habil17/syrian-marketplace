# Backend

NestJS 10 infrastructure shell only. Run all commands from the repository root unless a command explicitly changes directory. Follow the root README for environment/database setup, install and shared package build. `npm run dev:backend` exposes health and Swagger; `npm run worker:dev` starts a heartbeat without business jobs.

Features belong in `src/modules/<feature>` using the boundaries in `../docs/MODULE_BOUNDARIES.md`. Prisma now describes all marketplace domains, with reviewed PostgreSQL-specific ledger, money, inventory and eligibility guards in migrations. Internal financial application commands coordinate simulated holds, disputes and settlement. See [database notes](../docs/DATABASE.md) and [validation evidence](../docs/DATABASE_CONTRACT_REPORT.md).

Only the health HTTP route is wired. Authentication, business controllers, workflow workers and client flows are subsequent slices. The complete [OpenAPI contract](../docs/api/openapi.yaml) specifies their target behavior. Database migrations, seed and PostgreSQL tests require an actual PostgreSQL server; schema validation alone does not execute them.
