import { validateEnvironment } from './environment';

describe('infrastructure environment validation', () => {
  it('rejects invalid listener ports and excessively fast worker polling', () => {
    for (const PORT of ['NaN', '0', '65536', '1.5']) {
      expect(() => validateEnvironment({ PORT })).toThrow('PORT');
    }
    expect(() => validateEnvironment({ WORKER_POLL_MS: '10' })).toThrow('WORKER_POLL_MS');
  });

  it('rejects a live gateway configuration in this simulated-only release', () => {
    expect(() => validateEnvironment({ PAYMENT_PROVIDER: 'live' })).toThrow('simulated');
  });

  it('accepts multiple explicit origins but rejects wildcard, path and non-HTTP origins', () => {
    const config = validateEnvironment({
      WEB_ORIGINS: 'http://localhost:3000, https://market.example',
    });
    expect(config.WEB_ORIGINS).toBe('http://localhost:3000,https://market.example');
    for (const WEB_ORIGINS of ['*', 'http://localhost:3000/path', 'file:///app']) {
      expect(() => validateEnvironment({ WEB_ORIGINS })).toThrow();
    }
  });
});
