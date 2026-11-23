'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function InboxRefresh() {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') router.refresh();
    };
    const interval = setInterval(refresh, 30_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [router]);
  return null;
}
