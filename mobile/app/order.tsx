import { useRef, useState } from 'react';
import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { api, isDefinitiveFailure, unwrap } from '../src/api/client';
import { useLoad } from '../src/use-load';
import { useSession } from '../src/state/session';
import { Page, Copy, Card, Button, Busy, Failure } from '../src/ui';
import { OrderActions } from '../src/order-actions';
import { money } from '../src/money';
export default function Order() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { locale, user } = useSession();
  const ar = locale === 'ar';
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const intent = useRef<{ kind: string; key: string; version: number } | null>(null);
  const result = useLoad(
    async () => ({
      order: unwrap(
        await api.GET('/api/v1/orders/{orderId}', { params: { path: { orderId: id } } }),
      ),
      actions: unwrap(
        await api.GET('/api/v1/orders/{orderId}/actions', { params: { path: { orderId: id } } }),
      ),
    }),
    [id, user?.id],
  );
  async function pay(kind: 'deposit' | 'balance') {
    if (!result.data || busy) return;
    setBusy(true);
    setError('');
    if (!intent.current || intent.current.kind !== kind)
      intent.current = { kind, key: Crypto.randomUUID(), version: result.data.order.version };
    const headers = {
      'Idempotency-Key': intent.current.key,
      'If-Match': `"${intent.current.version}"`,
    };
    try {
      const params = { path: { orderId: id }, header: headers };
      unwrap(
        kind === 'deposit'
          ? await api.POST('/api/v1/orders/{orderId}/payments/deposit', {
              params,
              body: { termsAccepted: true },
            })
          : await api.POST('/api/v1/orders/{orderId}/payments/balance', {
              params,
              body: { termsAccepted: true },
            }),
      );
      intent.current = null;
      await result.reload();
    } catch (e) {
      if (isDefinitiveFailure(e)) intent.current = null;
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  const order = result.data?.order;
  return (
    <Page title={ar ? 'تفاصيل الطلب' : 'Order details'}>
      {result.loading && <Busy />}
      {(error || result.error) && (
        <Failure message={error || result.error} retry={() => void result.reload()} />
      )}
      {order && (
        <>
          <Card>
            <Copy>{order.state}</Copy>
            <Button
              title={ar ? 'محادثة الطلب' : 'Order chat'}
              onPress={() => router.push({ pathname: '/chat', params: { id } })}
            />
            <Button
              title={ar ? 'النزاعات والدعم' : 'Disputes and support'}
              onPress={() => router.push({ pathname: '/cases', params: { id } })}
            />
            {order.state === 'COMPLETED' && (
              <Button
                title={ar ? 'تقييم الطلب' : 'Review order'}
                onPress={() => router.push({ pathname: '/review', params: { id } })}
              />
            )}
            {order.store && (
              <Button
                title={ar ? 'متابعة التوصيل' : 'Track delivery'}
                onPress={() =>
                  router.push({ pathname: '/delivery', params: { id: order.store!.deliveryId } })
                }
              />
            )}
            <Copy>{order.terms.scope}</Copy>
            <Copy>
              {ar ? 'الإجمالي' : 'Total'}: {money(order.total)}
            </Copy>
            <Copy>
              {ar ? 'المبلغ المحجوز' : 'Held'}: {money(order.held)}
            </Copy>
            <Copy>
              {ar ? 'دفعة البداية' : 'Deposit'}: {money(order.deposit)}
            </Copy>
            <Copy>
              {ar ? 'الرصيد المطلوب' : 'Balance'}: {money(order.balance)}
            </Copy>
            {order.deadlines.map((deadline, i) => (
              <Copy key={i}>
                {Object.values(deadline)
                  .filter((v) => typeof v === 'string')
                  .join(' · ')}
              </Copy>
            ))}
            <Copy>
              {ar
                ? 'الدفع تجريبي. يخضع تحرير المبلغ لشروط الطلب والنزاعات.'
                : 'Simulated payment. Release is subject to order and dispute terms.'}
            </Copy>
          </Card>
          <OrderActions
            order={order}
            actions={result.data?.actions.items ?? []}
            reload={result.reload}
          />
          {result.data?.actions.items
            .filter((a) => a.operationId === 'holdDeposit' || a.operationId === 'holdBalance')
            .map((action) => (
              <Button
                key={action.operationId}
                disabled={!action.enabled || busy}
                title={
                  action.operationId === 'holdDeposit'
                    ? ar
                      ? 'حجز دفعة البداية'
                      : 'Hold deposit'
                    : ar
                      ? 'حجز الرصيد'
                      : 'Hold balance'
                }
                onPress={() =>
                  Alert.alert(
                    ar ? 'تأكيد الحجز التجريبي' : 'Confirm simulated hold',
                    `${order.terms.scope}\n${money(action.operationId === 'holdDeposit' ? order.deposit : order.balance)}`,
                    [
                      { text: ar ? 'رجوع' : 'Back', style: 'cancel' },
                      {
                        text: ar ? 'أوافق على الشروط' : 'Accept terms',
                        onPress: () =>
                          void pay(action.operationId === 'holdDeposit' ? 'deposit' : 'balance'),
                      },
                    ],
                  )
                }
              />
            ))}
        </>
      )}
    </Page>
  );
}
