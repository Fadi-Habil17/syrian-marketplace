import { compare } from 'bcrypt';
import { AuthService } from './auth.service';
jest.mock('bcrypt', () => ({ compare: jest.fn().mockResolvedValue(false), hash: jest.fn() }));
describe('Login credential failure work', () => {
  it.each([null, { passwordHash: '$2b$12$existing' }])(
    'performs bcrypt comparison for missing and existing identities (%p)',
    async (user) => {
      jest.mocked(compare).mockClear();
      const db = { user: { findUnique: jest.fn().mockResolvedValue(user) } };
      const auth = new AuthService(db as never, {} as never, {} as never, {} as never);
      await expect(
        auth.login({ email: 'unknown@example.test', password: 'WrongPassword123!', client: 'WEB' }),
      ).rejects.toThrow('AUTH_REQUIRED');
      expect(compare).toHaveBeenCalledTimes(1);
    },
  );
});
