import { useRef, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import * as Crypto from 'expo-crypto';
import type { ApiSchemas } from '../src/api/contracts';
import { api, unwrap } from '../src/api/client';
import { useCart } from '../src/state/cart';
import { useSession } from '../src/state/session';
import { useLoad } from '../src/use-load';
import { money } from '../src/money';
import { Page, Card, Copy, Button, Failure, Busy } from '../src/ui';
export default function Cart() {
  const { lines, remove, clear } = useCart();
  const { locale, user } = useSession();
  const ar = locale === 'ar';
  const [addressId, setAddress] = useState('');
  const [method, setMethod] = useState<ApiSchemas['DeliveryMethod']>('SELLER');
  const [preview, setPreview] = useState<ApiSchemas['StorePreview'] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const key = useRef<string | null>(null);
  const addresses = useLoad(
    async () => (user ? unwrap(await api.GET('/api/v1/me/addresses')) : null),
    [user?.id],
  );
  async function review() {
    if (!lines[0]) return;
    setBusy(true);
    setError('');
    try {
      setPreview(
        unwrap(
          await api.POST('/api/v1/orders/store-preview', {
            params: { header: { 'Idempotency-Key': Crypto.randomUUID() } },
            body: {
              storeId: lines[0].product.storeId,
              addressId,
              method,
              items: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
            },
          }),
        ),
      );
      key.current = null;
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function checkout() {
    if (!preview) return;
    setBusy(true);
    setError('');
    key.current ??= Crypto.randomUUID();
    try {
      const result = unwrap(
        await api.POST('/api/v1/orders/store-checkout', {
          body: { draftOrderId: preview.order.id, termsAccepted: true },
          params: {
            header: { 'If-Match': `"${preview.order.version}"`, 'Idempotency-Key': key.current! },
          },
        }),
      );
      clear();
      router.replace({ pathname: '/order', params: { id: result.order.id } });
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title={ar ? 'السلة' : 'Cart'}>
      {(error || addresses.error) && <Failure message={error || addresses.error} />}
      {busy && <Busy />}
      {!lines.length && <Copy>{ar ? 'السلة فارغة' : 'Cart is empty'}</Copy>}
      {lines.map((line) => (
        <Card key={line.product.id}>
          <Copy>
            {ar ? line.product.titleAr : line.product.titleEn} × {line.quantity}
          </Copy>
          <Button
            title={ar ? 'إزالة' : 'Remove'}
            disabled={busy}
            onPress={() => {
              remove(line.product.id);
              setPreview(null);
            }}
          />
        </Card>
      ))}
      {addresses.data?.items.map((address) => (
        <Button
          key={address.id}
          title={`${address.id === addressId ? '✓ ' : ''}${address.label} · ${address.details}`}
          onPress={() => {
            setAddress(address.id);
            setPreview(null);
          }}
        />
      ))}
      {(['SELLER', 'PLATFORM_DRIVER'] as const).map((value) => (
        <Button
          key={value}
          title={
            value === 'SELLER'
              ? ar
                ? 'توصيل البائع'
                : 'Seller delivery'
              : ar
                ? 'سائق المنصة'
                : 'Platform driver'
          }
          onPress={() => {
            setMethod(value);
            setPreview(null);
          }}
        />
      ))}
      <Button
        title={ar ? 'مراجعة السعر والتوصيل' : 'Review price and delivery'}
        disabled={!addressId || !lines.length || busy}
        onPress={() => void review()}
      />
      {preview && (
        <Card>
          <Copy>{money(preview.order.total)}</Copy>
          <Copy>{money(preview.order.deliveryFee)}</Copy>
          <Copy>{preview.order.terms.promisedDeliveryAt}</Copy>
          <Button
            title={ar ? 'تأكيد الدفع التجريبي' : 'Confirm simulated payment'}
            disabled={busy}
            onPress={() =>
              Alert.alert(
                ar ? 'تأكيد الشروط' : 'Confirm terms',
                `${preview.order.terms.scope}\n${money(preview.order.total)}`,
                [
                  { text: ar ? 'رجوع' : 'Back', style: 'cancel' },
                  { text: ar ? 'أوافق' : 'Accept', onPress: () => void checkout() },
                ],
              )
            }
          />
        </Card>
      )}
    </Page>
  );
}
