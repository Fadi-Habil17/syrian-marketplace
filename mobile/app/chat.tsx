import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { api, unwrap } from '../src/api/client';
import { useLoad } from '../src/use-load';
import { watchOrder } from '../src/realtime';
import { useSession } from '../src/state/session';
import { Page, Copy, Card, Button, Busy, Failure, Field } from '../src/ui';
export default function Chat() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { locale, user } = useSession();
  const ar = locale === 'ar';
  const [roomId, setRoomId] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef<{ id: string; text: string } | null>(null);
  const rooms = useLoad(
    async () =>
      unwrap(
        await api.GET('/api/v1/orders/{orderId}/chat-rooms', { params: { path: { orderId: id } } }),
      ),
    [id, user?.id],
  );
  const messages = useLoad(
    async () =>
      roomId
        ? unwrap(
            await api.GET('/api/v1/orders/{orderId}/messages', {
              params: { path: { orderId: id }, query: { roomId } },
            }),
          )
        : null,
    [id, roomId, user?.id],
  );
  useEffect(() => {
    if (user)
      return watchOrder(id, () => {
        void messages.reload();
      });
  }, [id, roomId, user?.id]);
  async function send() {
    if (!text.trim() || !roomId || busy) return;
    setBusy(true);
    setError('');
    if (!pending.current) pending.current = { id: Crypto.randomUUID(), text };
    try {
      unwrap(
        await api.POST('/api/v1/orders/{orderId}/messages', {
          params: { path: { orderId: id }, header: { 'Idempotency-Key': pending.current.id } },
          body: { roomId, clientMessageId: pending.current.id, text: pending.current.text },
        }),
      );
      pending.current = null;
      setText('');
      await messages.reload();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title={ar ? 'محادثة الطلب' : 'Order chat'}>
      {(rooms.loading || messages.loading) && <Busy />}
      {(error || rooms.error || messages.error) && (
        <Failure message={error || rooms.error || messages.error} />
      )}
      {rooms.data?.items.map((room) => (
        <Button
          key={room.id}
          title={room.kind}
          onPress={() => {
            pending.current = null;
            setRoomId(room.id);
          }}
        />
      ))}
      {messages.data?.items.map((message) => (
        <Card key={message.id}>
          <Copy>
            {message.senderId === user?.id ? (ar ? 'أنت' : 'You') : ar ? 'المشارك' : 'Participant'}
          </Copy>
          <Copy>{message.text}</Copy>
          <Copy>{new Date(message.createdAt).toLocaleString(locale)}</Copy>
        </Card>
      ))}
      {roomId && (
        <>
          <Field
            label={ar ? 'رسالتك' : 'Message'}
            multiline
            value={text}
            onChangeText={setText}
            editable={!pending.current}
          />
          <Button
            title={ar ? 'إرسال' : 'Send'}
            disabled={busy || !text.trim()}
            onPress={() => void send()}
          />
        </>
      )}
    </Page>
  );
}
