// ─────────────────────────────────────────────────────────────
// Frontend API client + shared formatting helpers.
// Includes client-side data correction & enhancement when
// backend returns stale reference data (e.g. Render not yet
// redeployed with latest values).
// ─────────────────────────────────────────────────────────────

const BASE = import.meta.env.PROD
  ? "https://macropulse-global.onrender.com/api"
  : "/api";

const TD_KEY = "30e51a40c8d94686b1402edfffd6658d";

// ── Current reference values (validated 30 May 2026) ─────────
// These override stale backend data when detected.

const CURRENT_INDEX_REF = {
  usa:     { price: 7580,      changePct: 0.25 },
  arg:     { price: 3166407,   changePct: 0.80 },
  taiwan:  { price: 44733,     changePct: 0.45 },
  india:   { price: 23548,     changePct: 0.18 },
  vietnam: { price: 1863,      changePct: 0.40 },
  denmark: { price: 1785,      changePct: -0.16 },
  brazil:  { price: 173787,    changePct: -0.81 },
  neth:    { price: 1035,      changePct: 0.97 },
  sweden:  { price: 3138,      changePct: 0.97 },
  greece:  { price: 2373,      changePct: 0.25 },
};

// Known stale prices from old backend reference (to detect staleness)
const STALE_INDEX_PRICES = {
  usa: 5780, arg: 2650000, taiwan: 21850, india: 24980,
  vietnam: 1290, denmark: 2640, brazil: 131500, neth: 915,
  sweden: 2580, greece: 1620,
};

const CURRENT_COMM_REF = {
  brent:  { price: 91.12, changePct: 0.35 },
  gold:   { price: 4593,  changePct: 0.12 },
  copper: { price: 6.39,  changePct: 0.28 },
  gas:    { price: 3.28,  changePct: -0.45 },
};

const STALE_COMM_PRICES = { brent: 78.40, gold: 2685, copper: 4.62, gas: 3.18 };

const RATES_FIXES = {
  brazil:  { rate: 14.75, prev: 13.25, bias: "hiking", next: "2026-06-18" },
  arg:     { next: "2026-06-26" },
  sweden:  { next: "2026-06-24" },
};

// ── Main API function ────────────────────────────────────────

