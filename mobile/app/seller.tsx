import { router } from 'expo-router';
import { api, unwrap } from '../src/api/client';
import { useLoad } from '../src/use-load';
import { useSession } from '../src/state/session';
import { Page, Copy, Card, Button, Busy, Failure } from '../src/ui';
export default function Seller() {
  const { user, locale } = useSession();
  const ar = locale === 'ar';
  const result = useLoad(
    async () =>
      user
        ? unwrap(await api.GET('/api/v1/listings', { params: { query: { mine: true } } }))
        : null,
    [user?.id],
  );
  return (
    <Page title={ar ? 'لوحة أعمالي' : 'Business dashboard'}>
      <Copy>{user?.activeBusinessProfile?.title}</Copy>
      <Button
        title={ar ? 'إدارة الطلبات' : 'Manage orders'}
        onPress={() => router.push('/orders')}
      />
      {result.loading && <Busy />}
      {result.error && <Failure message={result.error} retry={() => void result.reload()} />}
      {result.data?.items.map((item) => (
        <Card key={item.id}>
          <Copy>{ar ? item.titleAr : item.titleEn}</Copy>
          <Copy>{item.status}</Copy>
          <Button
            title={ar ? 'التفاصيل' : 'Details'}
            onPress={() => router.push({ pathname: '/listing', params: { id: item.id } })}
          />
        </Card>
      ))}
    </Page>
  );
}
