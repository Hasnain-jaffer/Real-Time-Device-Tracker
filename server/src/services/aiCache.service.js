// server/src/services/aiCache.service.js
// Small in-memory TTL cache (no extra dependency). Bounded so it cannot grow forever.
const cache = new Map();
const DEFAULT_TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 500;

export function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

export function setCached(key, value, ttlMs = DEFAULT_TTL_MS) {
  if (cache.size >= MAX_ENTRIES) {
    cache.delete(cache.keys().next().value); // evict the oldest entry
  }
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}