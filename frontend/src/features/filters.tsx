import type { ReactNode } from 'react';
import { operations, resolve, type Operation } from '../lib/api/registry';
import { choose, type Locale } from '../lib/locale';
import { enumLabel, field } from '../lib/labels';
import type { Choices } from './command-form';

const filters = [
  'q',
  'categoryId',
  'governorateId',
  'cityId',
  'currency',
  'minPriceUnits',
  'maxPriceUnits',
  'maxDeliveryDays',
  'minRating',
  'sort',
];

export function ActionBar({ children }: { children: ReactNode }) {
  return <div className="inline-links action-bar">{children}</div>;
}

export function CatalogFilters({
  locale,
  operation,
  query,
  options,
}: {
  locale: Locale;
  operation: Operation;
  query: Record<string, string>;
  options: Choices;
}) {
  const schema = operations[operation].query;
  return (
    <form method="get" className="filters">
      {query.storeId && <input type="hidden" name="storeId" value={query.storeId} />}
      {filters.map((key) => {
        const entry = schema[key];
        if (!entry) return null;
        const spec = resolve(entry);
        const choices =
          options[key] ??
          spec.enum?.map((value) => ({
            value: String(value),
            label: enumLabel(locale, String(value)),
          }));
        return (
          <label key={key}>
            <span>{field(locale, key)}</span>
            {choices ? (
              <select name={key} defaultValue={query[key] ?? ''}>
                <option value="">{choose(locale, 'الكل', 'All')}</option>
                {choices.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                name={key}
                type={key === 'q' ? 'search' : 'number'}
                min={spec.minimum ?? (key === 'q' ? undefined : 0)}
                max={spec.maximum}
                step={spec.type === 'number' ? 'any' : undefined}
                defaultValue={query[key]}
              />
            )}
          </label>
        );
      })}
      <button className="button primary">{choose(locale, 'تطبيق', 'Apply filters')}</button>
    </form>
  );
}
