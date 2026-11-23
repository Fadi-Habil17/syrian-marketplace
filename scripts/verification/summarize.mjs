import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, relative, basename } from 'node:path';
const [snapshot, evidence, destination] = process.argv.slice(2).map((p) => resolve(p));
const read = (file) => JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const suites = [
  ['unit', 'verification-unit.json'],
  ['database', 'verification-database.json'],
];
const cases = suites.flatMap(([kind, file]) =>
  read(resolve(snapshot, file)).testResults.flatMap((suite) =>
    suite.assertionResults.map((test) => ({
      kind,
      file: relative(snapshot, suite.name).replaceAll('\\', '/'),
      name: test.fullName,
      status:
        { passed: 'PASS', failed: 'FAIL', pending: 'NOT RUN', todo: 'NOT RUN' }[test.status] ??
        'NOT RUN',
    })),
  ),
);
const checks = [
  'backend',
  'frontend',
  'contracts',
  'generated',
  'erd',
  'setup',
  'schema',
  'seed-types',
  'typecheck',
  'unit',
  'database',
  'mobile',
  'web',
  'lint',
  'install-final',
  'live-web',
  'live-mobile',
  'expo-export',
].map((name) => {
  const check = read(resolve(evidence, `${name}-result.json`));
  return {
    check: check.check,
    status: check.status,
    exitCode: check.exitCode,
    finishedUtc: check.finishedUtc,
    log: basename(check.log ?? `${name}.log`),
  };
});
const ledger = read(resolve(evidence, 'invariants-final.json'));
mkdirSync(destination, { recursive: true });
const counts = Object.fromEntries(
  ['PASS', 'FAIL', 'BLOCKED', 'NOT RUN'].map((status) => [
    status,
    cases.filter((c) => c.status === status).length,
  ]),
);
writeFileSync(
  resolve(destination, 'automated-results.json'),
  JSON.stringify(
    {
      recordedUtc: new Date().toISOString(),
      baselineCommit: '868282775cab4ec6d02cbbc168fd3645ea8e89f2',
      scope:
        'Final working tree; only executed Jest cases below. Client tests and other acceptance gates are reported separately in TEST_REPORT.md. Not a full release approval.',
      statusDefinitions: {
        PASS: 'Executed and met the stated assertion',
        FAIL: 'Executed and did not meet the assertion',
        BLOCKED: 'Could not execute because a prerequisite/access was unavailable',
        'NOT RUN': 'Not executed; no pass claim',
      },
      counts,
      checks,
      cases,
      financialChecks: ledger.checks,
      observedDatabase: ledger.observed,
    },
    null,
    2,
  ) + '\n',
);
writeFileSync(
  resolve(destination, 'AUTOMATED_RESULTS.md'),
  [
    '# Executed backend verification cases',
    '',
    'PASS = executed and met its assertion. FAIL = executed and failed. BLOCKED = prerequisite/access unavailable. NOT RUN = not executed. This appendix covers Jest only; see [TEST_REPORT.md](../TEST_REPORT.md) for client tests, attempts and unverified release requirements.',
    '',
    `Final Jest result: ${counts.PASS} PASS, ${counts.FAIL} FAIL, ${counts.BLOCKED} BLOCKED, ${counts['NOT RUN']} NOT RUN.`,
    '',
    '| Suite | Test | Status |',
    '| --- | --- | --- |',
    ...cases.map(
      (c) => `| ${c.kind}: ${basename(c.file)} | ${c.name.replaceAll('|', '\\|')} | ${c.status} |`,
    ),
    '',
  ].join('\n'),
);
console.log(JSON.stringify({ counts, checks: checks.length, ledgerChecks: ledger.checks.length }));
