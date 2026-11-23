'use client';
import { useState } from 'react';
import { loadShippingOptions } from '../lib/actions/market';
import type { ApiSchemas } from '../lib/api/contracts';
import { amount, choose, timestamp, type Locale } from '../lib/locale';
import { enumLabel, errorLabel, field } from '../lib/labels';
import { CommandForm, type Choices } from './command-form';

export function Checkout({
  locale,
  storeId,
  productId,
  currency,
  addresses,
  products,
}: {
  locale: Locale;
  storeId: string;
  productId: string;
  currency: ApiSchemas['Currency'];
  addresses: Choices[string];
  products: Choices[string];
}) {
  const [addressId, setAddress] = useState('');
  const [result, setResult] = useState<ApiSchemas['DeliveryOptions']>();
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  async function check(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    setResult(undefined);
    try {
      const next = await loadShippingOptions(storeId, addressId, currency);
      if (!next.ok) setNotice(errorLabel(locale, next.code));
      else setResult(next.data);
    } catch {
      setNotice(errorLabel(locale, 'CONNECTION_ERROR'));
    } finally {
      setBusy(false);
    }
  }
  const methods = result?.methods ?? [];
  return (
    <div className="stack">
      <form onSubmit={check} className="command-form">
        <label>
          {field(locale, 'addressId')}
          <select
            name="addressId"
            value={addressId}
            disabled={busy}
            required
            onChange={(event) => {
              setAddress(event.target.value);
              setResult(undefined);
              setNotice('');
            }}
          >
            <option value="">{choose(locale, 'اختر عنواناً', 'Select an address')}</option>
            {addresses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <button className="button soft" disabled={busy}>
          {busy
            ? choose(locale, 'جارٍ التحقق…', 'Checking…')
            : choose(locale, 'عرض خيارات التوصيل', 'Show delivery options')}
        </button>
      </form>
      {notice && (
        <p role="alert" className="notice">
          {notice}
        </p>
      )}
      {result &&
        (result.serviceable && methods.length > 0 ? (
          <>
            <ul className="data-list">
              {methods.map((item) => (
                <li key={item.method}>
                  {enumLabel(locale, item.method)} · <bdi>{amount(locale, item.fee)}</bdi>
                  {item.promisedAt && (
                    <>
                      {' '}
                      · <time dateTime={item.promisedAt}>{timestamp(locale, item.promisedAt)}</time>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <CommandForm
              key={addressId}
              name="previewStoreCheckout"
              locale={locale}
              defaults={{ storeId, addressId }}
              initial={{ items: [{ productId, quantity: 1 }] }}
              choices={{
                method: methods.map((item) => ({
                  value: item.method,
                  label: enumLabel(locale, item.method) + ' · ' + amount(locale, item.fee),
                })),
                productId: products,
              }}
              go="order"
              open
            />
          </>
        ) : (
          <p role="status" className="notice">
            {choose(
              locale,
              'التوصيل غير متاح إلى هذا العنوان.',
              'Delivery is unavailable at this address.',
            )}
          </p>
        ))}
    </div>
  );
}
