import { useCallback, useEffect, useRef, useState } from 'react';
export function useLoad<T>(loader: () => Promise<T>, dependencies: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const sequence = useRef(0);
  const reload = useCallback(async () => {
    const id = ++sequence.current;
    setLoading(true);
    setError('');
    try {
      const value = await loader();
      if (id === sequence.current) setData(value);
    } catch (e) {
      if (id === sequence.current) setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      if (id === sequence.current) setLoading(false);
    }
  }, dependencies);
  useEffect(() => {
    setData(null);
    void reload();
    return () => {
      sequence.current++;
    };
  }, [reload]);
  return { data, error, loading, reload };
}
