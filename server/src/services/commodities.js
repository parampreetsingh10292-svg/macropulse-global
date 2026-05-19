// ─────────────────────────────────────────────────────────────
// Commodities: Brent crude, gold, copper, natural gas.
// Provider chain: Yahoo Finance → Twelve Data → reference.
// ─────────────────────────────────────────────────────────────

import { httpJSON, stamp } from "../http.js";

const TD_KEY = process.env.TWELVE_DATA_KEY || "";

const COMMODITIES = [
  { id: "brent",  label: "Brent Crude", unit: "USD/bbl",  symbol: "BRENT",   yahoo: "BZ=F",  ref: 78.4 },
  { id: "gold",   label: "Gold",        unit: "USD/oz",   symbol: "XAU/USD", yahoo: "GC=F",  ref: 2685 },
  { id: "copper", label: "Copper",      unit: "USD/lb",   symbol: "COPPER",  yahoo: "HG=F",  ref: 4.62 },
  { id: "gas",    label: "Natural Gas", unit: "USD/MMBtu", symbol: "NG",     yahoo: "NG=F",  ref: 3.18 },
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
  return { price, changePct };
}

async function fromTD(sym) {
  if (!TD_KEY) return null;
  const j = await httpJSON(
    `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(sym)}&apikey=${TD_KEY}`
  );
  if (j.status === "error" || !j.close) return null;
  return { price: Number(j.close), changePct: Number(j.percent_change) };
}

export async function fetchCommodities() {
  const rows = await Promise.all(
    COMMODITIES.map(async (c) => {
      let live = null;
      for (const fn of [() => fromYahoo(c.yahoo), () => fromTD(c.symbol)]) {
        try { live = await fn(); } catch (_) {}
        if (live) break;
      }
      return {
        id: c.id,
        label: c.label,
        unit: c.unit,
        price: live ? live.price : c.ref,
        changePct: live ? live.changePct : 0,
        live: !!live,
      };
    })
  );
  const anyLive = rows.some((r) => r.live);
  return stamp(
    rows,
    anyLive ? "Yahoo Finance (live)" : "Validated reference levels",
    new Date().toISOString(),
    { live: anyLive }
  );
}

export async function fetchCommoditySparklines() {
  const sparklines = {};
  for (const c of COMMODITIES) {
    let series = [];
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
    sparklines[c.id] = series;
  }
  return stamp(sparklines, "Yahoo Finance", new Date().toISOString());
}
