import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import { ApiRequest } from '../../common/actor';
import { CommandsService } from '../../common/commands.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ChatAccess } from '../chat/chat-access.service';
import { tokenHash } from '../auth/auth.service';
import { AccessStrategy } from '../auth/access.strategy';
import { fail } from '../../common/errors';
export interface SocketClaims {
  sub: string;
  sid: string;
  authTime: number;
  kind: string;
  orderId?: string;
  exp: number;
}
@Injectable()
export class RealtimeService {
  constructor(
    private readonly db: PrismaService,
    private readonly commands: CommandsService,
    private readonly jwt: JwtService,
    private readonly chats: ChatAccess,
    private readonly identity: AccessStrategy,
  ) {}
  createRealtimeTicket(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      if (r.actor.restrictions.includes('SUSPENSION')) fail('ACCOUNT_RESTRICTED', 403);
      await this.chats.rooms(tx, r.body.orderId, r.actor);
      const ticket = await this.jwt.signAsync(
        {
          sub: r.actor.id,
          sid: r.actor.sessionId,
          authTime: r.actor.authTime,
          kind: 'realtime',
          orderId: r.body.orderId,
          nonce: randomBytes(24).toString('base64url'),
        },
        {
          secret: process.env.JWT_ACCESS_SECRET,
          issuer: 'syrian-marketplace',
          audience: 'marketplace-realtime',
          expiresIn: 60,
        },
      );
      await tx.verificationToken.create({
        data: {
          userId: r.actor.id,
          kind: 'REALTIME_TICKET',
          tokenHash: tokenHash(ticket),
          expiresAt: new Date(Date.now() + 60000),
        },
      });
      return { ticket, expiresIn: 60, namespace: '/orders' };
    });
  }
  async handshake(auth: Record<string, unknown>) {
    const ticket = typeof auth?.ticket === 'string' ? auth.ticket : undefined,
      raw = ticket ?? auth?.accessToken;
    if (typeof raw !== 'string' || raw.length > 8192) fail('AUTH_REQUIRED', 401);
    let p: SocketClaims;
    try {
      p = await this.jwt.verifyAsync(raw, {
        secret: process.env.JWT_ACCESS_SECRET,
        issuer: 'syrian-marketplace',
        audience: ticket ? 'marketplace-realtime' : 'marketplace-api',
      });
    } catch {
      fail('AUTH_REQUIRED', 401);
    }
    if (p.kind !== (ticket ? 'realtime' : 'access')) fail('AUTH_REQUIRED', 401);
    if (ticket) {
      const consumed = await this.db.verificationToken.updateMany({
        where: {
          tokenHash: tokenHash(ticket),
          userId: p.sub,
          kind: 'REALTIME_TICKET',
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { consumedAt: new Date() },
      });
      if (consumed.count !== 1) fail('AUTH_REQUIRED', 401);
    }
    await this.actor(p);
    return p;
  }
  async actor(p: SocketClaims) {
    if (p.exp <= Date.now() / 1000) fail('TOKEN_EXPIRED', 401);
    const actor = await this.identity.validate({ ...p, kind: 'access' });
    if (actor.restrictions.includes('SUSPENSION')) fail('ACCOUNT_RESTRICTED', 403);
    return actor;
  }
}
