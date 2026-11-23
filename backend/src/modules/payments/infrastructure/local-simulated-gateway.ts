import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { GatewayCommand, PaymentGatewayProvider } from '../domain/payment-gateway-provider';
import { LedgerPostingService } from '../../ledger/ledger-posting.service';
/** Intentionally simulated gateway: actual balanced PostgreSQL postings, no network payment. */
@Injectable()
export class LocalSimulatedGateway implements PaymentGatewayProvider<Prisma.TransactionClient> {
  constructor(private readonly ledger: LedgerPostingService = new LedgerPostingService()) {}
  hold(c: GatewayCommand, tx: Prisma.TransactionClient) {
    return this.ledger.post(c, tx);
  }
  release(c: GatewayCommand, tx: Prisma.TransactionClient) {
    return this.ledger.post(c, tx);
  }
  refund(c: GatewayCommand, tx: Prisma.TransactionClient) {
    return this.ledger.post(c, tx);
  }
  payout(c: GatewayCommand, tx: Prisma.TransactionClient) {
    return this.ledger.post(c, tx);
  }
}
