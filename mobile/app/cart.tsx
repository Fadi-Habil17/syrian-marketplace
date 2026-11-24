import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import * as Crypto from 'expo-crypto';
import type { ApiSchemas } from '../src/api/contracts';
import { api, isDefinitiveFailure, unwrap } from '../src/api/client';
import {
  beginCheckout,
  finishCheckout,
  readCheckoutIntent,
  type CheckoutIntent,
} from '../src/checkout-intent';
import { useCart } from '../src/state/cart';
import { useSession } from '../src/state/session';
import { useLoad } from '../src/use-load';
import { money } from '../src/money';
import { Page, Card, Copy, Button, Failure, Busy, ConfirmDialog } from '../src/ui';
export default function Cart() {
  const { lines, remove, clear } = useCart();
  const { locale, user } = useSession();
  const ar = locale === 'ar';
  const [addressId, setAddress] = useState('');
  const [method, setMethod] = useState<ApiSchemas['DeliveryMethod']>('SELLER');
  const [preview, setPreview] = useState<ApiSchemas['StorePreview'] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pending = useRef<CheckoutIntent | null>(null);
  const [paymentPending, setPaymentPending] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const cartFingerprint = JSON.stringify(lines.map((line) => [line.product.id, line.quantity]));
  useEffect(() => {
    setPreview(null);
    setConfirmOpen(false);
  }, [cartFingerprint]);
  useEffect(() => {
    let active = true;
    readCheckoutIntent(user?.id ?? 'signed-out')
      .then((intent) => {
        if (!active) return;
        pending.current = intent;
        setPaymentPending(!!intent);
        setCheckingPayment(false);
      })
      .catch((e) => {
        if (active) setError(String(e));
      });
    return () => {
      active = false;
    };
  }, [user?.id]);
  const addresses = useLoad(
    async () => (user ? unwrap(await api.GET('/api/v1/me/addresses')) : null),
    [user?.id],
  );
  async function review() {
    if (!user || !lines[0] || pending.current || checkingPayment || busy) return;
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
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function checkout() {
    if (!user || busy || (!preview && !pending.current)) return;
    setBusy(true);
    setError('');
    try {
      const intent =
        pending.current ??
        (await beginCheckout(user.id, preview!.order.id, preview!.order.version));
      pending.current = intent;
      setPaymentPending(true);
      const result = unwrap(
        await api.POST('/api/v1/orders/store-checkout', {
          body: { draftOrderId: intent.draftOrderId, termsAccepted: true },
          params: {
            header: { 'If-Match': `"${intent.version}"`, 'Idempotency-Key': intent.key },
          },
        }),
      );
      await finishCheckout(intent);
      pending.current = null;
      setPaymentPending(false);
      clear();
      router.replace({ pathname: '/order', params: { id: result.order.id } });
    } catch (e) {
      if (isDefinitiveFailure(e) && pending.current) {
        try {
          await finishCheckout(pending.current);
          pending.current = null;
          setPaymentPending(false);
          setPreview(null);
        } catch {
          /* Retain the durable key if local deletion fails. */
        }
      }
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title={ar ? 'السلة' : 'Cart'}>
      {(error || addresses.error) && <Failure message={error || addresses.error} />}
      {busy && <Busy />}
      {paymentPending && (
        <Card>
          <Copy>
            {ar
              ? 'نتيجة دفع سابق لم تتأكد. أعد التحقق قبل بدء طلب جديد.'
              : 'A previous payment outcome is pending. Check it before starting another order.'}
          </Copy>
          <Button
            title={ar ? 'التحقق من الدفع السابق' : 'Check previous payment'}
            disabled={busy}
            onPress={() => void checkout()}
          />
        </Card>
      )}
      {!lines.length && <Copy>{ar ? 'السلة فارغة' : 'Cart is empty'}</Copy>}
      {lines.map((line) => (
        <Card key={line.product.id}>
          <Copy>
            {ar ? line.product.titleAr : line.product.titleEn} × {line.quantity}
          </Copy>
          <Button
            title={ar ? 'إزالة' : 'Remove'}
            disabled={busy || paymentPending || checkingPayment}
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
          disabled={busy || paymentPending || checkingPayment}
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
          disabled={busy || paymentPending || checkingPayment}
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
        disabled={!user || !addressId || !lines.length || busy || paymentPending || checkingPayment}
        onPress={() => void review()}
      />
      {preview && !paymentPending && (
        <Card>
          <Copy>{money(preview.order.total)}</Copy>
          <Copy>{money(preview.order.deliveryFee)}</Copy>
          <Copy>{preview.order.terms.promisedDeliveryAt}</Copy>
          <Button
            title={ar ? 'تأكيد الدفع بالمحاكاة' : 'Confirm simulated payment'}
            disabled={busy}
            onPress={() => setConfirmOpen(true)}
          />
          <ConfirmDialog
            visible={confirmOpen}
            title={ar ? 'تأكيد الشروط' : 'Confirm terms'}
            message={`${preview.order.terms.scope}\n${money(preview.order.total)}`}
            cancelLabel={ar ? 'رجوع' : 'Back'}
            confirmLabel={ar ? 'أوافق' : 'Accept'}
            onCancel={() => setConfirmOpen(false)}
            onConfirm={() => {
              setConfirmOpen(false);
              void checkout();
            }}
          />
        </Card>
      )}
    </Page>
  );
}
