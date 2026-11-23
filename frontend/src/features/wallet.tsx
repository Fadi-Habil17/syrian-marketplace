import Link from 'next/link';
import { api } from '../lib/api/client';
import { amount, choose, type Locale } from '../lib/locale';
import { Data, Empty, Heading, NextPage, Panel } from './ui';

export async function Wallet({
  locale,
  token,
  query,
}: {
  locale: Locale;
  token?: string;
  query: Record<string, string>;
}) {
  const currency = query.currency === 'USD' ? 'USD' : 'SYP';
  const [wallets, transactions] = await Promise.all([
    api('listWallets', { token }),
    api('listWalletTransactions', { token, params: { currency }, query: { cursor: query.cursor } }),
  ]);
  return (
    <>
      <Heading
        description={choose(
          locale,
          'الأرصدة والمعاملات التالية محاكاة.',
          'These balances and transactions are simulated.',
        )}
      >
        {choose(locale, 'المحفظة', 'Wallet')}
      </Heading>
      <div className="catalog-grid">
        {wallets.items.map((wallet) => (
          <Link key={wallet.id} href={'?currency=' + wallet.currency} className="panel">
            <strong>{wallet.currency}</strong>
            <span className="price large">
              <bdi>
                {amount(locale, { currency: wallet.currency, units: wallet.availableUnits })}
              </bdi>
            </span>
          </Link>
        ))}
      </div>
      <Panel title={choose(locale, 'المعاملات', 'Transactions') + ' · ' + currency}>
        {transactions.items.length ? (
          <Data locale={locale} value={transactions.items} />
        ) : (
          <Empty locale={locale} />
        )}
        <NextPage locale={locale} cursor={transactions.nextCursor} query={{ currency }} />
      </Panel>
    </>
  );
}
