// ─────────────────────────────────────────────────────────────
// Fetch helper: timeout, JSON parsing, consistent errors.
// Node 18+ has global fetch.
// ─────────────────────────────────────────────────────────────

export async function httpJSON(url, { timeout = 9000, headers = {} } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${hostOf(url)}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

// Build a standard envelope so every figure carries provenance.
export function stamp(data, source, asOf = new Date().toISOString(), extra = {}) {
  return { data, source, asOf, ...extra };
}
