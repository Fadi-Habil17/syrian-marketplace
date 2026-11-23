import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { api, unwrap } from '../src/api/client';
import { useLoad } from '../src/use-load';
import { useSession } from '../src/state/session';
import { Page, Copy, Field, Button, Failure, Card } from '../src/ui';
export default function Cases() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { locale, user } = useSession();
  const ar = locale === 'ar';
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const result = useLoad(
    async () => ({
      cases: unwrap(
        await api.GET('/api/v1/orders/{orderId}/cases', { params: { path: { orderId: id } } }),
      ),
      order: unwrap(
        await api.GET('/api/v1/orders/{orderId}', { params: { path: { orderId: id } } }),
      ),
    }),
    [id, user?.id],
  );
  async function submit() {
    if (!result.data) return;
    setBusy(true);
    setError('');
    try {
      unwrap(
        await api.POST('/api/v1/orders/{orderId}/cases', {
          params: {
            path: { orderId: id },
            header: {
              'Idempotency-Key': Crypto.randomUUID(),
              'If-Match': `"${result.data.order.version}"`,
            },
          },
          body: { kind: 'DISPUTE', reason },
        }),
      );
      setReason('');
      await result.reload();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title={ar ? 'النزاعات والدعم' : 'Disputes and support'}>
      {(error || result.error) && (
        <Failure message={error || result.error} retry={() => void result.reload()} />
      )}
      {result.data?.cases.items.map((item) => (
        <Card key={item.id}>
          <Copy>{item.status}</Copy>
          <Copy>{item.reason}</Copy>
          {item.parties.map((party) => (
            <Copy key={party.userId}>
              {party.role} · {new Date(party.evidenceDeadlineAt).toLocaleString(locale)}
            </Copy>
          ))}
        </Card>
      ))}
      <Field
        label={ar ? 'سبب النزاع' : 'Dispute reason'}
        multiline
        value={reason}
        onChangeText={setReason}
      />
      <Button
        title={ar ? 'فتح نزاع' : 'Open dispute'}
        disabled={busy || !reason.trim()}
        onPress={() => void submit()}
      />
    </Page>
  );
}
