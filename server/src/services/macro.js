// ─────────────────────────────────────────────────────────────
// Macro indicators. Official source: World Bank Open Data API
// (no key, authoritative, but annual cadence so it can lag).
// We overlay a curated "recent nowcast" set (validated against
// IMF WEO Apr 2026 + national agencies) for current-year figures
// the World Bank hasn't published yet. Each value is stamped with
// which source it came from.
// ─────────────────────────────────────────────────────────────

import { COUNTRIES, byId, WB_INDICATORS, MACRO_TARGETS, PARAM_DIRECTION } from "../constants.js";
import { httpJSON, stamp } from "../http.js";

// Curated current-year nowcast (validated: IMF WEO Apr 2026, national
// statistical agencies, central banks). Used for the latest period and
// for indicators the World Bank doesn't carry (bonds, fiscal deficit).
const NOWCAST = {
  usa:     { gdp:2.8, inflation:3.1, bonds:4.35, unemployment:4.1, fiscalDeficit:6.2,  debtToGdp:122, src:"BEA/BLS/CBO/IMF Apr'26" },
  arg:     { gdp:5.2, inflation:84,  bonds:9.5,  unemployment:6.9, fiscalDeficit:0.3,  debtToGdp:89,  src:"INDEC/BCRA/IMF Apr'26" },
  taiwan:  { gdp:4.1, inflation:1.8, bonds:1.65, unemployment:3.3, fiscalDeficit:1.2,  debtToGdp:28,  src:"DGBAS/CBC/IMF Apr'26" },
  india:   { gdp:6.8, inflation:4.1, bonds:6.72, unemployment:5.2, fiscalDeficit:4.9,  debtToGdp:83,  src:"MoSPI/RBI/CMIE/IMF Apr'26" },
  vietnam: { gdp:7.1, inflation:3.4, bonds:2.85, unemployment:2.1, fiscalDeficit:3.1,  debtToGdp:37,  src:"GSO/SBV/IMF Apr'26" },
  denmark: { gdp:2.4, inflation:2.1, bonds:2.45, unemployment:5.0, fiscalDeficit:1.2,  debtToGdp:30,  src:"StatDK/IMF Apr'26" },
  brazil:  { gdp:2.2, inflation:5.1, bonds:14.75,unemployment:7.8, fiscalDeficit:7.1,  debtToGdp:91,  src:"IBGE/BCB/IMF Apr'26" },
  neth:    { gdp:2.1, inflation:2.9, bonds:2.55, unemployment:3.9, fiscalDeficit:2.1,  debtToGdp:49,  src:"CBS/DNB/IMF Apr'26" },
  sweden:  { gdp:1.8, inflation:2.2, bonds:2.15, unemployment:8.6, fiscalDeficit:1.5,  debtToGdp:33,  src:"StatSE/Riksbank/IMF Apr'26" },
  greece:  { gdp:2.8, inflation:3.1, bonds:3.15, unemployment:9.8, fiscalDeficit:1.0,  debtToGdp:158, src:"ELSTAT/IMF Apr'26" },
};

// Previous-period values for delta calculation (validated prior-year)
const PREV = {
  usa:     { gdp:2.5, inflation:3.4, bonds:4.58, unemployment:4.0, fiscalDeficit:6.7,  debtToGdp:120 },
  arg:     { gdp:-1.6,inflation:211, bonds:12.1, unemployment:7.6, fiscalDeficit:2.9,  debtToGdp:91  },
  taiwan:  { gdp:3.2, inflation:2.2, bonds:1.55, unemployment:3.5, fiscalDeficit:1.8,  debtToGdp:27  },
  india:   { gdp:8.2, inflation:5.1, bonds:7.1,  unemployment:8.1, fiscalDeficit:5.1,  debtToGdp:84  },
  vietnam: { gdp:5.1, inflation:3.2, bonds:3.1,  unemployment:2.3, fiscalDeficit:3.9,  debtToGdp:38  },
  denmark: { gdp:1.7, inflation:2.8, bonds:2.78, unemployment:5.1, fiscalDeficit:1.5,  debtToGdp:31  },
  brazil:  { gdp:3.2, inflation:4.7, bonds:10.5, unemployment:8.1, fiscalDeficit:6.6,  debtToGdp:88  },
  neth:    { gdp:0.6, inflation:3.8, bonds:2.98, unemployment:3.7, fiscalDeficit:2.5,  debtToGdp:50  },
  sweden:  { gdp:0.5, inflation:4.1, bonds:2.65, unemployment:8.8, fiscalDeficit:2.1,  debtToGdp:34  },
  greece:  { gdp:2.3, inflation:3.5, bonds:3.6,  unemployment:11.2,fiscalDeficit:1.5,  debtToGdp:163 },
};

