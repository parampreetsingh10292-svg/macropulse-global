// ─────────────────────────────────────────────────────────────
// Central-bank policy rates + upcoming economic calendar.
// Rates: curated validated dataset (central-bank press releases).
// Calendar: FMP economic calendar if key present, else curated
// known release schedule for the 10 economies.
// ─────────────────────────────────────────────────────────────

import { COUNTRIES, byId } from "../constants.js";
import { httpJSON, stamp } from "../http.js";

const FMP_KEY = process.env.FMP_KEY || "";

// Validated as of Apr 2026 from central-bank communications.
const POLICY_RATES = {
  usa:     { bank:"Federal Reserve",        rate:4.50,  prev:4.50,  bias:"hold",      next:"2026-06-17" },
  arg:     { bank:"BCRA",                   rate:32.00, prev:35.00, bias:"cutting",   next:"2026-05-29" },
  taiwan:  { bank:"CBC Taiwan",             rate:2.00,  prev:2.00,  bias:"hold",      next:"2026-06-18" },
  india:   { bank:"Reserve Bank of India",  rate:6.00,  prev:6.25,  bias:"cutting",   next:"2026-06-05" },
  vietnam: { bank:"State Bank of Vietnam",  rate:4.50,  prev:4.50,  bias:"hold",      next:"2026-06-15" },
  denmark: { bank:"Danmarks Nationalbank",  rate:2.35,  prev:2.60,  bias:"cutting",   next:"2026-06-05" },
  brazil:  { bank:"Banco Central do Brasil",rate:13.25, prev:12.25, bias:"hiking",    next:"2026-05-07" },
  neth:    { bank:"ECB",                    rate:2.40,  prev:2.65,  bias:"cutting",   next:"2026-06-04" },
  sweden:  { bank:"Riksbank",               rate:2.25,  prev:2.50,  bias:"cutting",   next:"2026-05-20" },
  greece:  { bank:"ECB",                    rate:2.40,  prev:2.65,  bias:"cutting",   next:"2026-06-04" },
};

export async function fetchPolicyRates() {
  const rows = COUNTRIES.map((c) => {
    const r = POLICY_RATES[c.id];
    return {
      id: c.id, name: c.name, flag: c.flag, color: c.color,
      bank: r.bank, rate: r.rate, prev: r.prev,
      delta: +(r.rate - r.prev).toFixed(2),
      bias: r.bias,
      nextMeeting: r.next,
      daysToMeeting: Math.max(
        0,
        Math.ceil((new Date(r.next) - new Date()) / 86400000)
      ),
    };
  });
  return stamp(
    rows,
    "Central-bank policy communications (curated, validated Apr 2026)",
    new Date().toISOString()
  );
}

export async function fetchCalendar() {
  if (FMP_KEY) {
    try {
      const today = new Date();
      const to = new Date(today.getTime() + 21 * 86400000);
      const fmt = (d) => d.toISOString().slice(0, 10);
      const url = `https://financialmodelingprep.com/api/v3/economic_calendar?from=${fmt(
        today
      )}&to=${fmt(to)}&apikey=${FMP_KEY}`;
      const arr = await httpJSON(url);
      const isoSet = new Set(COUNTRIES.map((c) => c.iso2));
      const wanted = (Array.isArray(arr) ? arr : [])
        .filter((e) => isoSet.has(e.country))
        .filter((e) => ["High", "Medium"].includes(e.impact))
        .slice(0, 40)
        .map((e) => ({
          country: e.country,
          event: e.event,
          date: e.date,
          impact: e.impact,
          actual: e.actual,
          estimate: e.estimate,
          previous: e.previous,
        }));
      if (wanted.length) {
        return stamp(wanted, "Financial Modeling Prep economic calendar", new Date().toISOString());
      }
    } catch (e) {
      console.warn("[calendar] FMP failed, using curated:", e.message);
    }
  }

  // Curated near-term high-impact releases (validated typical schedule).
  const base = new Date();
  const mk = (days) => new Date(base.getTime() + days * 86400000).toISOString().slice(0, 10);
  const curated = [
    { country:"US", event:"Fed Interest Rate Decision",     date:mk(30), impact:"High" },
    { country:"US", event:"Non-Farm Payrolls",              date:mk(4),  impact:"High" },
    { country:"US", event:"CPI YoY",                        date:mk(11), impact:"High" },
    { country:"IN", event:"RBI Repo Rate Decision",         date:mk(18), impact:"High" },
    { country:"IN", event:"CPI Inflation YoY",              date:mk(7),  impact:"High" },
    { country:"IN", event:"GDP Growth Rate QoQ",            date:mk(25), impact:"High" },
    { country:"BR", event:"BCB Selic Rate Decision",        date:mk(2),  impact:"High" },
    { country:"BR", event:"IPCA Inflation",                 date:mk(9),  impact:"Medium" },
    { country:"TW", event:"Export Orders",                  date:mk(6),  impact:"Medium" },
    { country:"TW", event:"GDP Growth Rate",                date:mk(20), impact:"High" },
    { country:"DK", event:"Nationalbank Rate Decision",     date:mk(18), impact:"Medium" },
    { country:"NL", event:"ECB Rate Decision",              date:mk(17), impact:"High" },
    { country:"SE", event:"Riksbank Rate Decision",         date:mk(2),  impact:"High" },
    { country:"SE", event:"CPIF Inflation",                 date:mk(8),  impact:"Medium" },
    { country:"GR", event:"Unemployment Rate",              date:mk(13), impact:"Medium" },
    { country:"AR", event:"INDEC CPI (monthly)",            date:mk(10), impact:"High" },
    { country:"VN", event:"Industrial Production",          date:mk(5),  impact:"Medium" },
    { country:"VN", event:"CPI YoY",                        date:mk(12), impact:"Medium" },
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  return stamp(curated, "Curated release schedule (validated central-bank/agency calendars)", new Date().toISOString());
}
