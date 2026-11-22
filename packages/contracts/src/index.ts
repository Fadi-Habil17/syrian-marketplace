export interface HealthResponse {
  status: 'ok';
  phase: 'setup';
  simulatedPayments: true;
}
export type { paths, operations, components } from './generated/openapi';
export type ApiSchemas = import('./generated/openapi').components['schemas'];
export type RealtimeEvent = ApiSchemas['RealtimeEvent'];
export type RealtimeCommand = ApiSchemas['RealtimeCommand'];
export type RealtimeAck = ApiSchemas['RealtimeAck'];

export type Currency = 'SYP' | 'USD';
export interface MoneyDto {
  currency: Currency;
  /** Integer stored units as a decimal string. USD cents; SYP whole pounds. */
  units: string;
}
