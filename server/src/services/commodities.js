// ─────────────────────────────────────────────────────────────
// Commodities: Brent crude, gold, copper, natural gas.
// Twelve Data if key present; otherwise validated reference levels.
// ─────────────────────────────────────────────────────────────

import { httpJSON, stamp } from "../http.js";

const TD_KEY = process.env.TWELVE_DATA_KEY || "";

const COMMODITIES = [
  { id: "brent",  label: "Brent Crude", unit: "USD/bbl",  symbol: "BRENT",   ref: 78.4 },
  { id: "gold",   label: "Gold",        unit: "USD/oz",   symbol: "XAU/USD", ref: 2685 },
  { id: "copper", label: "Copper",      unit: "USD/lb",   symbol: "COPPER",  ref: 4.62 },
  { id: "gas",    label: "Natural Gas", unit: "USD/MMBtu",symbol: "NG",      ref: 3.18 },
];

async function tdQuote(symbol) {
  if (!TD_KEY) return null;
  try {
    const j = await httpJSON(
      `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${TD_KEY}`
    );
    if (j.status === "error" || !j.close) return null;
    return { price: Number(j.close), changePct: Number(j.percent_change) };
  } catch {
    return null;
  }
}

export async function fetchCommodities() {
  const rows = await Promise.all(
    COMMODITIES.map(async (c) => {
      const live = await tdQuote(c.symbol);
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
    anyLive ? "Twelve Data (live)" : "Validated reference levels",
    new Date().toISOString(),
    { live: anyLive }
  );
}
