import { useState } from 'react';
import { api, unwrap } from './api/client';
import type { ApiSchemas } from './api/contracts';
import { useIntent } from './intent';
import { useSession } from './state/session';
import { Button, Card, Copy, Failure, Field } from './ui';
const labels = {
  agreeOrder: ['الموافقة على الاتفاق', 'Agree to terms'],
  acceptBooking: ['تأكيد الحجز', 'Confirm booking'],
  rejectOrder: ['رفض الطلب', 'Reject request'],
  startWork: ['بدء العمل', 'Start work'],
  confirmReceipt: ['تأكيد الاستلام', 'Confirm receipt'],
  acceptStoreOrder: ['قبول طلب المتجر', 'Accept store order'],
  markStoreReady: ['جاهز للتوصيل', 'Ready for delivery'],
  cancelOrder: ['إلغاء الطلب', 'Cancel order'],
  markReady: ['جاهز للدفع النهائي', 'Ready for balance'],
  recordProgress: ['تحديث سير العمل', 'Update progress'],
} as const;
type Action = keyof typeof labels;
export function OrderActions({
  order,
  actions,
  reload,
}: {
  order: ApiSchemas['Order'];
  actions: ApiSchemas['AllowedAction'][];
  reload: () => Promise<void>;
}) {
  const { locale } = useSession();
  const ar = locale === 'ar';
  const intent = useIntent();
  const [selected, setSelected] = useState<Action | null>(null);
  const [note, setNote] = useState('');
  const [dueAt, setDue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      const body =
        selected === 'agreeOrder'
          ? { scope: note, dueAt: new Date(dueAt).toISOString(), accepted: true as const }
          : selected === 'markReady'
            ? { note, completedScope: note.split('\n').filter(Boolean), previewFileIds: [] }
            : selected === 'recordProgress'
              ? { kind: 'UPDATE' as const, note }
              : ['rejectOrder', 'cancelOrder'].includes(selected)
                ? { reason: note }
                : { accepted: true as const };
      const params = {
        path: { orderId: order.id },
        header: {
          'If-Match': `"${order.version}"`,
          'Idempotency-Key': intent.key({ selected, body, version: order.version }),
        },
      };
      switch (selected) {
        case 'agreeOrder':
          unwrap(
            await api.POST('/api/v1/orders/{orderId}/agree', {
              params,
              body: { scope: note, dueAt: new Date(dueAt).toISOString(), accepted: true },
            }),
          );
          break;
        case 'acceptBooking':
          unwrap(
            await api.POST('/api/v1/orders/{orderId}/accept-booking', {
              params,
              body: { accepted: true },
            }),
          );
          break;
        case 'rejectOrder':
          unwrap(
            await api.POST('/api/v1/orders/{orderId}/reject', { params, body: { reason: note } }),
          );
          break;
        case 'startWork':
          unwrap(
            await api.POST('/api/v1/orders/{orderId}/start', { params, body: { accepted: true } }),
          );
          break;
        case 'confirmReceipt':
          unwrap(
            await api.POST('/api/v1/orders/{orderId}/confirm', {
              params,
              body: { accepted: true },
            }),
          );
          break;
        case 'acceptStoreOrder':
          unwrap(
            await api.POST('/api/v1/orders/{orderId}/accept-store', {
              params,
              body: { accepted: true },
            }),
          );
          break;
        case 'markStoreReady':
          unwrap(
            await api.POST('/api/v1/orders/{orderId}/ready-for-delivery', {
              params,
              body: { accepted: true },
            }),
          );
          break;
        case 'cancelOrder':
          unwrap(
            await api.POST('/api/v1/orders/{orderId}/cancel', { params, body: { reason: note } }),
          );
          break;
        case 'markReady':
          unwrap(
            await api.POST('/api/v1/orders/{orderId}/ready', {
              params,
              body: { note, completedScope: note.split('\n').filter(Boolean), previewFileIds: [] },
            }),
          );
          break;
        case 'recordProgress':
          unwrap(
            await api.POST('/api/v1/orders/{orderId}/progress', {
              params,
              body: { kind: 'UPDATE', note },
            }),
          );
          break;
      }
      intent.done();
      setSelected(null);
      setNote('');
      await reload();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      {error && <Failure message={error} />}
      {actions
        .filter((action) => action.operationId in labels)
        .map((action) => (
          <Button
            key={action.operationId}
            title={labels[action.operationId as Action][ar ? 0 : 1]}
            disabled={busy || !action.enabled}
            onPress={() => setSelected(action.operationId as Action)}
          />
        ))}
      {selected && (
        <>
          <Copy>{labels[selected][ar ? 0 : 1]}</Copy>
          {['agreeOrder', 'markReady', 'recordProgress', 'cancelOrder', 'rejectOrder'].includes(
            selected,
          ) && (
            <Field
              label={ar ? 'التفاصيل والسبب' : 'Details and reason'}
              multiline
              value={note}
              onChangeText={setNote}
            />
          )}
          {selected === 'agreeOrder' && (
            <Field
              label={ar ? 'موعد التسليم مع المنطقة الزمنية' : 'Due date with time zone'}
              value={dueAt}
              onChangeText={setDue}
            />
          )}
          <Button
            title={ar ? 'تأكيد الإجراء' : 'Confirm action'}
            disabled={busy}
            onPress={() => void submit()}
          />
        </>
      )}
    </Card>
  );
}
