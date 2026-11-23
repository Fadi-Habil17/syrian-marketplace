export function formatMoney(locale: 'ar' | 'en', currency: 'SYP' | 'USD', rawUnits: string) {
  const units = BigInt(rawUnits);
  const fractions = currency === 'USD' ? 2 : 0;
  const numberingSystem = locale === 'ar' ? 'arab' : 'latn';
  const format = new Intl.NumberFormat(locale, {
    numberingSystem,
    style: 'currency',
    currency,
    minimumFractionDigits: fractions,
    maximumFractionDigits: fractions,
  });
  if (currency === 'SYP') return format.format(units);
  const whole = units / 100n;
  const minor = units < 0n ? -(units % 100n) : units % 100n;
  const fraction = new Intl.NumberFormat(locale, {
    minimumIntegerDigits: 2,
    numberingSystem,
  }).format(minor);
  return format
    .formatToParts(whole === 0n && units < 0n ? -0 : whole)
    .map((part) => (part.type === 'fraction' ? fraction : part.value))
    .join('');
}
