import { assertTransition, beforeDeadline } from './order-state-machine';
describe('Order financial and time gates', () => {
  it('rejects skipping agreement, funding and final-payment phases', () => {
    expect(() => assertTransition('BOOKING_REQUESTED', 'DEPOSIT_HELD')).toThrow(
      'INVALID_TRANSITION',
    );
    expect(() => assertTransition('IN_PROGRESS', 'DELIVERED')).toThrow('INVALID_TRANSITION');
    expect(() => assertTransition('COMPLETED', 'FULLY_FUNDED')).toThrow('INVALID_TRANSITION');
  });
  it('allows the funded handover and review path', () => {
    expect(() => assertTransition('READY_FOR_FINAL_PAYMENT', 'FULLY_FUNDED')).not.toThrow();
    expect(() => assertTransition('FULLY_FUNDED', 'DELIVERED')).not.toThrow();
    expect(() => assertTransition('DELIVERED', 'COMPLETED')).not.toThrow();
  });
  it('gives the deadline boundary to expiry, using UTC server timestamps', () => {
    const deadline = new Date('2026-11-25T10:00:00.000Z');
    expect(() => beforeDeadline(new Date(deadline.getTime() - 1), deadline)).not.toThrow();
    expect(() => beforeDeadline(deadline, deadline)).toThrow('DEADLINE_EXPIRED');
  });
});
