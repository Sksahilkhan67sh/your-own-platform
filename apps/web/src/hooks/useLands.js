import { useState, useEffect, useCallback } from 'react';
import { fetchPublicLands } from '../lib/landApi.js';

export function useLands(filters) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const res = await fetchPublicLands(filters);
      setItems(res.data);
      setMeta(res.meta);
      setStatus('success');
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Something went wrong while loading listings.');
      setStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, meta, status, error, isLoading: status === 'loading', isError: status === 'error', refetch: load };
}
