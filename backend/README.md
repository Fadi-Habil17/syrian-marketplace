# Backend foundation

NestJS 10 infrastructure shell only. Run all commands from the repository root unless a command explicitly changes directory. Follow the root README for environment/database setup, install and shared package build. `npm run dev:backend` exposes health and Swagger; `npm run worker:dev` starts a heartbeat without business jobs.

Planned features belong in `src/modules/<feature>` using boundaries in `../docs/MODULE_BOUNDARIES.md`. Prisma currently owns only setup metadata. Do not mistake a working health route or seed for implemented identity, wallet, escrow or order handling. Backend Passport/JWT/bcrypt/WebSocket dependencies are prepared for later slices, not active endpoints.
