import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ApiRequest } from './actor';
import { RequestLimiter } from './request-limiter';
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly limiter: RequestLimiter) {}
  canActivate(ctx: ExecutionContext) {
    if (ctx.getType() !== 'http') return true;
    const r = ctx.switchToHttp().getRequest<ApiRequest>(),
      res = ctx.switchToHttp().getResponse();
    let group = 'read',
      limit = 300;
    if (r.path.includes('/auth/')) {
      group = 'identity';
      limit = r.path.endsWith('/register') ? 20 : 60;
    } else if (r.method !== 'GET') {
      group = /payments|checkout|confirm|resolve|topups/.test(r.path) ? 'financial' : 'write';
      limit = group === 'financial' ? 30 : 120;
    }
    res.setHeader('Retry-After', 60);
    this.limiter.hit(`ip:${r.ip}:${group}`, limit * 4);
    const quota = this.limiter.hit(`${r.actor?.id ?? r.ip}:${group}`, limit);
    res.removeHeader('Retry-After');
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', quota.remaining);
    return true;
  }
}
