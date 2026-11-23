import { privateDownload, ApiFailure } from '../../../../lib/api/client';
import { credentials } from '../../../../lib/session';

export async function GET(_: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(fileId)) return new Response(null, { status: 404 });
  const { token } = await credentials();
  try {
    const upstream = await privateDownload(fileId, token);
    const headers = new Headers({
      'Cache-Control': 'private, no-store',
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });
    const disposition = upstream.headers.get('Content-Disposition');
    if (disposition) headers.set('Content-Disposition', disposition);
    return new Response(upstream.body, { headers });
  } catch (error) {
    if (error instanceof ApiFailure) return new Response(null, { status: error.status || 503 });
    throw error;
  }
}
