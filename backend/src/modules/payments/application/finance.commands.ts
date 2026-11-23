import type { Installment } from '@prisma/client';
export type HoldCommand = {
  orderId: string;
  actorId: string;
  installment: Exclude<Installment, 'DELIVERY_ADJUSTMENT'>;
  expectedVersion: number;
  idempotencyKey: string;
  termsAccepted: true;
  simulateFailure?: boolean;
};
export type OpenDisputeCommand = {
  orderId: string;
  actorId: string;
  reason: string;
  expectedVersion: number;
  idempotencyKey: string;
};
export type CompleteCommand = {
  orderId: string;
  actorId?: string;
  automatic?: boolean;
  expectedVersion?: number;
  idempotencyKey: string;
};
export type ResolveDisputeCommand = {
  orderId: string;
  actorId: string;
  caseId: string;
  reason: string;
  substantiation: string;
  sellerAwardUnits: bigint;
  sellerDeliveryUnits: bigint;
  driverAwardUnits: bigint;
  driverUserId?: string;
  outcome: 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  expectedVersion: number;
  idempotencyKey: string;
  inventoryReturns?: {
    reservationId: string;
    reusableQuantity: number;
    nonRestockableQuantity: number;
    reason: string;
  }[];
};
