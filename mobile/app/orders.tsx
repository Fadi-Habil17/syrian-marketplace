import { router } from 'expo-router';
import { api, unwrap } from '../src/api/client';
import { useLoad } from '../src/use-load';
import { useSession } from '../src/state/session';
import { Page, Copy, Card, Button, Busy, Failure } from '../src/ui';
import { money } from '../src/money';
export default function Orders() {
  const { user, locale } = useSession();
  const ar = locale === 'ar';
  const result = useLoad(
    async () => (user ? unwrap(await api.GET('/api/v1/orders')) : null),
    [user?.id],
  );
  return (
    <Page title={ar ? 'طلباتي' : 'My orders'}>
      {!user && (
        <Button title={ar ? 'تسجيل الدخول' : 'Sign in'} onPress={() => router.push('/auth')} />
      )}
      {result.loading && <Busy />}
      {result.error && <Failure message={result.error} retry={() => void result.reload()} />}
      {result.data?.items.length === 0 && <Copy>{ar ? 'ما عندك طلبات بعد' : 'No orders yet'}</Copy>}
      {result.data?.items.map((order) => (
        <Card key={order.id}>
          <Copy>
            {order.workspace} · {order.state}
          </Copy>
          <Copy>{money(order.total)}</Copy>
          <Button
            title={ar ? 'متابعة الطلب' : 'Track order'}
            onPress={() => router.push({ pathname: '/order', params: { id: order.id } })}
          />
        </Card>
      ))}
    </Page>
  );
}
