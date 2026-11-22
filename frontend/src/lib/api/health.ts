import 'server-only';
import type { HealthResponse } from '@syrian-marketplace/contracts';

// Infrastructure transport only; authenticated resource clients follow per slice.
export async function getApiHealth(): Promise<HealthResponse> {
  const baseUrl = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';
  const response = await fetch(`${baseUrl}/health`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('API health request failed');
  return response.json() as Promise<HealthResponse>;
}
