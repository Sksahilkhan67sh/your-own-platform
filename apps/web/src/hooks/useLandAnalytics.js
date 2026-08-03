import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchLandAnalytics } from '../lib/analyticsApi.js';

// No websocket/socket.io exists anywhere in this project (checked app.js,
// package.json, docker-compose.yml) — so per the feature spec's fallback
// ("otherwise implement efficient polling"), analytics refresh on an
// interval instead. 60s comfortably covers a viewer sitting on a details
// page without hammering the (rate-limited, cached) analytics endpoint.
const POLL_INTERVAL_MS = 60 * 1000;

export function useLandAnalytics(landId, { pollIntervalMs = POLL_INTERVAL_MS } = {}) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [error, setError] = useState(null);
  const isFirstLoad = useRef(true);

  const load = useCallback(async () => {
    if (!landId) return;
    if (isFirstLoad.current) setStatus('loading');
    try {
      const result = await fetchLandAnalytics(landId);
      setData(result);
      setStatus('success');
      setError(null);
    } catch (err) {
      // On a background refresh failure, keep showing the last-known-good
      // data rather than replacing it with an error state.
      if (isFirstLoad.current) {
        setError(err?.response?.data?.error?.message || 'Could not load market insights.');
        setStatus('error');
      }
    } finally {
      isFirstLoad.current = false;
    }
  }, [landId]);

  useEffect(() => {
    isFirstLoad.current = true;
    load();

    if (!pollIntervalMs) return undefined;
    const id = setInterval(load, pollIntervalMs);
    return () => clearInterval(id);
  }, [load, pollIntervalMs]);

  return { data, status, error, isLoading: status === 'loading', isError: status === 'error', refetch: load };
}