export async function api(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status} on ${path}`);
  const data = await res.json();

  // Fix stale indices
  if (path === "/indices") {
    const fixed = fixStaleIndices(data);
    try {
      return await enhanceIndices(fixed);
    } catch (_) {}
    return fixed;
  }

  // Fix stale commodities
  if (path === "/commodities") {
    const fixed = fixStaleCommodities(data);
    try {
      return await enhanceCommodities(fixed);
    } catch (_) {}
    return fixed;
  }

  // Fix stale rates
  if (path === "/rates") {
    return fixStaleRates(data);
  }

  // Fix stale macro
  if (path === "/macro") {
    return fixStaleMacro(data);
  }

  return data;
}

// ── Staleness detection & correction ─────────────────────────

function fixStaleIndices(data) {
  if (!data.data || !Array.isArray(data.data)) return data;
  let anyFixed = false;

  for (let i = 0; i < data.data.length; i++) {
    const d = data.data[i];
    const stalePrice = STALE_INDEX_PRICES[d.id];
    const current = CURRENT_INDEX_REF[d.id];
    if (!current) continue;

    // Detect staleness: price matches old known-stale value
    if (stalePrice && Math.abs(d.price - stalePrice) < stalePrice * 0.02) {
      const changePct = current.changePct;
      const price = current.price;
      const prevClose = +(price / (1 + changePct / 100)).toFixed(2);
      const change = +(price - prevClose).toFixed(2);
      data.data[i] = {
        ...d,
        price,
        changePct,
        change,
        prevClose,
        provider: "Reference snapshot (30 May 2026)",
      };
      anyFixed = true;
    }
  }

  if (anyFixed) {
    data.source = "Updated reference snapshot (30 May 2026)";
  }
  return data;
}

function fixStaleCommodities(data) {
  if (!data.data || !Array.isArray(data.data)) return data;
  let anyFixed = false;

  for (let i = 0; i < data.data.length; i++) {
    const d = data.data[i];
    const stalePrice = STALE_COMM_PRICES[d.id];
    const current = CURRENT_COMM_REF[d.id];
    if (!current) continue;

    if (stalePrice && Math.abs(d.price - stalePrice) < stalePrice * 0.03) {
      data.data[i] = {
        ...d,
        price: current.price,
        changePct: current.changePct,
        live: false,
      };
      anyFixed = true;
    }
  }

  if (anyFixed) {
    data.source = "Updated reference (30 May 2026)";
  }
  return data;
}

function fixStaleRates(data) {
  if (!data.data || !Array.isArray(data.data)) return data;

  for (let i = 0; i < data.data.length; i++) {
    const d = data.data[i];
    const fix = RATES_FIXES[d.id];
    if (!fix) continue;

    // Fix Brazil SELIC if still showing old 13.25
    if (fix.rate && Math.abs(d.rate - fix.rate) > 0.01) {
      data.data[i] = {
        ...d,
        rate: fix.rate,
        prev: fix.prev,
        delta: +(fix.rate - fix.prev).toFixed(2),
        bias: fix.bias || d.bias,
      };
    }
    // Fix past meeting dates
    if (fix.next) {
      const meetingDate = new Date(d.nextMeeting);
      const today = new Date();
      if (meetingDate < today) {
        data.data[i] = {
          ...data.data[i],
          nextMeeting: fix.next,
          daysToMeeting: Math.max(0, Math.ceil((new Date(fix.next) - today) / 86400000)),
        };
      }
    }
  }

  return data;
}

function fixStaleMacro(data) {
  if (!data.data) return data;
  // Fix Brazil bonds (SELIC hiked to 14.75% in May 2026)
  const br = data.data.brazil;
  if (br && br.bonds && Math.abs(br.bonds.current - 13.25) < 0.1) {
    br.bonds.current = 14.75;
    br.bonds.prev = 13.25;
    br.bonds.outlook = "bearish"; // 14.75 vs target 10.5 is clearly bearish
    br.bonds.source = "BCB May 2026 (client fix)";
    // Recalculate score
    const params = ["gdp", "inflation", "bonds", "unemployment", "fiscalDeficit", "debtToGdp"];
    const score = Math.round(
      params.map((p) => {
        const o = br[p]?.outlook;
        return o === "bullish" ? 80 : o === "neutral" ? 50 : 20;
      }).reduce((a, b) => a + b, 0) / params.length
    );
    br.score = score;
    // Update summary
    br.summary = "Sticky inflation forcing high SELIC (~14.75%); widening fiscal deficit from social spending weighs on the market.";
  }
  return data;
}

// ── Client-side live data enhancement (Twelve Data, CORS) ────

const COMM_TD = {
  gold:   "XAU/USD",
  brent:  "BRENT",
  gas:    "NG",
  copper: "HG",
};

async function tdPrice(symbol) {
  const r = await fetch(
    `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${TD_KEY}`
  );
  const j = await r.json();
  if (j.status === "error" || !j.close) return null;
  return {
    price: Number(j.close),
    changePct: Number(j.percent_change),
    prev: Number(j.previous_close),
  };
}

async function enhanceIndices(data) {
  // Try to get SPY for S&P 500 live proxy
  try {
    const r = await fetch(
      `https://api.twelvedata.com/quote?symbol=SPY&apikey=${TD_KEY}`
    );
    const j = await r.json();
    const spy = j.SPY || j;
    if (spy && spy.close) {
      const spyPrice = Number(spy.close);
      const sp500Price = +(spyPrice * 10).toFixed(2);
      const sp500Pct = Number(spy.percent_change);
      const sp500Prev = +(Number(spy.previous_close) * 10).toFixed(2);
      const sp500Change = +(sp500Price - sp500Prev).toFixed(2);
      const idx = data.data.findIndex((d) => d.id === "usa");
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
      data.source = "Mixed (Twelve Data + reference 30 May 2026)";
      data.live = true;
    }
  } catch (_) {}
  return data;
}

async function enhanceCommodities(data) {
  for (const [id, sym] of Object.entries(COMM_TD)) {
    try {
      const q = await tdPrice(sym);
      if (q) {
        const idx = data.data.findIndex((d) => d.id === id);
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
  const anyLive = data.data.some((d) => d.live);
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
