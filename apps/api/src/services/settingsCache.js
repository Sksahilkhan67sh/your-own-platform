/**
 * Minimal in-process TTL cache for branding/analytics settings reads.
 * Same rationale and shape as services/analytics/analyticsCache.js: no
 * Redis in this project's infra, settings change rarely (an admin saving
 * a form), and a short-lived per-process cache is enough to stop every
 * page view / every analytics call from re-reading the singleton doc.
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

export function invalidate(key) {
  store.delete(key);
}

export function clearSettingsCache() {
  store.clear();
}
