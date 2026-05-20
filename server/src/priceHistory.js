// ─────────────────────────────────────────────────────────────
// In-memory price history for synthetic sparklines.
// Each time a quote is fetched, its price is recorded here.
// Over successive cache refreshes, enough points accumulate
// to render a sparkline — no extra API calls needed.
// Data resets on server restart (acceptable for free tier).
// ─────────────────────────────────────────────────────────────

const MAX_POINTS = 60; // ~5 hours at 5-min refresh intervals
const store = new Map();

export const priceHistory = {
  /** Record a price point for a key (e.g. "idx:usa", "comm:brent") */
  record(key, price) {
    if (price == null) return;
    let arr = store.get(key);
    if (!arr) { arr = []; store.set(key, arr); }
    const now = new Date().toISOString();
    // Skip duplicate if price hasn't changed and last point < 30s ago
    const last = arr[arr.length - 1];
    if (last && last.price === price && (Date.now() - new Date(last.t).getTime()) < 30_000) return;
    arr.push({ t: now, price: +Number(price).toFixed(4) });
    if (arr.length > MAX_POINTS) arr.shift();
  },

  /** Get accumulated points for a key */
  get(key) {
    return store.get(key) || [];
  },
};
