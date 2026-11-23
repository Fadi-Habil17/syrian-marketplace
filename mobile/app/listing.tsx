import * as Crypto from 'expo-crypto';
import { useCart } from '../src/state/cart';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { api, unwrap } from '../src/api/client';
import { useLoad } from '../src/use-load';
import { useSession } from '../src/state/session';
import { Page, Copy, Card, Button, Busy, Failure, Field } from '../src/ui';
import { money } from '../src/money';
export default function Listing() {
  const { id = '', product } = useLocalSearchParams<{ id: string; product: string }>();
  const cart = useCart();
  const { user, locale } = useSession();
  const ar = locale === 'ar';
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const result = useLoad(
    async () =>
      product === '1'
        ? unwrap(
            await api.GET('/api/v1/products/{productId}', { params: { path: { productId: id } } }),
          )
        : unwrap(
            await api.GET('/api/v1/listings/{listingId}', { params: { path: { listingId: id } } }),
          ),
    [id, product],
  );
  async function order() {
    if (!user) {
      router.push('/auth');
      return;
    }
    setBusy(true);
    try {
      const order = unwrap(
        await api.POST('/api/v1/orders/freelance', {
          params: { header: { 'Idempotency-Key': Crypto.randomUUID() } },
          body: { listingId: id, description },
        }),
      );
      router.push({ pathname: '/order', params: { id: order.id } });
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  const item = result.data;
  return (
    <Page title={ar ? 'التفاصيل' : 'Details'}>
      {result.loading && <Busy />}
      {(result.error || error) && <Failure message={result.error || error} />}
      {item && (
        <Card>
          <Copy>{ar ? item.titleAr : item.titleEn}</Copy>
          <Copy>{ar ? item.descriptionAr : item.descriptionEn}</Copy>
          <Copy>{money(item.price)}</Copy>
          {'storeId' in item && (
            <Button
              title={ar ? 'أضف للسلة' : 'Add to cart'}
              onPress={() => {
                try {
                  cart.add(item);
                  router.push('/cart');
                } catch (e) {
                  setError(String(e));
                }
              }}
            />
          )}
          {'kind' in item && item.kind === 'PROFESSIONAL_PACKAGE' && (
            <Button
              title={ar ? 'احجز الخدمة' : 'Book service'}
              onPress={() => router.push({ pathname: '/booking', params: { id } })}
            />
          )}
          {'kind' in item && item.kind === 'FREELANCE' && (
            <>
              <Field
                label={ar ? 'وصف طلبك' : 'Describe your request'}
                multiline
                value={description}
                onChangeText={setDescription}
              />
              <Button
                title={ar ? 'طلب الخدمة' : 'Request service'}
                disabled={busy || !description.trim()}
                onPress={() => void order()}
              />
            </>
          )}
        </Card>
      )}
    </Page>
  );
}
