# Repeatable verification

Use a disposable checkout of the exact reviewed tree. Keep ordinary development servers and their build directories separate. Install with `npm ci`; do not copy dependencies from another machine.

Create a **new** PostgreSQL test database and private storage bucket, using the variables in `backend/.env.example`. Put the isolated configuration in an ignored local file. Set `DATABASE_URL` and `DATABASE_TEST_URL` to the same test database, `NODE_ENV=test`, `ALLOW_DEMO_SEED=true`, independent JWT/email secrets, authenticated storage and a real scanner. The runner refuses mismatched/non-test database URLs and missing integration services. Do not use production credentials or an existing development database.

From the disposable checkout, run each command with the explicit isolated configuration path and an ignored evidence directory:

```text
node scripts/verification/run-check.mjs packages backend/.env ../verification-evidence
node scripts/verification/run-check.mjs generate backend/.env ../verification-evidence
node scripts/verification/run-check.mjs migrate backend/.env ../verification-evidence
node scripts/verification/run-check.mjs seed backend/.env ../verification-evidence
```

Other check names: `schema`, `seed-types`, `typecheck`, `backend`, `frontend`, `unit`, `database`, `mobile`, `web`, `lint`, `contracts`, `generated`, `erd`, `setup`. The runner stores command/exit/status/timestamps and logs; it propagates failed exit codes. Run dependency-heavy database/build/export operations with enough local resources. Do not delete a failing log before its disposition is recorded.

```text
node scripts/verification/database-invariants.cjs backend/.env ../verification-evidence/invariants.json
node scripts/verification/live-web.cjs backend/.env
node scripts/verification/live-mobile.cjs backend/.env
python scripts/verification/validate-postman.py
```

Live web/mobile harnesses run sequentially because they share isolated API port 14273; web uses 14274. They stop their own child processes. The web harness submits rendered Server Actions and checks actual SSR/cookies. The mobile harness loads the actual typed transport/checkout code but replaces native SecureStore with a Map: **it is not a native/device test**. Private tokens are not printed or saved in committed artifacts.

The Postman validator needs Python `jsonschema` and access to the official schema host; download failure is BLOCKED, exit 2, not successful validation. `npm run contracts:validate` separately validates the local contract and collection method/path coverage.

`summarize.mjs <snapshot-root> <evidence-directory> <destination>` creates sanitized final Jest/check/invariant evidence from this run's expected result filenames. Its appendix does not include every client or release gate. Preserve FAIL/BLOCKED/NOT RUN checks and earlier attempts in the narrative report. Do not treat 145 registered routes or a native JS export as full business/device acceptance.
