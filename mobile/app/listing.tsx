import * as Crypto from 'expo-crypto';
import { useCart } from '../src/state/cart';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { api, unwrap } from '../src/api/client';
import { useLoad } from '../src/use-load';
import { useSession } from '../src/state/session';
import { Page, Copy, Card, Button, Busy, Failure, Field, Heading } from '../src/ui';
import { CatalogPhoto } from '../src/catalog-photo';
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
  const isProduct = item && 'storeId' in item;
  const isFreelance = item && 'kind' in item && item.kind === 'FREELANCE';
  const backLabel = isProduct
    ? ar
      ? 'المتاجر المنزلية'
      : 'Home stores'
    : isFreelance
      ? ar
        ? 'خدمات العمل الحر'
        : 'Freelance services'
      : ar
        ? 'السوق'
        : 'Marketplace';
  return (
    <Page backLabel={backLabel}>
      {result.loading && <Busy />}
      {(result.error || error) && <Failure message={result.error || error} />}
      {item && (
        <>
          <Heading>{ar ? item.titleAr : item.titleEn}</Heading>
          {'storeId' in item && (
            <Button
              variant="link"
              title={ar ? 'صفحة المتجر' : 'Visit store'}
              onPress={() => router.push({ pathname: '/store', params: { id: item.storeId } })}
            />
          )}
          <CatalogPhoto id={item.photoIds[0]} style={isProduct ? s.productPhoto : s.servicePhoto} />
          <Card>
            <View style={s.priceRow}>
              <View style={s.price}>
                <Copy variant="muted">{ar ? 'السعر' : 'Price'}</Copy>
                <Copy variant="price" style={s.amount}>
                  {money(item.price)}
                </Copy>
              </View>
              {'availableStock' in item && (
                <Copy variant="muted">
                  {item.availableStock} {ar ? 'متاح' : 'in stock'}
                </Copy>
              )}
              {'deliveryDays' in item && item.deliveryDays !== null && (
                <Copy variant="muted">
                  {item.deliveryDays} {ar ? 'أيام للتسليم' : 'days to deliver'}
                </Copy>
              )}
            </View>
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
            {isFreelance &&
              (user ? (
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
              ) : (
                <>
                  <Button
                    title={ar ? 'اطلب الخدمة' : 'Request service'}
                    onPress={() => router.push('/auth')}
                  />
                  <Copy variant="muted">
                    {ar ? 'سجّل الدخول لإرسال طلب الخدمة.' : 'Sign in to send a service request.'}
                  </Copy>
                </>
              ))}
          </Card>
          <View style={s.about}>
            <Heading small>
              {isProduct
                ? ar
                  ? 'عن المنتج'
                  : 'About the product'
                : ar
                  ? 'عن الخدمة'
                  : 'About the service'}
            </Heading>
            <Copy>{ar ? item.descriptionAr : item.descriptionEn}</Copy>
          </View>
          {item.photoIds.slice(1).map((photoId) => (
            <CatalogPhoto key={photoId} id={photoId} style={s.servicePhoto} />
          ))}
        </>
      )}
    </Page>
  );
}

const s = StyleSheet.create({
  servicePhoto: { aspectRatio: 350 / 185, borderRadius: 17 },
  productPhoto: { aspectRatio: 350 / 172, borderRadius: 17 },
  priceRow: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  price: { flex: 1, minWidth: 110 },
  amount: { fontSize: 22, lineHeight: 28 },
  about: { gap: 5 },
});
