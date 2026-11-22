export interface HealthResponse {
  status: 'ok';
  phase: 'setup';
  simulatedPayments: true;
}

export type Currency = 'SYP' | 'USD';
export interface MoneyDto {
  currency: Currency;
  /** Integer stored units as a decimal string. USD cents; SYP whole pounds. */
  units: string;
}