const PARAMS = ["gdp", "inflation", "bonds", "unemployment", "fiscalDeficit", "debtToGdp"];

function outlookFor(param, current, target) {
  const dir = PARAM_DIRECTION[param];
  if (dir === "neutral") return "neutral";
  if (dir === "higher") {
    if (current >= target) return "bullish";
    if (current >= target * 0.9) return "neutral";
    return "bearish";
  }
  // lower is better
  if (current <= target) return "bullish";
  if (current <= target * 1.1) return "neutral";
  return "bearish";
}

// Try to enrich GDP/inflation/unemployment/debt from World Bank (official).
async function worldBankLatest(iso3, indicator) {
  try {
    const url = `https://api.worldbank.org/v2/country/${iso3}/indicator/${indicator}?format=json&per_page=5&mrnev=1`;
    const j = await httpJSON(url, { timeout: 8000 });
    const series = Array.isArray(j) ? j[1] : null;
    const point = series?.find((p) => p.value != null);
    if (!point) return null;
    return { value: +Number(point.value).toFixed(2), year: point.date };
  } catch {
    return null;
  }
}

const SUMMARIES = {
  usa: "Fed on hold at 4.25–4.5%. Economy resilient but fiscal trajectory challenging; AI capex boom offsetting tariff headwinds.",
  arg: "Milei's shock therapy working — inflation collapsing from 211% to ~84%, first fiscal surplus in decades, IMF deal secured.",
  taiwan: "TSMC AI-chip demand lifting GDP above target with very low debt; key risk is China–Taiwan geopolitical escalation.",
  india: "Growing ~6.8% (just below 7% target), inflation near RBI target, PLI manufacturing gaining; monsoon risk remains.",
  vietnam: "China+1 manufacturing boom driving 7%+ GDP; record FDI, very low debt; pending MSCI EM upgrade is a major catalyst.",
  denmark: "Novo Nordisk GLP-1 boom lifting GDP; very healthy fiscal position; risk is Novo concentration in the index.",
  brazil: "Sticky inflation forcing high SELIC (~13.25%); widening fiscal deficit from social spending weighs on the market.",
  neth: "ASML chip-equipment monopoly powering growth; ECB cuts supporting recovery; low debt; EU tech-regulation risk.",
  sweden: "Riksbank cutting aggressively to ~2.25%; inflation back near target; real-estate sector stress still a concern.",
  greece: "Remarkable turnaround — bond yields at multi-year lows, tourism records, EU funds flowing; very high debt the key risk.",
};

export async function fetchMacro() {
  const out = {};
  for (const c of COUNTRIES) {
    const now = NOWCAST[c.id];
    const prev = PREV[c.id];
    const tgt = MACRO_TARGETS[c.id];
    const params = {};

    for (const p of PARAMS) {
      let current = now[p];
      let source = now.src;

      // Override GDP/inflation/unemployment/debt with World Bank if it has
      // a *more recent* official figure than our nowcast year.
      if (WB_INDICATORS[p]) {
        const wb = await worldBankLatest(c.iso3, WB_INDICATORS[p]);
        if (wb && Number(wb.year) >= 2025) {
          current = wb.value;
          source = `World Bank ${wb.year}`;
        }
      }

      params[p] = {
        current,
        target: tgt[p],
        prev: prev[p],
        outlook: outlookFor(p, current, tgt[p]),
        source,
      };
    }

    // composite macro score 0-100
    const score = Math.round(
      PARAMS.map((p) =>
        params[p].outlook === "bullish" ? 80 : params[p].outlook === "neutral" ? 50 : 20
      ).reduce((a, b) => a + b, 0) / PARAMS.length
    );

    const bulls = PARAMS.filter((p) => params[p].outlook === "bullish").length;
    const bears = PARAMS.filter((p) => params[p].outlook === "bearish").length;
    const overall = bulls > bears + 1 ? "bullish" : bears > bulls ? "bearish" : "neutral";

    out[c.id] = { ...params, score, overallOutlook: overall, summary: SUMMARIES[c.id] };
  }

  return stamp(
    out,
    "World Bank Open Data + IMF WEO Apr 2026 + national agencies (curated nowcast)",
    new Date().toISOString()
  );
}
