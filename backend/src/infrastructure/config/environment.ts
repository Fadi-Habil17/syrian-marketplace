export function validateEnvironment(env: Record<string, unknown>): Record<string, unknown> {
  const port = Number(env.PORT ?? 4000);
  const workerPollMs = Number(env.WORKER_POLL_MS ?? 30_000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer from 1 to 65535');
  }
  if (!Number.isInteger(workerPollMs) || workerPollMs < 1000) {
    throw new Error('WORKER_POLL_MS must be an integer of at least 1000');
  }
  if (env.PAYMENT_PROVIDER && env.PAYMENT_PROVIDER !== 'simulated') {
    throw new Error('This release supports PAYMENT_PROVIDER=simulated only');
  }
  const origins = String(env.WEB_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((value) => value.trim());
  for (const origin of origins) {
    const url = new URL(origin);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) {
      throw new Error('WEB_ORIGINS must contain comma-separated HTTP origins');
    }
  }
  return { ...env, PORT: port, WORKER_POLL_MS: workerPollMs, WEB_ORIGINS: origins.join(',') };
}
