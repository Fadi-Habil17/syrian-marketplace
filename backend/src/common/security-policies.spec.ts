import { page, pageArgs } from './pagination';
import { RequestLimiter } from './request-limiter';
describe('Request replay boundaries', () => {
  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'unit-cursor-signing-key-with-at-least-32-characters';
  });
  it('binds a signed cursor to the actor and filters, independently of query-key order', () => {
    const cursor = page(
      [{ id: 'one' }, { id: 'two' }],
      { limit: 1, currency: 'SYP', sort: 'createdAt:desc' },
      'buyer',
    ).nextCursor!;
    expect(
      pageArgs({ sort: 'createdAt:desc', currency: 'SYP', limit: 1, cursor }, 'buyer').cursor?.id,
    ).toBe('one');
    expect(() => pageArgs({ currency: 'USD', sort: 'createdAt:desc', cursor }, 'buyer')).toThrow(
      'INVALID_CURSOR',
    );
    expect(() => pageArgs({ currency: 'SYP', sort: 'createdAt:desc', cursor }, 'other')).toThrow(
      'INVALID_CURSOR',
    );
    expect(() =>
      pageArgs({ currency: 'SYP', sort: 'createdAt:desc', cursor: cursor + 'x' }, 'buyer'),
    ).toThrow('INVALID_CURSOR');
  });
  it('enforces a fixed window and reopens it at the exact deadline', () => {
    const limits = new RequestLimiter();
    limits.hit('actor:payment', 2, 1000);
    limits.hit('actor:payment', 2, 1001);
    expect(() => limits.hit('actor:payment', 2, 60999)).toThrow('RATE_LIMITED');
    expect(limits.hit('actor:payment', 2, 61000).remaining).toBe(1);
    expect(limits.hit('other:payment', 2, 61000).remaining).toBe(1);
  });
});
