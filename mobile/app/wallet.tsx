import { api, unwrap } from '../src/api/client';
import { useLoad } from '../src/use-load';
import { useSession } from '../src/state/session';
import { Page, Copy, Card, Busy, Failure } from '../src/ui';
import { money } from '../src/money';
export default function Wallet() {
  const { locale, user } = useSession();
  const result = useLoad(
    async () => (user ? unwrap(await api.GET('/api/v1/wallets')) : null),
    [user?.id],
  );
  return (
    <Page title={locale === 'ar' ? 'المحفظة التجريبية' : 'Simulated wallet'}>
      {result.loading && <Busy />}
      {result.error && <Failure message={result.error} retry={() => void result.reload()} />}
      {result.data?.items.map((wallet) => (
        <Card key={wallet.currency}>
          <Copy>{wallet.currency}</Copy>
          <Copy>{money({ currency: wallet.currency, units: wallet.availableUnits })}</Copy>
        </Card>
      ))}
    </Page>
  );
}
