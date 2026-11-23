import { LedgerPostingService } from '../ledger/ledger-posting.service';
import { Inject, Injectable } from '@nestjs/common';
import type { Currency } from '@prisma/client';
import { createHash } from 'node:crypto';
import { ApiRequest } from '../../common/actor';
import { AccessService } from '../../common/access.service';
import { CommandsService } from '../../common/commands.service';
import { fail, requireValue } from '../../common/errors';
import { page, pageArgs } from '../../common/pagination';
import { PrismaService, UnitOfWork } from '../../infrastructure/database/prisma.service';
import {
  PAYMENT_GATEWAY_PROVIDER,
  PaymentGatewayProvider,
} from '../payments/domain/payment-gateway-provider';
import { paymentDto, settlementDto } from '../orders/orders-query.service';
@Injectable()
export class WalletsService {
  constructor(
    private readonly db: PrismaService,
    private readonly access: AccessService,
    private readonly ledger: LedgerPostingService,
    private readonly commands: CommandsService,
    @Inject(PAYMENT_GATEWAY_PROVIDER) private readonly gateway: PaymentGatewayProvider<UnitOfWork>,
  ) {}
  async listWallets(r: ApiRequest) {
    const wallets = await this.db.wallet.findMany({
      where: { userId: r.actor.id },
      include: { account: true },
      ...pageArgs(r.query, r.actor.id),
    });
    return page(
      wallets.map((w) => ({
        id: w.id,
        currency: w.currency,
        availableUnits: w.account.balanceUnits.toString(),
        simulated: true,
      })),
      r.query,
      r.actor.id,
    );
  }
  async listWalletTransactions(r: ApiRequest) {
    const wallet = requireValue(
      await this.db.wallet.findUnique({
        where: { userId_currency: { userId: r.actor.id, currency: r.params.currency as Currency } },
      }),
    );
    const rows = await this.db.ledgerJournal.findMany({
      where: { ledgerEntry_journal: { some: { accountId: wallet.accountId } } },
      include: { ledgerEntry_journal: { where: { accountId: wallet.accountId } } },
      ...pageArgs(r.query, `${r.actor.id}:${wallet.currency}`, [
        { postedAt: 'desc' },
        { id: 'desc' },
      ]),
    });
    return page(
      rows.map((j) => ({
        ...j,
        debitUnits: j.ledgerEntry_journal.reduce((n, e) => n + e.debitUnits, 0n),
        creditUnits: j.ledgerEntry_journal.reduce((n, e) => n + e.creditUnits, 0n),
        simulated: true,
      })),
      r.query,
      `${r.actor.id}:${wallet.currency}`,
    );
  }
  async listOrderPayments(r: ApiRequest) {
    await this.access.order(r.params.orderId!, r.actor);
    return page(
      (
        await this.db.paymentAttempt.findMany({
          where: { orderId: r.params.orderId },
          ...pageArgs(r.query, r.actor.id),
        })
      ).map(paymentDto),
      r.query,
      r.actor.id,
    );
  }
  async getSettlement(r: ApiRequest) {
    await this.access.order(r.params.orderId!, r.actor);
    return settlementDto(
      requireValue(
        await this.db.settlement.findUnique({
          where: { orderId: r.params.orderId },
          include: { allocation_settlement: true },
        }),
      ),
    );
  }
  async getOperation(r: ApiRequest) {
    const id = r.params.operationId!,
      p = await this.db.paymentAttempt.findFirst({ where: { id, actorId: r.actor.id } });
    if (p)
      return {
        id: p.id,
        status: p.status,
        resourceId: p.orderId,
        errorCode: p.failureCode,
        simulated: true,
      };
    const record = await this.db.idempotencyRecord.findFirst({
      where: { id, actorId: r.actor.id },
    });
    if (record)
      return {
        id: record.id,
        status: record.httpStatus >= 400 ? 'FAILED' : 'SUCCEEDED',
        resourceId: record.id,
        errorCode: null,
        simulated: true,
      };
    const j = await this.db.ledgerJournal.findFirst({
      where: {
        id,
        OR: [
          { actorId: r.actor.id },
          { ledgerEntry_journal: { some: { account: { userId: r.actor.id, kind: 'AVAILABLE' } } } },
        ],
      },
    });
    if (j)
      return {
        id: j.id,
        status: 'SUCCEEDED',
        resourceId: j.orderId ?? j.id,
        errorCode: null,
        simulated: true,
      };
    fail('NOT_FOUND', 404);
  }
  simulateWalletTopUp(r: ApiRequest) {
    if (process.env.NODE_ENV === 'production') fail('FORBIDDEN', 403);
    return this.commands.run(r, async (tx) => {
      const b = r.body,
        units = BigInt(b.amount.units),
        wallet = requireValue(
          await tx.wallet.findUnique({
            where: { userId_currency: { userId: b.userId, currency: b.amount.currency } },
          }),
        ),
        clearing = await this.ledger.platform(tx, 'SIMULATOR_CLEARING', b.amount.currency);
      if (units <= 0n) fail('INVALID_INPUT', 400);
      const operationKey = `topup:${r.actor.id}:${String(r.headers['idempotency-key'])}`,
        posted = await this.gateway.payout(
          {
            operationKey,
            requestHash: createHash('sha256').update(JSON.stringify(b)).digest('hex'),
            actorId: r.actor.id,
            orderId: null,
            currency: b.amount.currency,
            kind: 'SIMULATED_TOPUP',
            postings: [
              { accountId: clearing.id, debitUnits: units, creditUnits: 0n },
              { accountId: wallet.accountId, debitUnits: 0n, creditUnits: units },
            ],
          },
          tx,
        );
      if (posted.status !== 'succeeded') fail('SETTLEMENT_POSTING_FAILED', 503);
      await this.commands.audit(tx, r.actor.id, b.userId, 'simulator.topup', {
        reason: b.reason,
        journalId: posted.journalId,
      });
      const j = await tx.ledgerJournal.findUniqueOrThrow({ where: { id: posted.journalId } });
      return { ...j, debitUnits: 0n, creditUnits: units, simulated: true };
    });
  }
}
