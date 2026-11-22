import { commission, serviceSplit, settlementAmounts } from './money';

describe('required minor-unit financial policies', () => {
  it.each([
    [2n, 1n, 1n],
    [100n, 33n, 67n],
    [101n, 34n, 67n],
    [9_000_000_000_000n, 3_000_000_000_000n, 6_000_000_000_000n],
  ])('splits %s without losing a stored unit', (total, deposit, balance) =>
    expect(serviceSplit(total)).toEqual({ deposit, balance }),
  );
  it.each([0n, 1n, -1n, 9_000_000_000_001n])('rejects invalid service total %s', (total) =>
    expect(() => serviceSplit(total)).toThrow('INVALID_INSTALLMENT_TOTAL'),
  );
  it('rounds commission half-up once and honors an explicit zero', () => {
    expect(commission(1n, 5000)).toBe(1n);
    expect(commission(101n, 0)).toBe(0n);
    expect(commission(101n, 10000)).toBe(101n);
  });
  it('excludes refunds and delivery from commission and conserves every held unit', () => {
    const a = settlementAmounts(1000n, 600n, 0n, 100n, 1000);
    expect(a).toEqual({
      buyerRefund: 300n,
      sellerNet: 540n,
      sellerDelivery: 0n,
      driverPayout: 100n,
      commission: 60n,
    });
    expect(Object.values(a).reduce((s, x) => s + x, 0n)).toBe(1000n);
  });
  it('never allocates an unfunded balance or negative awards', () => {
    expect(() => settlementAmounts(33n, 100n, 0n, 0n, 0)).toThrow('INVALID_ALLOCATION');
    expect(() => settlementAmounts(33n, -1n, 0n, 0n, 0)).toThrow('INVALID_ALLOCATION');
  });
});
