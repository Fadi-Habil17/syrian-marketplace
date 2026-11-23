const assert = require('node:assert/strict');
const { writeFileSync } = require('node:fs');
const { PrismaClient } = require('@prisma/client');
if (!process.argv[2] || !process.argv[3])
  throw Error('Explicit isolated env and output file required');
process.loadEnvFile(process.argv[2]);
if (
  process.env.DATABASE_URL !== process.env.DATABASE_TEST_URL ||
  !/verification.*test/.test(new URL(process.env.DATABASE_URL).pathname)
)
  throw Error('Verification database required');
const db = new PrismaClient();
const output = { status: 'NOT RUN', checks: [], observed: {} };
async function check(name, sql) {
  const rows = await db.$queryRawUnsafe(sql); // SQL constants below; never user input.
  assert.equal(rows.length, 0, name);
  output.checks.push({ name, status: 'PASS' });
}
(async () => {
  try {
    await check(
      'Every journal balances and has at least two entries',
      `SELECT j.id FROM "LedgerJournal" j LEFT JOIN "LedgerEntry" e ON e."journalId"=j.id GROUP BY j.id HAVING COUNT(e.id)<2 OR SUM(e."creditUnits")<>SUM(e."debitUnits")`,
    );
    await check(
      'Every cached account balance equals immutable entries',
      `SELECT a.id FROM "LedgerAccount" a LEFT JOIN "LedgerEntry" e ON e."accountId"=a.id GROUP BY a.id HAVING a."balanceUnits"<>COALESCE(SUM(e."creditUnits"-e."debitUnits"),0)`,
    );
    await check(
      'Escrow held amount equals its ledger liability account',
      `SELECT e.id FROM "Escrow" e JOIN "LedgerAccount" a ON a.id=e."accountId" WHERE e."heldUnits"<>a."balanceUnits" OR e."heldUnits"<0`,
    );
    await check(
      'All settlement units are allocated exactly once',
      `SELECT s.id FROM "Settlement" s LEFT JOIN "Allocation" a ON a."settlementId"=s.id GROUP BY s.id HAVING COALESCE(SUM(a.units),0)<>s."heldUnits"`,
    );
    await check(
      'Spendable/escrow/commission balances are nonnegative',
      `SELECT id FROM "LedgerAccount" WHERE kind<>'SIMULATOR_CLEARING' AND "balanceUnits"<0`,
    );
    await check(
      'Inventory bounds hold',
      `SELECT id FROM "Product" WHERE "stockReserved"<0 OR "stockOnHand"<"stockReserved"`,
    );
    await check(
      'No delivery has two active assignments',
      `SELECT "deliveryId" FROM "DriverAssignment" WHERE status IN ('ASSIGNED','PICKED_UP') GROUP BY "deliveryId" HAVING COUNT(*)>1`,
    );
    await check(
      'No driver has two active assignments',
      `SELECT "driverId" FROM "DriverAssignment" WHERE status IN ('ASSIGNED','PICKED_UP') GROUP BY "driverId" HAVING COUNT(*)>1`,
    );
    await check(
      'No service installment or delivery revision is funded twice',
      `SELECT "orderId",installment,"termsVersion" FROM "PaymentAttempt" WHERE status='SUCCEEDED' GROUP BY "orderId",installment,"termsVersion" HAVING COUNT(*)>1`,
    );
    await check(
      'No unfinished or rolled-back migration',
      `SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL`,
    );
    const seedRoles = [
      'customer',
      'freelancer',
      'professional',
      'store_owner',
      'delivery_driver',
      'admin',
    ];
    const demos = await db.user.findMany({
      where: { email: { in: seedRoles.map((r) => r + '@demo.marketplace.test') } },
      include: { userRole_user: { include: { role: true } }, wallet_user: true },
    });
    assert.equal(demos.length, 6);
    for (const user of demos)
      assert.deepEqual(user.wallet_user.map((w) => w.currency).sort(), ['SYP', 'USD']);
    assert.deepEqual(
      [...new Set(demos.flatMap((u) => u.userRole_user.map((r) => r.role.code)))].sort(),
      ['ADMIN', 'CUSTOMER', 'DELIVERY_DRIVER', 'FREELANCER', 'PROFESSIONAL', 'STORE_OWNER'],
    );
    output.checks.push({
      name: 'Six fictional roles each have SYP and USD wallets',
      status: 'PASS',
    });
    output.observed.accounts = await db.ledgerAccount.count();
    output.observed.journals = await db.ledgerJournal.count();
    output.observed.entries = await db.ledgerEntry.count();
    output.observed.settlements = await db.settlement.count();
    output.observed.orders = await db.marketOrder.count();
    output.observed.workspaces =
      await db.$queryRaw`SELECT workspace,COUNT(*)::int AS orders FROM "MarketOrder" GROUP BY workspace ORDER BY workspace`;
    output.observed.transitions =
      await db.$queryRaw`SELECT "fromState","toState",COUNT(*)::int AS occurrences FROM "OrderTransition" GROUP BY "fromState","toState" ORDER BY "fromState","toState"`;
    output.observed.jobs =
      await db.$queryRaw`SELECT kind,status,COUNT(*)::int AS jobs FROM "ScheduledJob" GROUP BY kind,status ORDER BY kind,status`;
    output.observed.migrations =
      await db.$queryRaw`SELECT migration_name FROM "_prisma_migrations" ORDER BY migration_name`;
    output.snapshot = {
      journals: await db.ledgerJournal.findMany({ select: { id: true }, orderBy: { id: 'asc' } }),
      balances: await db.ledgerAccount.findMany({
        select: { id: true, balanceUnits: true },
        orderBy: { id: 'asc' },
      }),
    };
    output.status = 'PASS';
    console.log(
      JSON.stringify({
        status: output.status,
        checks: output.checks.length,
        orders: output.observed.orders,
        journals: output.observed.journals,
      }),
    );
  } catch (error) {
    output.status = 'FAIL';
    output.failure = error.code ?? 'INVARIANT_ASSERTION';
    console.error(output.failure);
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
    writeFileSync(
      process.argv[3],
      JSON.stringify(output, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2) + '\n',
    );
  }
})();
