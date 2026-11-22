// Backend-only port. All postings join the caller's existing transaction.
export const PAYMENT_GATEWAY_PROVIDER = Symbol('PaymentGatewayProvider');
export type GatewayCurrency = 'SYP' | 'USD';
export type GatewayJournalKind =
  | 'SIMULATED_TOPUP'
  | 'DEPOSIT_HOLD'
  | 'BALANCE_HOLD'
  | 'STORE_HOLD'
  | 'DELIVERY_ADJUSTMENT_HOLD'
  | 'DELIVERY_ADJUSTMENT_REFUND'
  | 'SETTLEMENT';
export interface GatewayPosting {
  accountId: string;
  debitUnits: bigint;
  creditUnits: bigint;
}

export interface GatewayCommand {
  operationKey: string;
  requestHash: string;
  orderId: string | null;
  actorId: string | null;
  currency: GatewayCurrency;
  kind: GatewayJournalKind;
  postings: readonly GatewayPosting[];
  simulateFailure?: boolean;
}

export type GatewayResult =
  | { status: 'succeeded'; journalId: string; reference: string; simulated: true }
  | {
      status: 'failed';
      code: 'INSUFFICIENT_FUNDS' | 'SIMULATED_FAILURE';
      reference: string;
      simulated: true;
    };

export interface PaymentGatewayProvider<UnitOfWork = unknown> {
  hold(command: GatewayCommand, transaction: UnitOfWork): Promise<GatewayResult>;
  release(command: GatewayCommand, transaction: UnitOfWork): Promise<GatewayResult>;
  refund(command: GatewayCommand, transaction: UnitOfWork): Promise<GatewayResult>;
  payout(command: GatewayCommand, transaction: UnitOfWork): Promise<GatewayResult>;
}
