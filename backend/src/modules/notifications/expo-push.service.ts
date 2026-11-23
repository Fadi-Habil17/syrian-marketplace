import { Injectable } from '@nestjs/common';
import { fail } from '../../common/errors';
@Injectable()
export class ExpoPush {
  private async request(path: string, body: unknown) {
    const token = process.env.EXPO_ACCESS_TOKEN;
    const response = await fetch('https://exp.host/--/api/v2/push/' + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) fail('TEMPORARILY_UNAVAILABLE', 503);
    return response.json() as Promise<any>;
  }
  async send(token: string, notice: { id: string; category: string; resourceId: string }) {
    const reply = await this.request('send', {
      to: token,
      title: 'Marketplace',
      body: 'You have a marketplace update',
      data: { notificationId: notice.id, category: notice.category, resourceId: notice.resourceId },
      sound: 'default',
    });
    const ticket = Array.isArray(reply.data) ? reply.data[0] : reply.data;
    if (ticket?.status === 'ok' && typeof ticket.id === 'string') return { ticketId: ticket.id };
    return { errorCode: ticket?.details?.error ?? 'PUSH_REJECTED' };
  }
  async receipt(ticketId: string) {
    const reply = await this.request('getReceipts', { ids: [ticketId] }),
      receipt = reply.data?.[ticketId];
    return receipt?.status === 'ok'
      ? { deliveredToProvider: true }
      : receipt?.status === 'error'
        ? { errorCode: receipt.details?.error ?? 'PUSH_REJECTED' }
        : { pending: true };
  }
}
