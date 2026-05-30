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
// Updated: 30 May 2026 from Yahoo Finance / TradingEconomics / Google Finance
const REFERENCE = {
  usa:     { price: 7580,     changePct: 0.25 },
  arg:     { price: 3_166_407, changePct: 0.80 },
  taiwan:  { price: 44733,   changePct: 0.45 },
  india:   { price: 23548,   changePct: 0.18 },
  vietnam: { price: 1863,    changePct: 0.40 },
  denmark: { price: 1785,    changePct: -0.16 },
  brazil:  { price: 173787,  changePct: -0.81 },
  neth:    { price: 1035,    changePct: 0.97 },
  sweden:  { price: 3138,    changePct: 0.97 },
  greece:  { price: 2373,    changePct: 0.25 },
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

// ── Batch Twelve Data fetcher (efficient for cloud) ─────────

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const IS_CLOUD = !!process.env.RENDER || !!process.env.NODE_ENV && process.env.NODE_ENV === "production";

// Twelve Data ETF proxies for indices not available on free plan
const TD_ETF_PROXY = {
  SPX:       { sym: "SPY",  mult: 10 },    // SPY ≈ S&P 500 / 10
  MERV:      null,                          // no ETF proxy
  TWII:      { sym: "EWT",  mult: null },   // ETF, no multiplier
  "NIFTY 50":{ sym: "INDA", mult: null },
  VNINDEX:   { sym: "VNM",  mult: null },
  OMXC25:    null,
  IBOV:      { sym: "EWZ",  mult: null },
  AEX:       { sym: "EWN",  mult: null },
  OMXS30:    null,
  ATG:       null,
};

async function batchTwelveDataPrices() {
  if (!TD_KEY) return {};
  // Fetch prices for all available index symbols in one batch
  const symbols = COUNTRIES
    .map(c => c.indexSymbol)
    .filter(s => !["SPX", "NIFTY 50"].includes(s)); // These need Pro plan
  const etfSymbols = ["SPY"]; // Always fetch SPY for S&P proxy
  const allSyms = [...new Set([...symbols, ...etfSymbols])].join(",");
  try {
    const j = await httpJSON(`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(allSyms)}&apikey=${TD_KEY}`);
    return j || {};
  } catch (_) { return {}; }
}

export async function fetchAllIndices() {
  const results = [];

  // Strategy 1: Try Yahoo first (works locally)
  let yahooWorked = false;
  try {
    const testQ = await fromYahoo(COUNTRIES[0]);
    if (testQ) yahooWorked = true;
  } catch (_) {}

  if (yahooWorked) {
    // Local mode: fetch all from Yahoo
    for (const country of COUNTRIES) {
      let q = null;
      try { q = await fromYahoo(country); } catch (_) {}
      if (!q) q = fromReference(country);
      priceHistory.record(`idx:${country.id}`, q.price);
      results.push({
        id: country.id, name: country.name, flag: country.flag,
        indexName: country.indexName, currency: country.currency,
        color: country.color, ...q,
      });
    }
  } else {
    // Cloud mode: try Twelve Data batch, then FMP, then reference
    // First try a batch call to Twelve Data for all symbols at once
    let tdResults = {};
    if (TD_KEY) {
      for (const country of COUNTRIES) {
        try {
          const q = await fromTwelveData(country);
          if (q) { tdResults[country.id] = q; }
        } catch (_) {}
        await delay(150); // gentle spacing to avoid rate limit
      }
    }

    // For any missing, try FMP
    for (const country of COUNTRIES) {
      let q = tdResults[country.id] || null;
      if (!q) {
        try { q = await fromFMP(country); } catch (_) {}
      }
      if (!q) q = fromReference(country);
      priceHistory.record(`idx:${country.id}`, q.price);
      results.push({
        id: country.id, name: country.name, flag: country.flag,
        indexName: country.indexName, currency: country.currency,
        color: country.color, ...q,
      });
    }
  }

  const anyLive = results.some((r) => !r.provider.startsWith("Reference"));
  return stamp(
    results,
    anyLive ? "Live (" + results.find(r => !r.provider.startsWith("Reference"))?.provider + ")" : "Bundled reference snapshot (30 May 2026)",
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
