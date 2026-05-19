// ─────────────────────────────────────────────────────────────
// Tiny in-memory TTL cache. Keeps free-tier API usage low by
// serving repeated requests from memory until the TTL expires.
// Swap for Redis in production if you scale horizontally.
// ─────────────────────────────────────────────────────────────

const store = new Map();

export function cacheGet(key) {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    store.delete(key);
    return null;
  }
  return hit.value;
}

export function cacheSet(key, value, ttlSeconds) {
  store.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
  return value;
}

/**
 * getOrSet — return cached value or run the loader, cache and return it.
 * On loader failure, returns last stale value if present (graceful degradation).
 */
export async function getOrSet(key, ttlSeconds, loader) {
  const cached = cacheGet(key);
  if (cached !== null) return cached;
  try {
    const fresh = await loader();
    return cacheSet(key, fresh, ttlSeconds);
  } catch (err) {
    const stale = store.get(key);
    if (stale) {
      console.warn(`[cache] loader failed for "${key}", serving stale:`, err.message);
      return stale.value;
    }
    throw err;
  }
}

export function cacheStats() {
  return { entries: store.size, keys: [...store.keys()] };
}
