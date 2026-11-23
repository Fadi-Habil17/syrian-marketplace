import { useState } from 'react';
import * as Crypto from 'expo-crypto';
import { api, unwrap } from '../src/api/client';
import { useLoad } from '../src/use-load';
import { useSession } from '../src/state/session';
import { Page, Copy, Card, Button, Busy, Failure } from '../src/ui';
import { money } from '../src/money';
export default function Driver() {
  const { user, locale } = useSession();
  const ar = locale === 'ar';
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const jobs = useLoad(
    async () =>
      user?.roles.includes('DELIVERY_DRIVER') ? unwrap(await api.GET('/api/v1/driver/jobs')) : null,
    [user?.id],
  );
  async function accept(id: string, version: number) {
    setBusy(true);
    try {
      unwrap(
        await api.POST('/api/v1/deliveries/{deliveryId}/accept', {
          body: { accepted: true },
          params: {
            path: { deliveryId: id },
            header: { 'If-Match': `"${version}"`, 'Idempotency-Key': Crypto.randomUUID() },
          },
        }),
      );
      await jobs.reload();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title={ar ? 'مهام التوصيل' : 'Delivery jobs'}>
      {jobs.loading && <Busy />}
      {(error || jobs.error) && (
        <Failure message={error || jobs.error} retry={() => void jobs.reload()} />
      )}
      {jobs.data?.items.length === 0 && (
        <Copy>{ar ? 'لا توجد مهام متاحة بمنطقتك' : 'No jobs in your area'}</Copy>
      )}
      {jobs.data?.items.map((job) => (
        <Card key={job.id}>
          <Copy>{job.summary}</Copy>
          <Copy>{money(job.fee)}</Copy>
          <Button
            title={ar ? 'قبول المهمة' : 'Accept job'}
            disabled={busy}
            onPress={() => void accept(job.id, job.orderVersion)}
          />
        </Card>
      ))}
    </Page>
  );
}
