import { api, unwrap } from '../src/api/client';
import { useLoad } from '../src/use-load';
import { useSession } from '../src/state/session';
import { Page, Copy, Card, Button, Busy, Failure } from '../src/ui';
export default function Notifications() {
  const { user, locale } = useSession();
  const ar = locale === 'ar';
  const result = useLoad(
    async () => (user ? unwrap(await api.GET('/api/v1/notifications')) : null),
    [user?.id],
  );
  return (
    <Page title={ar ? 'الإشعارات' : 'Notifications'}>
      {result.loading && <Busy />}
      {result.error && <Failure message={result.error} retry={() => void result.reload()} />}
      {result.data?.items.length === 0 && (
        <Copy>{ar ? 'لا توجد إشعارات' : 'No notifications'}</Copy>
      )}
      {result.data?.items.map((item) => (
        <Card key={item.id}>
          <Copy>{item.category}</Copy>
          <Copy>{new Date(item.createdAt).toLocaleString(locale)}</Copy>
          {!item.readAt && (
            <Button
              title={ar ? 'تعليم كمقروء' : 'Mark read'}
              onPress={() => {
                void api
                  .POST('/api/v1/notifications/{notificationId}/read', {
                    params: { path: { notificationId: item.id } },
                  })
                  .then(unwrap)
                  .then(() => result.reload());
              }}
            />
          )}
        </Card>
      ))}
    </Page>
  );
}
