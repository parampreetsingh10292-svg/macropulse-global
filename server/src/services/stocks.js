// ─────────────────────────────────────────────────────────────
// Top 3 performing stocks per market + how an Indian investor
// can access each. Stock list is a curated validated set; live
// YTD % is enriched from FMP if a key is configured.
// ─────────────────────────────────────────────────────────────

import { COUNTRIES } from "../constants.js";
import { httpJSON, stamp } from "../http.js";

const FMP_KEY = process.env.FMP_KEY || "";

const STOCKS = {
  usa: {
    list: [
      { name:"NVIDIA", ticker:"NVDA", sector:"AI/Semis", fmp:"NVDA" },
      { name:"Microsoft", ticker:"MSFT", sector:"Cloud/AI", fmp:"MSFT" },
      { name:"Meta Platforms", ticker:"META", sector:"Social/AI", fmp:"META" },
    ],
    howToInvest: "Via Motilal Oswal Nasdaq 100 FoF or Mirae Asset NYSE FANG+ FoF on Zerodha Coin (SIP from ₹100). For direct stock, use INDmoney/Vested under the LRS.",
  },
  arg: {
    list: [
      { name:"MercadoLibre", ticker:"MELI", sector:"E-commerce", fmp:"MELI" },
      { name:"Grupo Galicia", ticker:"GGAL", sector:"Banking", fmp:"GGAL" },
      { name:"YPF", ticker:"YPF", sector:"Energy", fmp:"YPF" },
    ],
    howToInvest: "No dedicated India MF. MELI/GGAL/YPF trade as US ADRs — access via INDmoney/Vested. PGIM India Global Equity Fund has LatAm exposure.",
  },
  taiwan: {
    list: [
      { name:"TSMC", ticker:"TSM", sector:"Semiconductors", fmp:"TSM" },
      { name:"Hon Hai (Foxconn)", ticker:"2317.TW", sector:"Electronics", fmp:"" },
      { name:"MediaTek", ticker:"2454.TW", sector:"Chipmaker", fmp:"" },
    ],
    howToInvest: "Nippon India Taiwan Equity Fund — India's only dedicated Taiwan fund (SIP via Zerodha Coin). TSMC also as US ADR (TSM) via INDmoney/Vested.",
  },
  india: {
    list: [
      { name:"Reliance Industries", ticker:"RELIANCE", sector:"Conglomerate", fmp:"RELIANCE.NS" },
      { name:"HDFC Bank", ticker:"HDFCBANK", sector:"Banking", fmp:"HDFCBANK.NS" },
      { name:"Infosys", ticker:"INFY", sector:"IT Services", fmp:"INFY.NS" },
    ],
    howToInvest: "Direct on Zerodha Kite. Or a Nifty 50 index fund (UTI/HDFC Nifty 50) for broad low-cost exposure.",
  },
  vietnam: {
    list: [
      { name:"Vingroup", ticker:"VIC", sector:"Conglomerate", fmp:"" },
      { name:"Vinhomes", ticker:"VHM", sector:"Real Estate", fmp:"" },
      { name:"Vietcombank", ticker:"VCB", sector:"Banking", fmp:"" },
    ],
    howToInvest: "Limited direct access. Use PGIM India Global / Franklin India Feeder funds with EM-Asia allocation for indirect Vietnam exposure.",
  },
  denmark: {
    list: [
      { name:"Novo Nordisk", ticker:"NVO", sector:"Pharma/GLP-1", fmp:"NVO" },
      { name:"Vestas Wind", ticker:"VWS.CO", sector:"Wind Energy", fmp:"" },
      { name:"Demant", ticker:"DEMANT.CO", sector:"Hearing Health", fmp:"" },
    ],
    howToInvest: "Novo Nordisk as US ADR (NVO) via INDmoney/Vested. No dedicated Denmark MF in India; broad European funds give partial exposure.",
  },
  brazil: {
    list: [
      { name:"Petrobras", ticker:"PBR", sector:"Oil & Gas", fmp:"PBR" },
      { name:"Vale", ticker:"VALE", sector:"Mining", fmp:"VALE" },
      { name:"Itaú Unibanco", ticker:"ITUB", sector:"Banking", fmp:"ITUB" },
    ],
    howToInvest: "PBR/VALE/ITUB trade as US ADRs — access via INDmoney/Vested. DSP World Mining Fund holds Vale indirectly.",
  },
  neth: {
    list: [
      { name:"ASML", ticker:"ASML", sector:"Chip Equipment", fmp:"ASML" },
      { name:"Heineken", ticker:"HEINY", sector:"Consumer", fmp:"HEINY" },
      { name:"Stellantis", ticker:"STLA", sector:"Automotive", fmp:"STLA" },
    ],
    howToInvest: "ASML on Nasdaq — direct via INDmoney/Vested. Edelweiss US Technology FoF and Nasdaq 100 funds hold ASML indirectly (Zerodha Coin).",
  },
  sweden: {
    list: [
      { name:"Spotify", ticker:"SPOT", sector:"Music/Tech", fmp:"SPOT" },
      { name:"Volvo Cars", ticker:"VOLCAR.ST", sector:"EV/Auto", fmp:"" },
      { name:"Ericsson", ticker:"ERIC", sector:"Telecom", fmp:"ERIC" },
    ],
    howToInvest: "Spotify (SPOT) and Ericsson (ERIC) are US-listed — access via INDmoney/Vested. No dedicated Sweden MF in India.",
  },
  greece: {
    list: [
      { name:"National Bank of Greece", ticker:"ETE.AT", sector:"Banking", fmp:"" },
      { name:"Eurobank", ticker:"EUROB.AT", sector:"Banking", fmp:"" },
      { name:"Metlen Energy", ticker:"MYTIL.AT", sector:"Energy/Industry", fmp:"" },
    ],
    howToInvest: "No direct India fund for Greece. Use iShares MSCI Europe ETF route or PGIM India Global Equity Fund for European allocation.",
  },
};

async function fmpYtd(symbol) {
  if (!FMP_KEY || !symbol) return null;
  try {
    const arr = await httpJSON(
      `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP_KEY}`
    );
    const q = Array.isArray(arr) ? arr[0] : null;
    if (!q) return null;
    // FMP yearly change approximates YTD-ish momentum for the gauge
    return q.changesPercentage != null ? `${q.changesPercentage > 0 ? "+" : ""}${Number(q.changesPercentage).toFixed(1)}% (1D)` : null;
  } catch {
    return null;
  }
}

export async function fetchTopStocks() {
  const out = {};
  for (const c of COUNTRIES) {
    const def = STOCKS[c.id];
    const list = await Promise.all(
      def.list.map(async (s) => ({
        name: s.name,
        ticker: s.ticker,
        sector: s.sector,
        perf: (await fmpYtd(s.fmp)) || "curated leader",
      }))
    );
    out[c.id] = { stocks: list, howToInvest: def.howToInvest };
  }
  return stamp(
    out,
    FMP_KEY
      ? "Curated market leaders + FMP live performance"
      : "Curated validated market leaders (add FMP_KEY for live performance)",
    new Date().toISOString()
  );
}
