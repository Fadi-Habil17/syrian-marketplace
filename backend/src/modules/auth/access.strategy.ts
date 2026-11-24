import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { fail } from '../../common/errors';
import { Actor, ApiRequest } from '../../common/actor';
@Injectable()
export class AccessStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly db: PrismaService) {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret || secret.startsWith('replace-') || secret.length < 32)
      throw new Error('JWT_ACCESS_SECRET must be configured with at least 32 random characters');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      issuer: 'syrian-marketplace',
      audience: 'marketplace-api',
    });
  }
  async validate(p: { kind: string; sub: string; sid: string; authTime: number }): Promise<Actor> {
    if (p.kind !== 'access') fail('AUTH_REQUIRED', 401);
    const s = await this.db.session.findUnique({
      where: { id: p.sid },
      include: {
        user: {
          include: {
            userRole_user: { where: { revokedAt: null }, include: { role: true } },
            restriction_user: {
              where: {
                revokedAt: null,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
            },
          },
        },
      },
    });
    if (!s || s.userId !== p.sub || s.revokedAt || s.expiresAt <= new Date() || s.user.archivedAt)
      fail('SESSION_REVOKED', 401);
    return {
      id: s.userId,
      sessionId: s.id,
      roles: s.user.userRole_user
        .map((x) => x.role.code)
        .filter(
          (code) =>
            code !== 'ADMIN' || !s.user.restriction_user.some((r) => r.kind === 'SUSPENSION'),
        ),
      restrictions: s.user.restriction_user.map((x) => x.kind),
      authTime: p.authTime,
    };
  }
}
@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }
  override canActivate(context: ExecutionContext) {
    if (context.getType() !== 'http') return true;
    if (
      this.reflector.getAllAndOverride('public', [context.getHandler(), context.getClass()]) &&
      !context.switchToHttp().getRequest().headers.authorization
    )
      return true;
    return super.canActivate(context);
  }
  override handleRequest<TUser = Actor>(err: unknown, user: TUser | false, info: unknown): TUser {
    if (err) throw err;
    if (!user)
      fail((info as Error)?.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'AUTH_REQUIRED', 401);
    return user;
  }
}
@Injectable()
export class PolicyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(ctx: ExecutionContext) {
    if (ctx.getType() !== 'http') return true;
    const r = ctx.switchToHttp().getRequest<ApiRequest>();
    if ((r as any).user) r.actor = (r as any).user;
    if (!r.actor) return true;
    const role = this.reflector.getAllAndOverride<string[]>('roles', [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (role && !role.some((x) => r.actor.roles.includes(x as any))) fail('FORBIDDEN', 403);
    const controlled =
      r.path.endsWith('/files/uploads') ||
      /\/(cases|evidence|proposals|revisions)(\/|$)/.test(r.path);
    if (
      r.actor.restrictions.includes('SUSPENSION') &&
      !['GET', 'HEAD'].includes(r.method) &&
      !controlled
    )
      fail('ACCOUNT_RESTRICTED', 403);
    if (role?.includes('ADMIN') && r.method !== 'GET' && Date.now() / 1000 - r.actor.authTime > 900)
      fail('AUTH_REQUIRED', 401);
    return true;
  }
}
