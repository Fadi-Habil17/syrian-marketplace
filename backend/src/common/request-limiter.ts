import { Injectable } from '@nestjs/common';
import { fail } from './errors';
@Injectable()
export class RequestLimiter {
  private readonly buckets = new Map<string, { until: number; count: number }>();
  hit(key: string, limit: number, now = Date.now()) {
    let row = this.buckets.get(key);
    if (!row || row.until <= now) {
      row = { until: now + 60000, count: 0 };
      this.buckets.set(key, row);
    }
    if (this.buckets.size > 20000)
      for (const [k, v] of this.buckets) if (v.until <= now) this.buckets.delete(k);
    if (this.buckets.size > 25000 || ++row.count > limit) fail('RATE_LIMITED', 429);
    return { remaining: Math.max(0, limit - row.count), resetAt: row.until };
  }
}
