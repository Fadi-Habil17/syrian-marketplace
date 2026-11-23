# Feature modules

Feature modules are registered through AppModule in dependency order. Controllers adapt the canonical OpenAPI requests to injected application services. The separate worker uses the same application context and domain policies for durable jobs.

Use [module boundaries](../../../docs/MODULE_BOUNDARIES.md) for write ownership and exported transactional capabilities. Gateway, ledger, escrow and settlement are concrete injected modules; clients receive transport contracts without transaction internals. Read the [implementation and verification report](../../../docs/BACKEND_IMPLEMENTATION_REPORT.md) before interpreting route registration as scenario coverage.
