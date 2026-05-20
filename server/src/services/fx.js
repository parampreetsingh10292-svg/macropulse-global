// ─────────────────────────────────────────────────────────────
// FX rates. Provider chain: Yahoo Finance → FMP (stable) → ECB (daily).
// Returns each country currency vs USD and vs INR, plus DXY proxy.
// ─────────────────────────────────────────────────────────────

import { COUNTRIES } from "../constants.js";
import { httpJSON, stamp } from "../http.js";
import { priceHistory } from "../priceHistory.js";

const FMP_KEY = process.env.FMP_KEY || "";
const CURRENCIES = [...new Set(COUNTRIES.map((c) => c.currency))];

// DXY basket weights (ICE US Dollar Index)
const DXY_BASKET = [
  { ccy: "EUR", w: 0.576 },
  { ccy: "JPY", w: 0.136 },
  { ccy: "GBP", w: 0.119 },
  { ccy: "CAD", w: 0.091 },
  { ccy: "SEK", w: 0.042 },
  { ccy: "CHF", w: 0.036 },
];

// ── Fetch rates from multiple providers ─────────────────────

async function fetchYahooRates() {
  const allCcys = [...new Set([...CURRENCIES, ...DXY_BASKET.map((b) => b.ccy)])];
  const rates = { USD: 1 };
  for (const ccy of allCcys) {
    if (ccy === "USD") continue;
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        ccy + "=X"
      )}?interval=1d&range=1d`;
      const j = await httpJSON(url, { headers: { "User-Agent": "MacroPulse/3.1" } });
      const price = j?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (price != null) rates[ccy] = Number(price);
    } catch (_) {}
  }
  return Object.keys(rates).length > 3 ? rates : null;
}

async function fetchFMPRates() {
  if (!FMP_KEY) return null;
  const allCcys = [...new Set([...CURRENCIES, ...DXY_BASKET.map((b) => b.ccy)])];
  const rates = { USD: 1 };
  for (const ccy of allCcys) {
    if (ccy === "USD") continue;
    try {
      const url = `https://financialmodelingprep.com/stable/quote?symbol=${encodeURIComponent(
        "USD" + ccy
      )}&apikey=${FMP_KEY}`;
      const arr = await httpJSON(url);
      const q = Array.isArray(arr) ? arr[0] : null;
      if (q?.price != null) rates[ccy] = Number(q.price);
    } catch (_) {}
  }
  return Object.keys(rates).length > 3 ? rates : null;
}

async function fetchECBRates() {
  const j = await httpJSON("https://open.er-api.com/v6/latest/USD");
  return (j.result === "success" && j.rates) ? j.rates : null;
}

export async function fetchFX() {
  let rates = null;
  let source = "";

  // Try Yahoo (works locally), then FMP stable (works from cloud), then ECB
  for (const [fn, src] of [
    [fetchYahooRates, "Yahoo Finance (live)"],
    [fetchFMPRates, "Financial Modeling Prep (live)"],
    [fetchECBRates, "open.er-api.com (ECB reference rates)"],
  ]) {
    try { rates = await fn(); } catch (_) {}
    if (rates) { source = src; break; }
  }
  if (!rates) rates = {};

  const usdInr = rates.INR || 83.5;

  const rows = CURRENCIES.map((ccy) => {
    const perUsd = ccy === "USD" ? 1 : rates[ccy];
    if (perUsd != null) priceHistory.record(`fx:${ccy}`, perUsd);
    return {
      currency: ccy,
      perUSD: perUsd ? +perUsd.toFixed(4) : null,
      inINR: perUsd ? +(usdInr / perUsd).toFixed(4) : null,
      countries: COUNTRIES.filter((c) => c.currency === ccy).map((c) => c.id),
    };
  });

  // DXY proxy (geometric)
  let dxy = 50.14348112;
  for (const { ccy, w } of DXY_BASKET) {
    const r = ccy === "USD" ? 1 : rates[ccy];
    if (r) dxy *= Math.pow(ccy === "EUR" ? 1 / r : r, ccy === "EUR" ? -w : w);
  }

  return stamp(
    { usdInr: +usdInr.toFixed(4), rows, dxyProxy: +dxy.toFixed(2) },
    source || "reference",
    new Date().toISOString()
  );
}

export async function fetchFxSparklines() {
  const sparklines = {};
  for (const ccy of CURRENCIES) {
    let series = [];
    if (ccy !== "USD") {
      // Try Yahoo (works locally, fails from cloud)
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
          ccy + "=X"
        )}?interval=15m&range=1d`;
        const j = await httpJSON(url, { headers: { "User-Agent": "MacroPulse/3.1" } });
        const result = j?.chart?.result?.[0];
        if (result?.timestamp && result?.indicators?.quote?.[0]?.close) {
          const ts = result.timestamp;
          const closes = result.indicators.quote[0].close;
          series = ts
            .map((t, i) => ({ t: new Date(t * 1000).toISOString(), price: closes[i] != null ? +Number(closes[i]).toFixed(4) : null }))
            .filter((p) => p.price != null);
        }
      } catch (_) {}
    }
    // Fallback: synthetic from accumulated quotes
    if (!series.length) series = priceHistory.get(`fx:${ccy}`);
    sparklines[ccy] = series;
  }
  return stamp(sparklines, "Yahoo Finance / price history", new Date().toISOString());
}
