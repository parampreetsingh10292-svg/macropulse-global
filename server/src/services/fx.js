// ─────────────────────────────────────────────────────────────
// FX rates. Primary: Yahoo Finance (live intraday) → open.er-api.com (ECB daily).
// Returns each country currency vs USD and vs INR, plus DXY proxy.
// ─────────────────────────────────────────────────────────────

import { COUNTRIES } from "../constants.js";
import { httpJSON, stamp } from "../http.js";

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

// Yahoo Finance symbol for USD→ccy pair
const yahooSym = (ccy) => ccy === "USD" ? null : `${ccy}=X`;

async function yahooRate(ccy) {
  const sym = yahooSym(ccy);
  if (!sym) return 1;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    sym
  )}?interval=1d&range=1d`;
  const j = await httpJSON(url, { headers: { "User-Agent": "MacroPulse/3.1" } });
  const price = j?.chart?.result?.[0]?.meta?.regularMarketPrice;
  return price != null ? Number(price) : null;
}

async function fetchYahooRates() {
  const allCcys = [...new Set([...CURRENCIES, ...DXY_BASKET.map((b) => b.ccy)])];
  const entries = await Promise.all(
    allCcys.map(async (ccy) => {
      try {
        const rate = await yahooRate(ccy);
        return [ccy, rate];
      } catch (_) {
        return [ccy, null];
      }
    })
  );
  const rates = Object.fromEntries(entries.filter(([, v]) => v != null));
  return Object.keys(rates).length > 3 ? rates : null;
}

async function fetchECBRates() {
  const j = await httpJSON("https://open.er-api.com/v6/latest/USD");
  return (j.result === "success" && j.rates) ? j.rates : null;
}

export async function fetchFX() {
  let rates = null;
  let source = "";
  try { rates = await fetchYahooRates(); source = "Yahoo Finance (live)"; } catch (_) {}
  if (!rates) {
    try { rates = await fetchECBRates(); source = "open.er-api.com (ECB reference rates)"; } catch (_) {}
  }
  if (!rates) rates = {};

  const usdInr = rates.INR || 83.5;

  const rows = CURRENCIES.map((ccy) => {
    const perUsd = ccy === "USD" ? 1 : rates[ccy];
    return {
      currency: ccy,
      perUSD: perUsd ? +perUsd.toFixed(4) : null,
      inINR: perUsd ? +(usdInr / perUsd).toFixed(4) : null,
      countries: COUNTRIES.filter((c) => c.currency === ccy).map((c) => c.id),
    };
  });

  // DXY proxy (geometric — close enough for a dashboard gauge)
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
    const sym = yahooSym(ccy);
    if (!sym) { sparklines[ccy] = []; continue; }
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        sym
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
    sparklines[ccy] = series;
  }
  return stamp(sparklines, "Yahoo Finance", new Date().toISOString());
}
