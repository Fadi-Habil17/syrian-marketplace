import { io } from 'socket.io-client';
import type { RealtimeEvent } from './api/contracts';
import { getAccessToken, restoreSession } from './api/client';
import { apiConfig } from './api/config';
export function watchOrder(orderId: string, refresh: () => void) {
  let disposed = false;
  let refreshedForConnection = false;
  const socket = io(apiConfig.socketUrl, {
    autoConnect: false,
    auth: (callback) => {
      callback({ accessToken: getAccessToken() });
    },
  });
  const seen = new Set<string>();
  socket.on('connect', () => {
    refreshedForConnection = false;
    socket.emit('command', { type: 'order.subscribe', data: { orderId, lastSeenVersion: 0 } }, () =>
      refresh(),
    );
  });
  socket.on('event', (event: RealtimeEvent) => {
    if (seen.has(event.eventId)) return;
    seen.add(event.eventId);
    if (seen.size > 200) seen.delete(seen.values().next().value!);
    if (event.type === 'permissions.revoked') {
      socket.disconnect();
      refresh();
      return;
    }
    refresh();
  });
  socket.on('connect_error', (error: Error) => {
    if (disposed || error.message !== 'AUTH_REQUIRED' || refreshedForConnection) return;
    refreshedForConnection = true;
    void restoreSession()
      .then((pair) => {
        if (pair && !disposed) socket.connect();
      })
      .catch(() => {});
  });
  socket.connect();
  return () => {
    disposed = true;
    socket.removeAllListeners();
    socket.disconnect();
  };
}
