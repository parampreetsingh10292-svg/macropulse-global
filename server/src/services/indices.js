// ─────────────────────────────────────────────────────────────
// Live stock-index quotes for all 10 markets.
// Provider chain: Twelve Data → FMP → bundled reference snapshot.
// Every result is stamped with its source so the UI shows provenance.
// ─────────────────────────────────────────────────────────────

import { COUNTRIES } from "../constants.js";
import { httpJSON, stamp } from "../http.js";

const TD_KEY = process.env.TWELVE_DATA_KEY || "";
const FMP_KEY = process.env.FMP_KEY || "";

const YAHOO_SYMBOLS = { greece: "GD.AT" };

// Validated reference snapshot (approx Apr 2026 close) — last-resort fallback
// so the UI is never empty. Clearly labelled "reference" in the response.
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
    price,
    changePct,
    change,
    high: meta.regularMarketDayHigh != null ? Number(meta.regularMarketDayHigh) : null,
    low: meta.regularMarketDayLow != null ? Number(meta.regularMarketDayLow) : null,
    prevClose,
    isOpen: null,
    provider: "Yahoo Finance",
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
    isOpen: j.is_market_open ?? null,
    provider: "Twelve Data",
  };
}

async function fromFMP(country) {
  if (!FMP_KEY) return null;
  const url = `https://financialmodelingprep.com/api/v3/quote/${encodeURIComponent(
    country.indexSymbolFMP
  )}?apikey=${FMP_KEY}`;
  const arr = await httpJSON(url);
  const q = Array.isArray(arr) ? arr[0] : null;
  if (!q || q.price == null) return null;
  return {
    price: Number(q.price),
    changePct: Number(q.changesPercentage),
    change: Number(q.change),
    high: Number(q.dayHigh),
    low: Number(q.dayLow),
    prevClose: Number(q.previousClose),
    isOpen: null,
    provider: "Financial Modeling Prep",
  };
}

function fromReference(country) {
  const r = REFERENCE[country.id];
  return {
    price: r.price,
    changePct: r.changePct,
    change: +(r.price * (r.changePct / 100)).toFixed(2),
    high: null,
    low: null,
    prevClose: +(r.price / (1 + r.changePct / 100)).toFixed(2),
    isOpen: null,
    provider: "Reference snapshot (no live key configured)",
  };
}

export async function fetchAllIndices() {
  const results = await Promise.all(
    COUNTRIES.map(async (country) => {
      let q = null;
      for (const fn of [fromYahoo, fromTwelveData, fromFMP]) {
        try { q = await fn(country); } catch (_) {}
        if (q) break;
      }
      if (!q) q = fromReference(country);
      return {
        id: country.id,
        name: country.name,
        flag: country.flag,
        indexName: country.indexName,
        currency: country.currency,
        color: country.color,
        ...q,
      };
    })
  );
  const anyLive = results.some(
    (r) => !r.provider.startsWith("Reference")
  );
  return stamp(
    results,
    anyLive ? "Yahoo Finance / Twelve Data / FMP (live)" : "Bundled reference snapshot",
    new Date().toISOString(),
    { live: anyLive }
  );
}

// Batch-fetch all 10 sparklines in one call; cached server-side.
// Yahoo Finance (free, no key) primary → Twelve Data fallback.

export async function fetchAllSparklines() {
  const sparklines = {};
  for (const country of COUNTRIES) {
    let series = [];
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
    if (!series.length && TD_KEY) {
      try {
        const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(
          country.indexSymbol
        )}&interval=15min&outputsize=26&apikey=${TD_KEY}`;
        const j = await httpJSON(url);
        if (j.status !== "error" && j.values) {
          series = j.values
            .map((v) => ({ t: v.datetime, price: Number(v.close) }))
            .reverse();
        }
      } catch (_) {}
    }
    sparklines[country.id] = series;
  }
  return stamp(sparklines, "Yahoo Finance", new Date().toISOString());
}

// Intraday time series for sparklines (Twelve Data only; optional)
export async function fetchIndexSeries(countryId) {
  const country = COUNTRIES.find((c) => c.id === countryId);
  if (!country || !TD_KEY) {
    return stamp([], "No live key — sparkline unavailable", new Date().toISOString());
  }
  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(
    country.indexSymbol
  )}&interval=15min&outputsize=26&apikey=${TD_KEY}`;
  const j = await httpJSON(url);
  if (j.status === "error" || !j.values) {
    return stamp([], "Series unavailable", new Date().toISOString());
  }
  const series = j.values
    .map((v) => ({ t: v.datetime, price: Number(v.close) }))
    .reverse();
  return stamp(series, "Twelve Data", new Date().toISOString());
}
