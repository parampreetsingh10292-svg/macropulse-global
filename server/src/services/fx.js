// ─────────────────────────────────────────────────────────────
// FX rates. Primary: exchangerate.host (free, no key, ECB-sourced).
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

export async function fetchFX() {
  const url = `https://open.er-api.com/v6/latest/USD`;
  const j = await httpJSON(url);
  const rates = (j.result === "success" && j.rates) ? j.rates : {};
  const usdInr = rates.INR || 83.5;

  const rows = CURRENCIES.map((ccy) => {
    const perUsd = rates[ccy];
    return {
      currency: ccy,
      perUSD: perUsd ? +perUsd.toFixed(4) : null,
      // value of 1 unit of this currency in INR
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
    "open.er-api.com (ECB reference rates)",
    j.time_last_update_utc ? new Date(j.time_last_update_utc).toISOString() : new Date().toISOString()
  );
}
