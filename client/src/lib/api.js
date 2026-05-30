// ─────────────────────────────────────────────────────────────
// Frontend API client + shared formatting helpers.
// Includes client-side data enhancement via Twelve Data when
// backend returns stale reference data.
// ─────────────────────────────────────────────────────────────

const BASE = import.meta.env.PROD
  ? "https://macropulse-global.onrender.com/api"
  : "/api";

const TD_KEY = "30e51a40c8d94686b1402edfffd6658d";

export async function api(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status} on ${path}`);
  const data = await res.json();

  // If indices came from stale reference, enhance from Twelve Data
  if (path === "/indices" && data.source?.includes("reference")) {
    try {
      const enhanced = await enhanceIndices(data);
      return enhanced;
    } catch (_) {}
  }

  // If commodities came from stale reference, enhance from Twelve Data
  if (path === "/commodities" && !data.live) {
    try {
      const enhanced = await enhanceCommodities(data);
      return enhanced;
    } catch (_) {}
  }

  return data;
}

// ── Client-side data enhancement (Twelve Data, CORS-enabled) ──

// Yahoo Finance symbols → Twelve Data ETF proxies
const INDEX_TD_MAP = {
  usa:     { sym: "SPY",  mult: 10,   name: "S&P 500 (via SPY)" },
  brazil:  { sym: "EWZ",  mult: null, name: "Bovespa (via EWZ)" },
};

// Twelve Data commodity symbols (free tier)
const COMM_TD = {
  gold:  "XAU/USD",
  brent: "BRENT",
  gas:   "NG",
};

async function tdPrice(symbol) {
  const r = await fetch(`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${TD_KEY}`);
  const j = await r.json();
  if (j.status === "error" || !j.close) return null;
  return { price: Number(j.close), changePct: Number(j.percent_change), prev: Number(j.previous_close) };
}

async function enhanceIndices(data) {
  // Try to get at least a few live prices from Twelve Data
  const symbols = ["SPY"]; // S&P 500 proxy — most important
  try {
    const r = await fetch(`https://api.twelvedata.com/quote?symbol=${symbols.join(",")}&apikey=${TD_KEY}`);
    const j = await r.json();
    // Update S&P 500 if we got SPY data
    const spy = j.SPY || j;
    if (spy && spy.close) {
      const spyPrice = Number(spy.close);
      const sp500Price = +(spyPrice * 10).toFixed(2);
      const sp500Pct = Number(spy.percent_change);
      const sp500Prev = +(Number(spy.previous_close) * 10).toFixed(2);
      const sp500Change = +(sp500Price - sp500Prev).toFixed(2);
      const idx = data.data.findIndex(d => d.id === "usa");
      if (idx >= 0) {
        data.data[idx] = {
          ...data.data[idx],
          price: sp500Price,
          changePct: sp500Pct,
          change: sp500Change,
          prevClose: sp500Prev,
          provider: "Twelve Data (SPY×10)",
        };
      }
      data.source = "Mixed (Twelve Data + reference snapshot)";
      data.live = true;
    }
  } catch (_) {}
  return data;
}

async function enhanceCommodities(data) {
  // Try gold and brent from Twelve Data
  for (const [id, sym] of Object.entries(COMM_TD)) {
    try {
      const q = await tdPrice(sym);
      if (q) {
        const idx = data.data.findIndex(d => d.id === id);
        if (idx >= 0) {
          data.data[idx] = {
            ...data.data[idx],
            price: q.price,
            changePct: q.changePct,
            live: true,
          };
        }
      }
    } catch (_) {}
  }
  const anyLive = data.data.some(d => d.live);
  if (anyLive) {
    data.source = "Mixed (Twelve Data + reference)";
    data.live = true;
  }
  return data;
}

// ── Shared helpers ────────────────────────────────────────────

export const COLORS = {
  bullish: "#10b981",
  neutral: "#f59e0b",
  bearish: "#ef4444",
};
export const ICON = { bullish: "▲", neutral: "◆", bearish: "▼" };

export function fmtNum(n, dp = 2) {
  if (n == null || isNaN(n)) return "—";
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

export function fmtPct(n, dp = 2) {
  if (n == null || isNaN(n)) return "—";
  const v = Number(n);
  return `${v > 0 ? "+" : ""}${v.toFixed(dp)}%`;
}

export function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function shortDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}
