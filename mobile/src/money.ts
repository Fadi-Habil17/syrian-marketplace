import type { ApiSchemas } from './api/contracts';
// Formatting only. Pricing, installments and allocations are exclusively server-owned.
export function money(value: ApiSchemas['Money'] | null | undefined): string {
  if (!value) return '—';
  const units = value.units;
  return value.currency === 'USD'
    ? `${units.padStart(3, '0').slice(0, -2)}.${units.padStart(3, '0').slice(-2)} USD`
    : `${units} SYP`;
}
