import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type {
  GatewayCommand,
  GatewayResult,
  PaymentGatewayProvider,
} from '../domain/payment-gateway-provider';

/** Local double-entry posting only; the application command validates policy. */
export class LocalSimulatedGateway implements PaymentGatewayProvider<Prisma.TransactionClient> {
  hold(c: GatewayCommand, tx: Prisma.TransactionClient) {
    return this.post(c, tx);
  }
  release(c: GatewayCommand, tx: Prisma.TransactionClient) {
    return this.post(c, tx);
  }
  refund(c: GatewayCommand, tx: Prisma.TransactionClient) {
    return this.post(c, tx);
  }
  payout(c: GatewayCommand, tx: Prisma.TransactionClient) {
    return this.post(c, tx);
  }
  private async post(c: GatewayCommand, tx: Prisma.TransactionClient): Promise<GatewayResult> {
    const previous = await tx.ledgerJournal.findUnique({ where: { operationKey: c.operationKey } });
    if (previous) {
      if (previous.requestHash !== c.requestHash) throw new Error('IDEMPOTENCY_CONFLICT');
      return {
        status: 'succeeded',
        journalId: previous.id,
        reference: `sim-${previous.id}`,
        simulated: true,
      };
    }
    const debit = c.postings.reduce((n, x) => n + x.debitUnits, 0n);
    const credit = c.postings.reduce((n, x) => n + x.creditUnits, 0n);
    if (
      c.postings.length < 2 ||
      debit <= 0n ||
      debit !== credit ||
      c.postings.some(
        (x) =>
          !(
            (x.debitUnits > 0n && x.creditUnits === 0n) ||
            (x.creditUnits > 0n && x.debitUnits === 0n)
          ),
      )
    )
      throw new Error('UNBALANCED_JOURNAL');
    const ids = [...new Set(c.postings.map((x) => x.accountId))].sort();
    for (const id of ids)
      await tx.$queryRaw`SELECT "id" FROM "LedgerAccount" WHERE "id"=${id}::uuid FOR UPDATE`;
    const accounts = await tx.ledgerAccount.findMany({ where: { id: { in: ids } } });
    if (accounts.length !== ids.length || accounts.some((x) => x.currency !== c.currency))
      throw new Error('MIXED_CURRENCY');
    if (c.simulateFailure)
      return {
        status: 'failed',
        code: 'SIMULATED_FAILURE',
        reference: `sim-failed-${randomUUID()}`,
        simulated: true,
      };
    for (const a of accounts) {
      const change = c.postings
        .filter((x) => x.accountId === a.id)
        .reduce((n, x) => n + x.creditUnits - x.debitUnits, 0n);
      if (a.kind !== 'SIMULATOR_CLEARING' && a.balanceUnits + change < 0n)
        return {
          status: 'failed',
          code: 'INSUFFICIENT_FUNDS',
          reference: `sim-failed-${randomUUID()}`,
          simulated: true,
        };
    }
    const j = await tx.ledgerJournal.create({
      data: {
        operationKey: c.operationKey,
        requestHash: c.requestHash,
        currency: c.currency,
        kind: c.kind,
        orderId: c.orderId,
        actorId: c.actorId,
      },
    });
    for (const posting of [...c.postings].sort((a, b) => a.accountId.localeCompare(b.accountId)))
      await tx.ledgerEntry.create({ data: { journalId: j.id, currency: c.currency, ...posting } });
    return { status: 'succeeded', journalId: j.id, reference: `sim-${j.id}`, simulated: true };
  }
}
