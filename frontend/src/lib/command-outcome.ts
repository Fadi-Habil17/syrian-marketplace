export function uncertainOutcome(result: { code: string; status?: number }) {
  return (
    result.status === 0 ||
    (result.status !== undefined && result.status >= 500) ||
    [401, 408, 429].includes(result.status ?? -1) ||
    [
      'CONNECTION_ERROR',
      'REQUEST_IN_PROGRESS',
      'TEMPORARILY_UNAVAILABLE',
      'IDEMPOTENCY_CONFLICT',
      'SESSION_REQUIRED',
      'SESSION_CHANGED',
    ].includes(result.code)
  );
}
