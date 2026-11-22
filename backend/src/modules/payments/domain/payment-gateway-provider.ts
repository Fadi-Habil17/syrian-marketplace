// Domain port only: no local gateway implementation or business feature yet.
// All methods receive the SAME unit of work as their order/ledger command.
export const PAYMENT_GATEWAY_PROVIDER = Symbol('PaymentGatewayProvider');
export type GatewayCurrency = 'SYP' | 'USD';

export interface GatewayCommand {
  operationKey: string;
  orderId: string;
  currency: GatewayCurrency;
  units: bigint;
  sourceAccountId: string;
  destinationAccountId: string;
}

export type GatewayResult =
  | { status: 'succeeded'; reference: string; simulated: true }
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
