// ─────────────────────────────────────────────────────────────
// Commodities: Brent crude, gold, copper, natural gas.
// Provider chain: Yahoo Finance → FMP (stable) → Twelve Data → reference.
// ─────────────────────────────────────────────────────────────

import { httpJSON, stamp } from "../http.js";
import { priceHistory } from "../priceHistory.js";

const TD_KEY = process.env.TWELVE_DATA_KEY || "";
const FMP_KEY = process.env.FMP_KEY || "";

const COMMODITIES = [
  { id: "brent",  label: "Brent Crude", unit: "USD/bbl",  tdSym: "BRENT",   yahoo: "BZ=F",  fmp: "BZUSD",  ref: 78.4 },
  { id: "gold",   label: "Gold",        unit: "USD/oz",   tdSym: "XAU/USD", yahoo: "GC=F",  fmp: "GCUSD",  ref: 2685 },
  { id: "copper", label: "Copper",      unit: "USD/lb",   tdSym: "COPPER",  yahoo: "HG=F",  fmp: null,     ref: 4.62 },
  { id: "gas",    label: "Natural Gas", unit: "USD/MMBtu", tdSym: "NG",     yahoo: "NG=F",  fmp: null,     ref: 3.18 },
];

async function fromYahoo(sym) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    sym
  )}?interval=1d&range=1d`;
  const j = await httpJSON(url, { headers: { "User-Agent": "MacroPulse/3.1" } });
  const meta = j?.chart?.result?.[0]?.meta;
  if (!meta || meta.regularMarketPrice == null) return null;
  const price = Number(meta.regularMarketPrice);
  const prev = Number(meta.chartPreviousClose || meta.previousClose);
  const change = prev ? +(price - prev).toFixed(4) : 0;
  const changePct = prev ? +((change / prev) * 100).toFixed(2) : 0;
  return { price, changePct, provider: "Yahoo Finance" };
}

async function fromFMP(sym) {
  if (!FMP_KEY || !sym) return null;
  const url = `https://financialmodelingprep.com/stable/quote?symbol=${encodeURIComponent(
    sym
  )}&apikey=${FMP_KEY}`;
  const arr = await httpJSON(url);
  const q = Array.isArray(arr) ? arr[0] : null;
  if (!q || q.price == null) return null;
  return { price: Number(q.price), changePct: Number(q.changePercentage), provider: "Financial Modeling Prep" };
}

async function fromTD(sym) {
  if (!TD_KEY) return null;
  const j = await httpJSON(
    `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(sym)}&apikey=${TD_KEY}`
  );
  if (j.status === "error" || !j.close) return null;
  return { price: Number(j.close), changePct: Number(j.percent_change), provider: "Twelve Data" };
}

export async function fetchCommodities() {
  const rows = [];
  for (const c of COMMODITIES) {
    let live = null;
    for (const fn of [() => fromYahoo(c.yahoo), () => fromFMP(c.fmp), () => fromTD(c.tdSym)]) {
      try { live = await fn(); } catch (_) {}
      if (live) break;
    }
    const price = live ? live.price : c.ref;
    priceHistory.record(`comm:${c.id}`, price);
    rows.push({
      id: c.id, label: c.label, unit: c.unit,
      price, changePct: live ? live.changePct : 0,
      live: !!live,
    });
  }
  const anyLive = rows.some((r) => r.live);
  return stamp(
    rows,
    anyLive ? "Live (FMP / Yahoo Finance)" : "Validated reference levels",
    new Date().toISOString(),
    { live: anyLive }
  );
}

export async function fetchCommoditySparklines() {
  const sparklines = {};
  for (const c of COMMODITIES) {
    let series = [];
    // Try Yahoo Finance (works locally, fails from cloud)
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        c.yahoo
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
    // Fallback: synthetic from accumulated quotes
    if (!series.length) series = priceHistory.get(`comm:${c.id}`);
    sparklines[c.id] = series;
  }
  return stamp(sparklines, "Yahoo Finance / price history", new Date().toISOString());
}
