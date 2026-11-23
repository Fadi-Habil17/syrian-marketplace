import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { api, unwrap } from '../src/api/client';
import { useSession } from '../src/state/session';
import { Page, Copy, Field, Button, Failure } from '../src/ui';
export default function Review() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { locale } = useSession();
  const ar = locale === 'ar';
  const [stars, setStars] = useState(5);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  async function submit() {
    setBusy(true);
    try {
      unwrap(
        await api.POST('/api/v1/orders/{orderId}/review', {
          params: { path: { orderId: id }, header: { 'Idempotency-Key': Crypto.randomUUID() } },
          body: { stars, body },
        }),
      );
      setSaved(true);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title={ar ? 'تقييم الطلب' : 'Review order'}>
      {error && <Failure message={error} />}
      {saved ? (
        <Copy>{ar ? 'تم حفظ التقييم' : 'Review saved'}</Copy>
      ) : (
        <>
          {[1, 2, 3, 4, 5].map((value) => (
            <Button
              key={value}
              title={`${value === stars ? '✓ ' : ''}${'★'.repeat(value)}`}
              onPress={() => setStars(value)}
            />
          ))}
          <Field
            label={ar ? 'تعليقك' : 'Your review'}
            multiline
            value={body}
            onChangeText={setBody}
          />
          <Button
            title={ar ? 'نشر التقييم' : 'Publish review'}
            disabled={busy}
            onPress={() => void submit()}
          />
        </>
      )}
    </Page>
  );
}
