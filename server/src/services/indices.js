// ─────────────────────────────────────────────────────────────
// Live stock-index quotes for all 10 markets.
// Provider chain: Yahoo Finance → FMP (stable) → Twelve Data → reference.
// Yahoo works locally; FMP/TD work from cloud servers.
// ─────────────────────────────────────────────────────────────

import { COUNTRIES } from "../constants.js";
import { httpJSON, stamp } from "../http.js";
import { priceHistory } from "../priceHistory.js";

const TD_KEY = process.env.TWELVE_DATA_KEY || "";
const FMP_KEY = process.env.FMP_KEY || "";

const YAHOO_SYMBOLS = { greece: "GD.AT" };

// Validated reference snapshot — last-resort fallback
const REFERENCE = {
  usa:     { price: 5780,  changePct: 0.42 },
  arg:     { price: 2_650_000, changePct: 1.15 },
  taiwan:  { price: 21850, changePct: -0.31 },
  india:   { price: 24980, changePct: 0.18 },
  vietnam: { price: 1290,  changePct: 0.55 },
  denmark: { price: 2640,  changePct: 0.22 },
  brazil:  { price: 131500,changePct: 0.74 },
  neth:    { price: 915,   changePct: 0.12 },
  sweden:  { price: 2580,  changePct: -0.08 },
  greece:  { price: 1620,  changePct: 0.61 },
};

// ── Provider functions ──────────────────────────────────────

async function fromYahoo(country) {
  const yahooSym = YAHOO_SYMBOLS[country.id] || country.indexSymbolFMP;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    yahooSym
  )}?interval=1d&range=1d`;
  const j = await httpJSON(url, { headers: { "User-Agent": "MacroPulse/3.1" } });
  const meta = j?.chart?.result?.[0]?.meta;
  if (!meta || meta.regularMarketPrice == null) return null;
  const price = Number(meta.regularMarketPrice);
  const prevClose = Number(meta.chartPreviousClose || meta.previousClose);
  const change = prevClose ? +(price - prevClose).toFixed(2) : 0;
  const changePct = prevClose ? +((change / prevClose) * 100).toFixed(2) : 0;
  return {
    price, changePct, change,
    high: meta.regularMarketDayHigh != null ? Number(meta.regularMarketDayHigh) : null,
    low: meta.regularMarketDayLow != null ? Number(meta.regularMarketDayLow) : null,
    prevClose, isOpen: null, provider: "Yahoo Finance",
  };
}

async function fromFMP(country) {
  if (!FMP_KEY) return null;
  // Use the new /stable/ endpoint (legacy /api/v3/ is dead on free plan)
  const url = `https://financialmodelingprep.com/stable/quote?symbol=${encodeURIComponent(
    country.indexSymbolFMP
  )}&apikey=${FMP_KEY}`;
  const arr = await httpJSON(url);
  const q = Array.isArray(arr) ? arr[0] : null;
  if (!q || q.price == null) return null;
  return {
    price: Number(q.price),
    changePct: Number(q.changePercentage),
    change: Number(q.change),
    high: q.dayHigh != null ? Number(q.dayHigh) : null,
    low: q.dayLow != null ? Number(q.dayLow) : null,
    prevClose: q.previousClose != null ? Number(q.previousClose) : null,
    isOpen: null, provider: "Financial Modeling Prep",
  };
}

async function fromTwelveData(country) {
  if (!TD_KEY) return null;
  const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(
    country.indexSymbol
  )}&apikey=${TD_KEY}`;
  const j = await httpJSON(url);
  if (j.status === "error" || !j.close) return null;
  return {
    price: Number(j.close),
    changePct: Number(j.percent_change),
    change: Number(j.change),
    high: Number(j.high),
    low: Number(j.low),
    prevClose: Number(j.previous_close),
    isOpen: j.is_market_open ?? null, provider: "Twelve Data",
  };
}

function fromReference(country) {
  const r = REFERENCE[country.id];
  return {
    price: r.price, changePct: r.changePct,
    change: +(r.price * (r.changePct / 100)).toFixed(2),
    high: null, low: null,
    prevClose: +(r.price / (1 + r.changePct / 100)).toFixed(2),
    isOpen: null, provider: "Reference snapshot",
  };
}

// ── Sequential fetcher (avoids rate-limit bursts) ───────────

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fetchAllIndices() {
  const results = [];
  for (const country of COUNTRIES) {
    let q = null;
    for (const fn of [fromYahoo, fromFMP, fromTwelveData]) {
      try { q = await fn(country); } catch (_) {}
      if (q) break;
    }
    if (!q) q = fromReference(country);

    // Record price for synthetic sparklines
    priceHistory.record(`idx:${country.id}`, q.price);

    results.push({
      id: country.id, name: country.name, flag: country.flag,
      indexName: country.indexName, currency: country.currency,
      color: country.color, ...q,
    });
  }
  const anyLive = results.some((r) => !r.provider.startsWith("Reference"));
  return stamp(
    results,
    anyLive ? "Live (" + results.find(r => !r.provider.startsWith("Reference"))?.provider + ")" : "Bundled reference snapshot",
    new Date().toISOString(),
    { live: anyLive }
  );
}

// ── Sparklines: Yahoo primary → synthetic fallback ──────────

export async function fetchAllSparklines() {
  const sparklines = {};
  for (const country of COUNTRIES) {
    let series = [];
    // Try Yahoo Finance (works locally, fails from cloud)
    const yahooSym = YAHOO_SYMBOLS[country.id] || country.indexSymbolFMP;
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        yahooSym
      )}?interval=15m&range=1d`;
      const j = await httpJSON(url, { headers: { "User-Agent": "MacroPulse/3.1" } });
      const result = j?.chart?.result?.[0];
      if (result?.timestamp && result?.indicators?.quote?.[0]?.close) {
        const ts = result.timestamp;
        const closes = result.indicators.quote[0].close;
        series = ts
          .map((t, i) => ({ t: new Date(t * 1000).toISOString(), price: closes[i] != null ? +Number(closes[i]).toFixed(2) : null }))
          .filter((p) => p.price != null);
      }
    } catch (_) {}
    // Fallback: synthetic sparkline from accumulated quote history
    if (!series.length) {
      series = priceHistory.get(`idx:${country.id}`);
    }
    sparklines[country.id] = series;
  }
  return stamp(sparklines, "Yahoo Finance / price history", new Date().toISOString());
}

export async function fetchIndexSeries(countryId) {
  const country = COUNTRIES.find((c) => c.id === countryId);
  if (!country) return stamp([], "Unknown country", new Date().toISOString());
  // Try Yahoo first
  const yahooSym = YAHOO_SYMBOLS[country.id] || country.indexSymbolFMP;
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      yahooSym
    )}?interval=15m&range=1d`;
    const j = await httpJSON(url, { headers: { "User-Agent": "MacroPulse/3.1" } });
    const result = j?.chart?.result?.[0];
    if (result?.timestamp && result?.indicators?.quote?.[0]?.close) {
      const series = result.timestamp
        .map((t, i) => ({ t: new Date(t * 1000).toISOString(), price: result.indicators.quote[0].close[i] != null ? +Number(result.indicators.quote[0].close[i]).toFixed(2) : null }))
        .filter((p) => p.price != null);
      if (series.length) return stamp(series, "Yahoo Finance", new Date().toISOString());
    }
  } catch (_) {}
  // Fallback: synthetic
  const series = priceHistory.get(`idx:${country.id}`);
  return stamp(series, series.length ? "Price history" : "Unavailable", new Date().toISOString());
}
