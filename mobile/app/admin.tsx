import { useState } from 'react';
import * as Crypto from 'expo-crypto';
import { api, unwrap } from '../src/api/client';
import { useLoad } from '../src/use-load';
import { useSession } from '../src/state/session';
import type { ApiSchemas } from '../src/api/contracts';
import { Page, Copy, Card, Button, Busy, Failure, Field } from '../src/ui';
export default function Admin() {
  const { user, locale } = useSession();
  const ar = locale === 'ar';
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const queue = useLoad(
    async () =>
      user?.roles.includes('ADMIN') ? unwrap(await api.GET('/api/v1/admin/moderation')) : null,
    [user?.id],
  );
  async function decide(resourceId: string, outcome: ApiSchemas['ModerationOutcome']) {
    setBusy(true);
    setError('');
    try {
      unwrap(
        await api.POST('/api/v1/admin/moderation/{resourceId}/decision', {
          params: { path: { resourceId }, header: { 'Idempotency-Key': Crypto.randomUUID() } },
          body: { reason, outcome },
        }),
      );
      await queue.reload();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title={ar ? 'إدارة المحتوى' : 'Content moderation'}>
      {!user?.roles.includes('ADMIN') ? (
        <Copy>{ar ? 'يلزم حساب إدارة' : 'Admin account required'}</Copy>
      ) : (
        <>
          <Field
            label={ar ? 'سبب القرار' : 'Decision reason'}
            multiline
            value={reason}
            onChangeText={setReason}
          />
          {queue.loading && <Busy />}
          {(error || queue.error) && (
            <Failure message={error || queue.error} retry={() => void queue.reload()} />
          )}
          {queue.data?.items.length === 0 && (
            <Copy>{ar ? 'قائمة المراجعة فارغة' : 'Moderation queue is empty'}</Copy>
          )}
          {queue.data?.items.map((item) => (
            <Card key={item.id}>
              <Copy>
                {item.resourceType} · {item.status}
              </Copy>
              {item.content && (
                <Copy>
                  {'titleAr' in item.content
                    ? ar
                      ? item.content.titleAr
                      : item.content.titleEn
                    : 'title' in item.content
                      ? item.content.title
                      : 'nameAr' in item.content
                        ? ar
                          ? item.content.nameAr
                          : item.content.nameEn
                        : 'body' in item.content
                          ? item.content.body
                          : ''}
                </Copy>
              )}
              {(['APPROVE', 'HIDE', 'REJECT', 'RESTORE'] as const).map((outcome, i) => (
                <Button
                  key={outcome}
                  disabled={busy || !reason.trim()}
                  title={
                    (ar
                      ? ['موافقة', 'إخفاء', 'رفض', 'استعادة']
                      : ['Approve', 'Hide', 'Reject', 'Restore'])[i]!
                  }
                  onPress={() => void decide(item.resourceId, outcome)}
                />
              ))}
            </Card>
          ))}
        </>
      )}
    </Page>
  );
}
