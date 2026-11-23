'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { io, type Socket } from 'socket.io-client';
import { orderTicket } from '../lib/actions/market';
import type { RealtimeAck, RealtimeCommand, RealtimeEvent } from '../lib/api/contracts';
import { choose, type Locale } from '../lib/locale';

export function Realtime({
  locale,
  orderId,
  version,
}: {
  locale: Locale;
  orderId: string;
  version: number;
}) {
  const router = useRouter();
  const latest = useRef(version);
  const seen = useRef(new Set<string>());
  const [status, setStatus] = useState<'connecting' | 'live' | 'offline'>('connecting');
  const [, transition] = useTransition();
  useEffect(() => {
    latest.current = version;
  }, [version]);
  useEffect(() => {
    let disposed = false;
    let socket: Socket | undefined;
    let reconnect: ReturnType<typeof setTimeout> | undefined;
    let refresh: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    const recover = () => {
      clearTimeout(refresh);
      refresh = setTimeout(() => transition(() => router.refresh()), 200);
    };
    const retry = () => {
      if (disposed || reconnect) return;
      setStatus('offline');
      reconnect = setTimeout(
        () => {
          reconnect = undefined;
          void connect();
        },
        Math.min(1000 * 2 ** failures++, 30_000),
      );
    };
    async function connect() {
      try {
        const ticket = await orderTicket(orderId);
        if (disposed) return;
        if (!ticket) {
          setStatus('offline');
          return;
        }
        socket?.removeAllListeners().disconnect();
        const url = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000/orders';
        const client = io(url, {
          auth: { ticket: ticket.ticket },
          reconnection: false,
          forceNew: true,
          timeout: 8_000,
        });
        socket = client;
        client.on('connect', () => {
          const command: RealtimeCommand = {
            type: 'order.subscribe',
            data: { orderId, lastSeenVersion: latest.current },
          };
          client
            .timeout(8_000)
            .emit('command', command, (error: Error | null, ack?: RealtimeAck) => {
              if (disposed) return;
              if (error || !ack?.ok) {
                setStatus('offline');
                client.disconnect();
                return;
              }
              setStatus('live');
              failures = 0;
              recover();
            });
        });
        client.on('connect_error', retry);
        client.on('disconnect', (reason) => {
          if (reason !== 'io client disconnect') retry();
        });
        client.on('event', (event: RealtimeEvent) => {
          if (disposed || seen.current.has(event.eventId)) return;
          seen.current.add(event.eventId);
          if (seen.current.size > 256) {
            const first = seen.current.values().next().value;
            if (first) seen.current.delete(first);
          }
          if (event.type === 'permissions.revoked') {
            setStatus('offline');
            client.disconnect();
          }
          recover();
        });
      } catch {
        retry();
      }
    }
    void connect();
    return () => {
      disposed = true;
      socket?.removeAllListeners().disconnect();
      clearTimeout(reconnect);
      clearTimeout(refresh);
    };
  }, [orderId, router, transition]);
  return (
    <span className={'pill ' + (status === 'live' ? 'active' : '')} role="status">
      {status === 'live'
        ? choose(locale, 'تحديث مباشر', 'Live updates')
        : status === 'connecting'
          ? choose(locale, 'جارٍ الاتصال…', 'Connecting…')
          : choose(locale, 'التحديث المباشر غير متاح', 'Live updates unavailable')}
    </span>
  );
}
