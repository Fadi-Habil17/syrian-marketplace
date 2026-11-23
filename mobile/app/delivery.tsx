import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { api, unwrap } from '../src/api/client';
import { useLoad } from '../src/use-load';
import { useSession } from '../src/state/session';
import { Page, Copy, Field, Button, Failure, Card } from '../src/ui';
import { money } from '../src/money';
export default function Delivery() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { locale, user } = useSession();
  const ar = locale === 'ar';
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const result = useLoad(
    async () =>
      unwrap(
        await api.GET('/api/v1/deliveries/{deliveryId}', { params: { path: { deliveryId: id } } }),
      ),
    [id, user?.id],
  );
  async function record(kind: 'pickup' | 'dropoff') {
    if (!result.data) return;
    setBusy(true);
    setError('');
    try {
      const params = {
        path: { deliveryId: id },
        header: {
          'Idempotency-Key': Crypto.randomUUID(),
          'If-Match': `"${result.data.orderVersion}"`,
        },
      };
      const body = { notes };
      unwrap(
        kind === 'pickup'
          ? await api.POST('/api/v1/deliveries/{deliveryId}/pickup', { params, body })
          : await api.POST('/api/v1/deliveries/{deliveryId}/dropoff', { params, body }),
      );
      await result.reload();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  const delivery = result.data;
  return (
    <Page title={ar ? 'Ø§Ù„ØªÙˆØµÙŠÙ„' : 'Delivery'}>
      {(error || result.error) && (
        <Failure message={error || result.error} retry={() => void result.reload()} />
      )}
      {delivery && (
        <>
          <Card>
            <Copy>{delivery.status}</Copy>
            <Copy>{money(delivery.fee)}</Copy>
            <Copy>{delivery.address.details}</Copy>
            {delivery.events.map((event) => (
              <Copy key={event.id}>
                {event.type} Â· {new Date(event.occurredAt).toLocaleString(locale)}
              </Copy>
            ))}
          </Card>
          {user?.roles.includes('DELIVERY_DRIVER') && (
            <>
              <Field
                label={ar ? 'Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø§Ù„ØªØ³Ù„ÙŠÙ…' : 'Delivery notes'}
                multiline
                value={notes}
                onChangeText={setNotes}
              />
              <Button
                title={ar ? 'ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù…' : 'Record pickup'}
                disabled={busy || !notes.trim()}
                onPress={() => void record('pickup')}
              />
              <Button
                title={ar ? 'ØªØ³Ø¬ÙŠÙ„ Ø§Ù„ØªØ³Ù„ÙŠÙ…' : 'Record drop-off'}
                disabled={busy || !notes.trim()}
                onPress={() => void record('dropoff')}
              />
            </>
          )}
        </>
      )}
    </Page>
  );
}
