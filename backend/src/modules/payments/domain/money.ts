export const MAX_UNITS = 9_000_000_000_000n;
export function serviceSplit(total: bigint): { deposit: bigint; balance: bigint } {
  if (total < 2n || total > MAX_UNITS) throw new Error('INVALID_INSTALLMENT_TOTAL');
  const deposit = (2n * total + 3n) / 6n;
  return { deposit, balance: total - deposit };
}
export function commission(eligibleAward: bigint, basisPoints: number): bigint {
  if (
    eligibleAward < 0n ||
    eligibleAward > MAX_UNITS ||
    !Number.isInteger(basisPoints) ||
    basisPoints < 0 ||
    basisPoints > 10000
  )
    throw new Error('INVALID_ALLOCATION');
  return (eligibleAward * BigInt(basisPoints) + 5000n) / 10000n;
}
export function settlementAmounts(
  held: bigint,
  eligibleAward: bigint,
  sellerDelivery: bigint,
  driverAward: bigint,
  basisPoints: number,
) {
  if (
    [held, eligibleAward, sellerDelivery, driverAward].some((x) => x < 0n || x > MAX_UNITS) ||
    eligibleAward + sellerDelivery + driverAward > held
  )
    throw new Error('INVALID_ALLOCATION');
  const fee = commission(eligibleAward, basisPoints);
  return {
    buyerRefund: held - eligibleAward - sellerDelivery - driverAward,
    sellerNet: eligibleAward - fee,
    sellerDelivery,
    driverPayout: driverAward,
    commission: fee,
  };
}
