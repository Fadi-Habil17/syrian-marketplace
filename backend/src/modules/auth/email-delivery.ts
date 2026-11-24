import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fail } from '../../common/errors';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { PrismaService, UnitOfWork } from '../../infrastructure/database/prisma.service';
@Injectable()
export class EmailDelivery {
  constructor(private readonly db: PrismaService) {}
  private key() {
    const raw =
      process.env.EMAIL_OUTBOX_KEY ??
      (process.env.NODE_ENV !== 'production' ? process.env.JWT_REFRESH_SECRET : undefined);
    if (!raw || raw.startsWith('replace-') || raw.length < 32) fail('TEMPORARILY_UNAVAILABLE', 503);
    return createHash('sha256')
      .update('marketplace-mail:' + raw)
      .digest();
  }
  async enqueue(
    tx: UnitOfWork,
    id: string,
    userId: string,
    email: string,
    kind: string,
    token: string,
  ) {
    const iv = randomBytes(12),
      cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify({ id, email, kind, token })),
      cipher.final(),
    ]);
    return tx.outboxEvent.create({
      data: {
        aggregateId: userId,
        aggregateVersion: 1,
        type: 'identity.email',
        deduplicationKey: `identity-mail:${id}`,
        payload: { sealed: Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64') },
      },
    });
  }
  async deliverOutbox(eventId: string) {
    const event = await this.db.outboxEvent.findUniqueOrThrow({ where: { id: eventId } });
    if (event.publishedAt) return;
    if (event.type !== 'identity.email') fail('INVALID_INPUT', 400);
    const bytes = Buffer.from((event.payload as any).sealed, 'base64'),
      decipher = createDecipheriv('aes-256-gcm', this.key(), bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(12, 28));
    const m = JSON.parse(
      Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString(),
    );
    if (m.kind === 'PASSWORD_RESET') await this.send(m.id, m.email, m.kind, m.token);
    await this.db.outboxEvent.updateMany({
      where: { id: eventId, publishedAt: null },
      data: { publishedAt: new Date(), claimedUntil: null },
    });
  }
  async send(id: string, email: string, kind: string, token: string) {
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.EMAIL_DELIVERY_URL || !process.env.EMAIL_DELIVERY_TOKEN)
        fail('TEMPORARILY_UNAVAILABLE', 503);
      const r = await fetch(process.env.EMAIL_DELIVERY_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.EMAIL_DELIVERY_TOKEN}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': id,
        },
        body: JSON.stringify({ email, kind, token }),
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) fail('TEMPORARILY_UNAVAILABLE', 503);
    } else {
      const dir = resolve(process.env.LOCAL_MAIL_DIR ?? '.local-data/mail');
      await mkdir(dir, { recursive: true });
      await writeFile(resolve(dir, id + '.json'), JSON.stringify({ email, kind, token }), {
        mode: 0o600,
      });
    }
  }
}
