/**
 * Minimal in-process TTL cache for analytics reads.
 *
 * The project has no Redis (see infra/docker-compose.yml — just mongo, api,
 * web), so a distributed cache is out of scope here. Analytics aggregations
 * are read-heavy and change slowly (a handful of deals per day at most), so
 * a short-lived per-process cache is enough to stop every page view from
 * re-running the full aggregation pipeline, without adding new infra.
 *
 * Not shared across multiple API instances — acceptable because a stale
 * read here is at most DEFAULT_TTL_MS old analytics numbers, never stale
 * data that affects correctness/security.
 */

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

const store = new Map(); // key -> { value, expiresAt }

export function getCached(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() >= entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

export function setCached(key, value, ttlMs = DEFAULT_TTL_MS) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/** Invalidates every cached analytics entry for a given land id. Called
 * whenever a deal for that land changes status (e.g. becomes 'paid'),
 * so "live update" doesn't have to wait out the TTL. */
export function invalidateLand(landId) {
  const suffix = `land:${landId}`;
  for (const key of store.keys()) {
    if (key.includes(suffix)) store.delete(key);
  }
}

export function clearAnalyticsCache() {
  store.clear();
}
