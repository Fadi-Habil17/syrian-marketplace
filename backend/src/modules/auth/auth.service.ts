import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { VerificationKind } from '@prisma/client';
import { PrismaService, UnitOfWork } from '../../infrastructure/database/prisma.service';
import { UsersService } from '../users/users.service';
import { EmailDelivery } from './email-delivery';
import { fail } from '../../common/errors';
import { LoginDto, RegisterDto } from './auth.dto';
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
// Public, deliberately unusable identity; keep the same bcrypt cost as registration.
const unknownIdentityHash = '$2b$12$AHkww40C8hO9tLXQH5Da1.wlK3bDMHb3QjwOw897JDyDAGd.Z1/Cm';
interface RefreshClaims {
  sub: string;
  sid: string;
  family: string;
  authTime: number;
  kind: string;
}
@Injectable()
export class AuthService {
  constructor(
    private readonly db: PrismaService,
    private readonly jwt: JwtService,
    private readonly users: UsersService,
    private readonly mail: EmailDelivery,
  ) {}
  private password(value: string) {
    if (Buffer.byteLength(value, 'utf8') > 72 || value.length < 12) fail('INVALID_INPUT', 400);
  }
  private secret(kind: 'ACCESS' | 'REFRESH') {
    const value = process.env[`JWT_${kind}_SECRET`];
    if (!value || value.startsWith('replace-') || value.length < 32)
      fail('TEMPORARILY_UNAVAILABLE', 503);
    return value;
  }
  private async allowed(tx: UnitOfWork, id: string, historyOnly = false) {
    const user = await tx.user.findUnique({ where: { id } });
    if (!user || user.archivedAt) fail('AUTH_REQUIRED', 401);
    if (
      !historyOnly &&
      (await tx.restriction.findFirst({
        where: {
          userId: id,
          kind: 'SUSPENSION',
          revokedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      }))
    )
      fail('ACCOUNT_RESTRICTED', 403);
    return user;
  }
  private async pair(
    tx: UnitOfWork,
    userId: string,
    client: string,
    family: string = randomUUID(),
    authTime = Math.floor(Date.now() / 1000),
  ) {
    const sid = randomUUID(),
      refreshToken = await this.jwt.signAsync(
        {
          sub: userId,
          sid,
          family,
          authTime,
          kind: 'refresh',
          nonce: randomBytes(24).toString('base64url'),
        },
        {
          secret: this.secret('REFRESH'),
          issuer: 'syrian-marketplace',
          audience: 'marketplace-refresh',
          expiresIn: '30d',
        },
      );
    await tx.session.create({
      data: {
        id: sid,
        userId,
        client,
        familyId: family,
        refreshHash: tokenHash(refreshToken),
        expiresAt: new Date(Date.now() + 30 * 86400000),
      },
    });
    const accessToken = await this.jwt.signAsync(
      { sub: userId, sid, authTime, kind: 'access' },
      {
        secret: this.secret('ACCESS'),
        issuer: 'syrian-marketplace',
        audience: 'marketplace-api',
        expiresIn: 900,
      },
    );
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer' as const,
      expiresIn: 900 as const,
      sessionId: sid,
      user: await this.users.dto(userId, tx),
    };
  }
  private async issueInTransaction(tx: UnitOfWork, userId: string, kind: VerificationKind) {
    const raw = randomBytes(32).toString('base64url'),
      row = await tx.verificationToken.create({
        data: {
          userId,
          kind,
          tokenHash: tokenHash(raw),
          expiresAt: new Date(Date.now() + (kind === 'EMAIL' ? 24 * 3600000 : 3600000)),
        },
      }),
      user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    return this.mail.enqueue(tx, row.id, userId, user.email, kind, raw);
  }
  private async issue(userId: string, kind: VerificationKind) {
    const event = await this.db.atomic((tx) => this.issueInTransaction(tx, userId, kind));
    await this.mail.deliverOutbox(event.id).catch(() => undefined);
  }
  async register(b: RegisterDto) {
    this.password(b.password);
    const passwordHash = await hash(b.password, 12);
    const result = await this.db.atomic(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: b.email.trim().toLowerCase(),
          passwordHash,
          displayName: b.displayName,
          locale: b.locale,
        },
      });
      await this.users.initialize(tx, u.id, b.businessRole);
      await tx.auditRecord.create({
        data: {
          actorId: u.id,
          aggregateId: u.id,
          requestId: randomUUID(),
          action: 'identity.registered',
          metadata: {},
        },
      });
      const event = await this.issueInTransaction(tx, u.id, 'EMAIL');
      return { id: u.id, eventId: event.id };
    });
    await this.mail.deliverOutbox(result.eventId).catch(() => undefined);
    return this.users.dto(result.id);
  }
  async login(b: LoginDto) {
    const user = await this.db.user.findUnique({ where: { email: b.email.trim().toLowerCase() } });
    const matches = await compare(b.password, user?.passwordHash ?? unknownIdentityHash);
    if (!user || Buffer.byteLength(b.password) > 72 || !matches) fail('AUTH_REQUIRED', 401);
    return this.db.atomic(async (tx) => {
      await this.db.lockUsers(tx, [user.id]);
      const fresh = await this.allowed(tx, user.id, true);
      if (fresh.passwordHash !== user.passwordHash) fail('AUTH_REQUIRED', 401);
      return this.pair(tx, user.id, b.client);
    });
  }
  async refresh(token: string) {
    let claims: RefreshClaims;
    try {
      claims = await this.jwt.verifyAsync(token, {
        secret: this.secret('REFRESH'),
        issuer: 'syrian-marketplace',
        audience: 'marketplace-refresh',
      });
    } catch {
      fail('AUTH_REQUIRED', 401);
    }
    if (claims.kind !== 'refresh') fail('AUTH_REQUIRED', 401);
    const result = await this.db.atomic(async (tx) => {
      await this.db.lockUsers(tx, [claims.sub]);
      const old = await tx.session.findUnique({ where: { id: claims.sid } });
      if (
        !old ||
        old.userId !== claims.sub ||
        old.refreshHash !== tokenHash(token) ||
        old.expiresAt <= new Date()
      )
        return { error: 'AUTH_REQUIRED' };
      if (old.revokedAt) {
        await tx.session.updateMany({
          where: { familyId: old.familyId },
          data: { revokedAt: new Date() },
        });
        return { error: 'REFRESH_REUSE_DETECTED' };
      }
      await this.allowed(tx, claims.sub);
      const pair = await this.pair(tx, old.userId, old.client, old.familyId, claims.authTime);
      await tx.session.update({
        where: { id: old.id },
        data: { revokedAt: new Date(), replacedById: pair.sessionId },
      });
      return { pair };
    });
    if (result.error) fail(result.error, 401);
    return result.pair!;
  }
  async verify(token: string) {
    const id = await this.consume(token, 'EMAIL', async (tx, id) => {
      await tx.user.update({ where: { id }, data: { verifiedAt: new Date() } });
    });
    return this.users.dto(id);
  }
  private async consume(
    token: string,
    kind: VerificationKind,
    work: (tx: UnitOfWork, userId: string) => Promise<void>,
  ) {
    return this.db.atomic(async (tx) => {
      const t = await tx.verificationToken.findUnique({ where: { tokenHash: tokenHash(token) } });
      if (!t || t.kind !== kind || t.consumedAt || t.expiresAt <= new Date())
        fail('INVALID_INPUT', 400);
      await this.db.lockUsers(tx, [t.userId]);
      await work(tx, t.userId);
      await tx.verificationToken.update({ where: { id: t.id }, data: { consumedAt: new Date() } });
      return t.userId;
    });
  }
  async forgot(email: string) {
    const u = await this.db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (u) await this.issue(u.id, 'PASSWORD_RESET');
    return this.operation();
  }
  async reset(token: string, password: string) {
    this.password(password);
    const passwordHash = await hash(password, 12);
    await this.consume(token, 'PASSWORD_RESET', async (tx, id) => {
      await tx.user.update({ where: { id }, data: { passwordHash } });
      await tx.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.verificationToken.updateMany({
        where: { userId: id, kind: 'PASSWORD_RESET', consumedAt: null },
        data: { consumedAt: new Date() },
      });
    });
    return this.operation();
  }
  async logout(userId: string, token: string) {
    await this.db.atomic(async (tx) => {
      await this.db.lockUsers(tx, [userId]);
      const s = await tx.session.findFirst({ where: { userId, refreshHash: tokenHash(token) } });
      if (s)
        await tx.session.updateMany({
          where: { userId, familyId: s.familyId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
    });
    return this.operation(userId);
  }
  operation(id: string = randomUUID()) {
    return {
      id,
      status: 'SUCCEEDED' as const,
      resourceId: id,
      errorCode: null,
      simulated: true as const,
    };
  }
}
