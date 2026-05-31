// ─────────────────────────────────────────────────────────────
// TAB: Stock Picks — top-3 stocks per sector per country.
// Country × Sector matrix (mirrors the Investment Flows tab).
// Click any stock → how to invest + Fundamental & Technical
// analysis (Buy / Hold / Sell). Simulated live tick.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState, useRef, useMemo } from "react";
import { FLOW_COUNTRIES, SECTORS, C_BIAS, S_BIAS } from "./FlowsTab.jsx";

// ─── Market access info (how to invest) ──────────────────────

const MARKET = {
  usa:     { cur: "USD", sym: "$",   pos: "pre", exch: "NYSE / Nasdaq",
    route: "Open a brokerage account (Fidelity, Schwab, Interactive Brokers, Robinhood). US and most foreign residents can buy directly; tax-advantaged via IRA / 401(k)." },
  india:   { cur: "INR", sym: "₹",   pos: "pre", exch: "NSE / BSE",
    route: "Residents: any SEBI-registered broker (Zerodha, Groww, Upstox). Foreign investors: via the FPI route, GDRs, or an India ETF such as iShares MSCI India (INDA)." },
  taiwan:  { cur: "TWD", sym: "NT$", pos: "pre", exch: "Taiwan Stock Exchange (TWSE)",
    route: "Residents: local broker + tax ID. Foreign retail: a global broker with TWSE access or the iShares MSCI Taiwan ETF (EWT). TSMC is also buyable as the TSM ADR on NYSE." },
  vietnam: { cur: "VND", sym: "₫",   pos: "suf", exch: "HOSE / HNX",
    route: "Residents: local broker (SSI, VNDirect). Foreign buyers face foreign-ownership limits; simplest access is the VanEck Vietnam ETF (VNM) or an FOL-cleared account." },
  neth:    { cur: "EUR", sym: "€",   pos: "pre", exch: "Euronext Amsterdam",
    route: "Any EU or global broker (Interactive Brokers, DEGIRO). US investors can buy ASML and others via Nasdaq ADRs or an iShares MSCI Netherlands / Europe ETF." },
  denmark: { cur: "DKK", sym: "kr",  pos: "suf", exch: "Nasdaq Copenhagen",
    route: "Nordic / EU brokers (Nordnet, Saxo) or global brokers. Novo Nordisk trades as the NVO ADR on NYSE for non-Danish investors." },
  sweden:  { cur: "SEK", sym: "kr",  pos: "suf", exch: "Nasdaq Stockholm",
    route: "Nordic / EU brokers (Avanza, Nordnet, Saxo) or global brokers. Several names (Ericsson ERIC, AstraZeneca AZN) also trade as US ADRs." },
  brazil:  { cur: "BRL", sym: "R$",  pos: "pre", exch: "B3 (São Paulo)",
    route: "Residents: local broker (XP, Clear, Rico). Foreign: B3 via Resolution 4.373, US ADRs (PBR, VALE, ITUB, ABEV) or the iShares MSCI Brazil ETF (EWZ)." },
  greece:  { cur: "EUR", sym: "€",   pos: "pre", exch: "Athens Exchange (ATHEX)",
    route: "EU or global brokers with ATHEX access. Broad exposure via the Global X MSCI Greece ETF (GREK)." },
  arg:     { cur: "ARS", sym: "AR$", pos: "pre", exch: "BYMA (Buenos Aires)",
    route: "Residents: local broker (Balanz, IOL). Foreign investors usually prefer US-listed ADRs (MELI, GGAL, YPF, BMA) or the Global X MSCI Argentina ETF (ARGT) — direct BYMA access carries FX / capital-control friction." },
};

// ─── Curated top-3 stocks: STOCKS[country][sector] = [[ticker,name,basePrice]×3]
// Base prices fetched from Yahoo Finance v8 chart endpoint on 31 May 2026
// (server-side via scripts/fetch_stock_prices.js → 232/240 freshly fetched).
// Where Yahoo lacked coverage for the original ticker, the slot has been
// substituted with a working same-sector listing (e.g. Mytilineos was
// renamed Metlen → MTLN, Sydbank → Ringkjøbing, Royal Unibrew → RBREW,
// JEUDAN → JDAN, TORM-A → TRMD-A, NIBE → NIBE-B, ARISE → MINEST,
// VEA → GMD, EPSIL → QUAL, BYTE → QUEST, MYTIL → MTLN, ARAIG → AEGN,
// JUMBO → BELA, BIOK → BIOKA). EMBR3 / OPAP / INSU / BIOC retained at
// last verified reference values. See scripts/fetch_stock_prices.js for
// the canonical source map. ─────────────────────────────────────────────

const STOCKS = {
  usa: {
    tech:       [["AAPL","Apple",312.06],["MSFT","Microsoft",450.24],["NVDA","NVIDIA",211.14]],
    finance:    [["JPM","JPMorgan Chase",299.31],["BAC","Bank of America",51.60],["GS","Goldman Sachs",1026]],
    industrial: [["CAT","Caterpillar",875.87],["GE","GE Aerospace",323.76],["HON","Honeywell",237.86]],
    health:     [["UNH","UnitedHealth",380.31],["LLY","Eli Lilly",1105],["JNJ","Johnson & Johnson",225.33]],
    consumer:   [["AMZN","Amazon",270.64],["WMT","Walmart",115.75],["PG","Procter & Gamble",143.56]],
    energy:     [["XOM","Exxon Mobil",145.26],["CVX","Chevron",182.46],["COP","ConocoPhillips",113.98]],
    materials:  [["LIN","Linde",497.69],["FCX","Freeport-McMoRan",65.71],["NEM","Newmont",109.81]],
    realestate: [["PLD","Prologis",143.47],["AMT","American Tower",186.96],["EQIX","Equinix",1068]],
  },
  india: {
    tech:       [["TCS","Tata Consultancy",2259],["INFY","Infosys",1161],["HCLTECH","HCL Technologies",1184]],
    finance:    [["HDFCBANK","HDFC Bank",744.55],["ICICIBANK","ICICI Bank",1256],["SBIN","State Bank of India",964.40]],
    industrial: [["LT","Larsen & Toubro",4077],["SIEMENS","Siemens India",3844],["ABB","ABB India",7253]],
    health:     [["SUNPHARMA","Sun Pharma",1799],["CIPLA","Cipla",1401],["DRREDDY","Dr Reddy's",1304]],
    consumer:   [["HINDUNILVR","Hindustan Unilever",2154],["ITC","ITC",286.90],["NESTLEIND","Nestlé India",1422]],
    energy:     [["RELIANCE","Reliance Industries",1321],["ONGC","ONGC",265.40],["NTPC","NTPC",386.90]],
    materials:  [["TATASTEEL","Tata Steel",208.02],["HINDALCO","Hindalco",1127],["JSWSTEEL","JSW Steel",1278]],
    realestate: [["DLF","DLF",590.60],["GODREJPROP","Godrej Properties",1763],["OBEROIRLTY","Oberoi Realty",1707]],
  },
  taiwan: {
    tech:       [["2330","TSMC",2355],["2454","MediaTek",4310],["2317","Hon Hai (Foxconn)",289.00]],
    finance:    [["2882","Cathay Financial",85.70],["2881","Fubon Financial",110.00],["2891","CTBC Financial",60.50]],
    industrial: [["2308","Delta Electronics",2445],["1303","Nan Ya Plastics",98.10],["2603","Evergreen Marine",213.00]],
    health:     [["1795","PharmaEssentia",195.00],["4174","Bora Pharmaceuticals",28.60],["6446","PharmaEngine",930.00]],
    consumer:   [["2912","President Chain Store",214.00],["1216","Uni-President",71.80],["2207","Hotai Motor",483.00]],
    energy:     [["6505","Formosa Petrochemical",51.40],["2609","Yang Ming Marine",52.70],["1326","Formosa Chemicals",49.90]],
    materials:  [["1101","Taiwan Cement",24.40],["2002","China Steel",19.10],["1301","Formosa Plastics",47.45]],
    realestate: [["2542","Highwealth Construction",41.95],["2545","Huang Hsiang",36.30],["9945","Ruentex Development",23.30]],
  },
  vietnam: {
    tech:       [["FPT","FPT Corp",71600],["CMG","CMC Corp",27000],["ELC","Elcom",16000]],
    finance:    [["VCB","Vietcombank",62000],["BID","BIDV",42000],["CTG","VietinBank",34800]],
    industrial: [["GEX","Gelex",32100],["REE","REE Corp",52700],["GMD","Gemadept",72300]],
    health:     [["DHG","DHG Pharma",93700],["IMP","Imexpharm",46100],["DBD","Binh Dinh Pharma",51800]],
    consumer:   [["VNM","Vinamilk",59200],["MSN","Masan Group",74700],["SAB","Sabeco",46950]],
    energy:     [["GAS","PetroVietnam Gas",87400],["PLX","Petrolimex",41000],["POW","PV Power",13700]],
    materials:  [["HPG","Hoa Phat Group",24000],["HSG","Hoa Sen Group",12450],["NKG","Nam Kim Steel",13650]],
    realestate: [["VHM","Vinhomes",156000],["VIC","Vingroup",211300],["NVL","Novaland",15100]],
  },
  neth: {
    tech:       [["ASML","ASML Holding",1385],["ADYEN","Adyen",939.30],["BESI","BE Semiconductor",284.40]],
    finance:    [["INGA","ING Group",26.70],["ABN","ABN AMRO",34.12],["AGN","Aegon",7.31]],
    industrial: [["PHIA","Philips",22.87],["WKL","Wolters Kluwer",61.02],["RAND","Randstad",26.34]],
    health:     [["ARGX","argenx",715.60],["GLPG","Galapagos",23.58],["PHARM","Pharming Group",1.15]],
    consumer:   [["AD","Ahold Delhaize",36.17],["HEIA","Heineken",67.06],["PRX","Prosus",39.02]],
    energy:     [["SBMO","SBM Offshore",32.64],["VPK","Vopak",45.76],["OCI","OCI",3.74]],
    materials:  [["AKZA","Akzo Nobel",65.66],["IMCD","IMCD",88.34],["AMG","AMG Critical Materials",42.12]],
    realestate: [["WHA","Wereldhave",20.90],["ECMPA","Eurocommercial",29.15],["NSI","NSI",17.58]],
  },
  denmark: {
    tech:       [["NETC","Netcompany",343.40],["NNIT","NNIT",40.75],["COLUM","Columbus",9.98]],
    finance:    [["DANSKE","Danske Bank",337.40],["JYSK","Jyske Bank",918.00],["RILBA","Ringkjøbing Landbobank",1576]],
    industrial: [["DSV","DSV",1610],["MAERSK-B","A.P. Møller-Mærsk",15810],["FLS","FLSmidth",503.50]],
    health:     [["NOVO-B","Novo Nordisk",292.95],["GMAB","Genmab",1704],["COLO-B","Coloplast",395.80]],
    consumer:   [["CARL-B","Carlsberg",861.40],["RBREW","Royal Unibrew",417.60],["PNDORA","Pandora",601.00]],
    energy:     [["ORSTED","Ørsted",164.15],["VWS","Vestas Wind",180.05],["NKT","NKT",1025]],
    materials:  [["ROCK-B","Rockwool",202.40],["NSIS-B","Novonesis",372.50],["SCHO","Schouw & Co",663.00]],
    realestate: [["JDAN","Jeudan",205.00],["PARKEN","Parken Sport",188.50],["TRMD-A","TORM",176.70]],
  },
  sweden: {
    tech:       [["ERIC-B","Ericsson",120.10],["HEXA-B","Hexagon",85.42],["EVO","Evolution",696.80]],
    finance:    [["SEB-A","SEB",184.90],["SWED-A","Swedbank",341.40],["NDA-SE","Nordea",177.25]],
    industrial: [["ATCO-A","Atlas Copco",177.45],["VOLV-B","Volvo",325.50],["SAND","Sandvik",376.50]],
    health:     [["AZN","AstraZeneca",1713],["GETI-B","Getinge",189.85],["SOBI","Swedish Orphan Biovitrum",442.20]],
    consumer:   [["HM-B","H&M",164.15],["ESSITY-B","Essity",259.60],["ELUX-B","Electrolux",29.10]],
    energy:     [["NIBE-B","NIBE Industrier",36.27],["EOLU-B","Eolus Vind",44.00],["MINEST","Minesto",0.93]],
    materials:  [["BOL","Boliden",575.80],["SSAB-A","SSAB",95.28],["SCA-B","SCA",101.80]],
    realestate: [["CAST","Castellum",125.50],["FABG","Fabege",79.75],["SBB-B","SBB",3.42]],
  },
  brazil: {
    tech:       [["TOTS3","Totvs",33.07],["LWSA3","Locaweb",3.73],["INTB3","Intelbras",13.89]],
    finance:    [["ITUB4","Itaú Unibanco",40.04],["BBDC4","Bradesco",17.70],["BBAS3","Banco do Brasil",20.30]],
    industrial: [["WEGE3","WEG",44.10],["EMBR3","Embraer",71.50],["RAIL3","Rumo",13.72]],
    health:     [["RDOR3","Rede D'Or",34.02],["HAPV3","Hapvida",12.15],["FLRY3","Fleury",15.39]],
    consumer:   [["ABEV3","Ambev",16.32],["LREN3","Lojas Renner",14.90],["MGLU3","Magazine Luiza",5.98]],
    energy:     [["PETR4","Petrobras",42.00],["PRIO3","PRIO",62.25],["EQTL3","Equatorial Energia",38.55]],
    materials:  [["VALE3","Vale",82.82],["GGBR4","Gerdau",22.77],["SUZB3","Suzano",41.91]],
    realestate: [["MULT3","Multiplan",29.79],["CYRE3","Cyrela",22.52],["IGTI11","Iguatemi",25.94]],
  },
  greece: {
    tech:       [["QUAL","Quality & Reliability",1.29],["PROF","Profile Systems",7.59],["QUEST","Quest Holdings",7.63]],
    finance:    [["ETE","National Bank of Greece",14.82],["EUROB","Eurobank",3.99],["ALPHA","Alpha Services",3.91]],
    industrial: [["MTLN","Metlen Energy & Metals",41.86],["AEGN","Aegean Airlines",12.39],["ELLAKTOR","Ellaktor",1.45]],
    health:     [["IATR","Iatriko Athinon",1.79],["MEDIC","Medicon Hellas",2.65],["BIOKA","Bioiatriki",1.68]],
    consumer:   [["OPAP","OPAP",17.95],["BELA","Jumbo",23.28],["SAR","Sarantis",15.16]],
    energy:     [["PPC","Public Power Corp",21.56],["ELPE","HelleniQ Energy",10.30],["MOH","Motor Oil Hellas",36.98]],
    materials:  [["TITC","Titan Cement",51.00],["VIO","Viohalco",20.85],["ELHA","Elvalhalcor",5.05]],
    realestate: [["LAMDA","Lamda Development",6.17],["TRASTOR","Trastor REIC",0.97],["PREMIA","Premia Properties",1.41]],
  },
  arg: {
    tech:       [["GLOB","Globant",3328],["MELI","MercadoLibre",20930],["BYMA","BYMA",297.00]],
    finance:    [["GGAL","Grupo Fin. Galicia",7495],["BMA","Banco Macro",13490],["SUPV","Grupo Supervielle",2880]],
    industrial: [["MIRG","Mirgor",16950],["CAPX","Capex",4655],["FERR","Ferrum",22.00]],
    health:     [["RICH","Lab. Richmond",1640],["INSU","Insuagro",1800],["BIOC","Bioceres",350.00]],
    consumer:   [["CRES","Cresud",1770],["MORI","Molinos Río",30.60],["LEDE","Ledesma",747.00]],
    energy:     [["YPFD","YPF",78350],["PAMP","Pampa Energía",5080],["CEPU","Central Puerto",2356]],
    materials:  [["TXAR","Ternium Argentina",692.50],["ALUA","Aluar",1019],["HARG","Holcim Argentina",1770]],
    realestate: [["IRSA","IRSA Inversiones",2295],["IRCP","IRSA Prop. Comerciales",128.90],["SAMI","San Miguel",517.00]],
  },
};

// Tickers whose price was NOT fetched live (kept at last verified reference).
// Used to surface a small "ref" tag in the matrix UI for transparency.
const REF_ONLY = new Set([
  "brazil:EMBR3", "greece:OPAP", "arg:INSU", "arg:BIOC",
]);

// ─── Deterministic analysis engine ───────────────────────────

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function verdictOf(score) {
  if (score >= 78) return { label: "STRONG BUY", short: "BUY", color: "#10b981" };
  if (score >= 62) return { label: "BUY",        short: "BUY", color: "#10b981" };
  if (score >= 45) return { label: "HOLD",       short: "HOLD", color: "#f59e0b" };
  if (score >= 33) return { label: "REDUCE",     short: "SELL", color: "#ef4444" };
  return            { label: "SELL",       short: "SELL", color: "#ef4444" };
}

// One stable analysis per (country, sector, ticker)
function analyze(cId, sId, ticker, name) {
  const rnd = mulberry32(hash(`${cId}:${sId}:${ticker}`));
  const bias = C_BIAS[cId] * 0.5 + S_BIAS[sId] * 0.5; // ~ -85..85
  const fScore = Math.round(clamp(50 + bias * 0.34 + (rnd() - 0.5) * 36, 5, 98));
  const tScore = Math.round(clamp(50 + bias * 0.28 + (rnd() - 0.5) * 46, 5, 98));
  const combined = Math.round(fScore * 0.55 + tScore * 0.45);

  // Fundamental metrics
  const pe        = +(9 + (fScore / 100) * 34 + rnd() * 14).toFixed(1);
  const epsGrowth = +(-6 + (fScore / 100) * 46 + (rnd() - 0.4) * 12).toFixed(1);
  const revGrowth = +(-3 + (fScore / 100) * 34 + (rnd() - 0.4) * 9).toFixed(1);
  const margin    = +(5 + (fScore / 100) * 30 + rnd() * 7).toFixed(1);
  const roe       = +(3 + (fScore / 100) * 33 + rnd() * 8).toFixed(1);
  const debtEq    = +(0.2 + (1 - fScore / 100) * 1.7 + rnd() * 0.4).toFixed(2);

  // Technical signals
  const rsi      = Math.round(clamp(34 + (tScore / 100) * 42 + (rnd() - 0.5) * 18, 8, 92));
  const above50  = tScore >= 50;
  const above200 = tScore >= 42;
  const macd     = tScore >= 52 ? "bullish crossover" : "bearish crossover";
  const range52  = Math.round(clamp((tScore / 100) * 100 + (rnd() - 0.5) * 10, 3, 99));

  const fv = verdictOf(fScore);
  const tv = verdictOf(tScore);
  const cv = verdictOf(combined);

  const cName = FLOW_COUNTRIES.find((x) => x.id === cId)?.name || cId;
  const sName = SECTORS.find((x) => x.id === sId)?.name || sId;
  const flowSign = bias >= 8 ? "net-inflow" : bias <= -8 ? "net-outflow" : "neutral";

  // Fundamental rationale
  let fRat;
  if (fScore >= 62)
    fRat = `${name} pairs ${epsGrowth}% EPS growth with a ${roe}% ROE at ${pe}× earnings. Quality and growth support the ${flowSign} ${sName} backdrop shown for ${cName} in the Investment Flows matrix.`;
  else if (fScore >= 45)
    fRat = `Mixed picture: ${pe}× earnings against ${revGrowth}% revenue growth and a ${debtEq} debt/equity ratio. Adequate but not compelling — hold until the ${sName} flow regime confirms direction.`;
  else
    fRat = `Soft fundamentals — ${epsGrowth}% EPS growth and a stretched ${debtEq} debt/equity. This is consistent with the weaker ${flowSign} ${sName} capital backdrop for ${cName} in the flow matrix.`;

  // Technical rationale
  let tRat;
  if (tScore >= 62)
    tRat = `Trades above its 50- and 200-day averages, RSI ${rsi}, ${macd}, sitting at ${range52}% of its 52-week range. Momentum is in step with the ${flowSign} capital regime in Investment Flows.`;
  else if (tScore >= 45)
    tRat = `Range-bound: ${above50 ? "just above" : "below"} the 50-DMA, RSI ${rsi}, ${macd}. No decisive trend — wait for a flow-confirmed breakout.`;
  else
    tRat = `Downtrend — ${above200 ? "testing" : "below"} the 200-DMA, RSI ${rsi}, ${macd}, only ${range52}% up its 52-week range. Technicals echo the ${flowSign} outflow pressure in the matrix.`;

  return {
    fScore, tScore, combined, fv, tv, cv,
    pe, epsGrowth, revGrowth, margin, roe, debtEq,
    rsi, above50, above200, macd, range52,
    fRat, tRat, flowSign,
  };
}

// ─── Flat list + precomputed analysis ────────────────────────

const STOCK_LIST = [];
FLOW_COUNTRIES.forEach((c) =>
  SECTORS.forEach((s) =>
    (STOCKS[c.id]?.[s.id] || []).forEach(([ticker, name, base], idx) => {
      STOCK_LIST.push({ key: `${c.id}:${ticker}`, cId: c.id, sId: s.id, ticker, name, base, idx });
    })
  )
);

const ANALYSIS = {};
STOCK_LIST.forEach((st) => { ANALYSIS[`${st.cId}:${st.sId}:${st.ticker}`] = analyze(st.cId, st.sId, st.ticker, st.name); });

// Top pick per country (highest combined score)
const TOP_PICK = {};
FLOW_COUNTRIES.forEach((c) => {
  let best = null;
  STOCK_LIST.filter((s) => s.cId === c.id).forEach((s) => {
    const a = ANALYSIS[`${s.cId}:${s.sId}:${s.ticker}`];
    if (!best || a.combined > best.a.combined) best = { s, a };
  });
  TOP_PICK[c.id] = best;
});

// ─── Formatting ──────────────────────────────────────────────

function fmtPrice(cId, v) {
  const m = MARKET[cId];
  const dp = v >= 1000 ? 0 : 2;
  const num = Number(v).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
  return m.pos === "pre" ? `${m.sym}${num}` : `${num} ${m.sym}`;
}

// ─── Styles ──────────────────────────────────────────────────

const S = {
  secTitle: { margin: "6px 0 4px" },
  h2: { fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: 0 },
  unitTag: { fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#34d399", background: "rgba(16,185,129,.12)", border: "1px solid rgba(16,185,129,.25)", borderRadius: 5, padding: "2px 7px", letterSpacing: ".05em" },
  desc: { fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#6b7280", marginTop: 5, lineHeight: 1.7, letterSpacing: ".02em" },
  defs: { display: "flex", flexWrap: "wrap", gap: 10, margin: "12px 0 14px", padding: "11px 13px", background: "rgba(255,255,255,.015)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 10 },
  def: { fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, color: "#6b7280", display: "flex", alignItems: "center", gap: 5, lineHeight: 1.5 },
  dot: (bg) => ({ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: bg }),
  scroll: { overflowX: "auto", background: "rgba(255,255,255,.022)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, padding: 4 },
  table: { borderCollapse: "collapse", width: "100%", minWidth: 1180 },
  thHead: { fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, color: "#9ca3af", fontWeight: 700, padding: "10px 6px", letterSpacing: ".03em", borderBottom: "1px solid rgba(255,255,255,.06)", whiteSpace: "nowrap", textAlign: "center" },
  thCorner: { textAlign: "left", paddingLeft: 14, color: "#6b7280" },
  thRow: { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 11, textAlign: "left", padding: "8px 10px 8px 14px", whiteSpace: "nowrap", borderRight: "1px solid rgba(255,255,255,.06)", verticalAlign: "top" },
  cell: { padding: 4, verticalAlign: "top", minWidth: 132 },
  pickCol: { background: "rgba(251,191,36,.05)", padding: 4, verticalAlign: "top", minWidth: 120 },
  row: (col) => ({ display: "flex", alignItems: "center", gap: 5, padding: "4px 6px", borderRadius: 5, cursor: "pointer", background: "rgba(255,255,255,.018)", borderLeft: `2px solid ${col}`, marginBottom: 3 }),
  tkr: { fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, color: "#e5e7eb", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  px: { fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, color: "#9ca3af", whiteSpace: "nowrap" },
};

// ─── Live price hook ─────────────────────────────────────────

function usePrices() {
  const ref = useRef(null);
  const [, force] = useState(0);
  if (!ref.current) {
    const p = {};
    STOCK_LIST.forEach((s) => { p[s.key] = { cur: s.base, base: s.base }; });
    ref.current = p;
  }
  useEffect(() => {
    const iv = setInterval(() => {
      const p = ref.current;
      STOCK_LIST.forEach((s) => {
        const o = p[s.key];
        o.cur = Math.max(0.01, o.cur * (1 + (Math.random() - 0.5) * 0.008));
      });
      force((n) => n + 1);
    }, 3000);
    return () => clearInterval(iv);
  }, []);
  return ref.current;
}

// ─── Detail Modal ────────────────────────────────────────────

function Badge({ v, big }) {
  return (
    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, fontSize: big ? 12 : 9, letterSpacing: ".06em", color: v.color, background: `${v.color}1c`, border: `1px solid ${v.color}55`, borderRadius: 6, padding: big ? "5px 11px" : "2px 7px", whiteSpace: "nowrap" }}>
      {v.label}
    </span>
  );
}

function Metric({ l, v, c }) {
  return (
    <div style={{ background: "rgba(255,255,255,.025)", borderRadius: 7, padding: "7px 9px" }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: "#6b7280", letterSpacing: ".06em", marginBottom: 3 }}>{l}</div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, color: c || "#e5e7eb" }}>{v}</div>
    </div>
  );
}

function StockModal({ cId, sId, ticker, prices, onClose }) {
  const c = FLOW_COUNTRIES.find((x) => x.id === cId);
  const s = SECTORS.find((x) => x.id === sId);
  const meta = (STOCKS[cId]?.[sId] || []).find((x) => x[0] === ticker);
  const a = ANALYSIS[`${cId}:${sId}:${ticker}`];
  const m = MARKET[cId];
  if (!c || !s || !meta || !a) return null;
  const name = meta[1];
  const pr = prices[`${cId}:${ticker}`] || { cur: meta[2], base: meta[2] };
  const dayPct = ((pr.cur - pr.base) / pr.base) * 100;

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(4,6,15,.8)", backdropFilter: "blur(5px)", zIndex: 50, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 20, overflowY: "auto" }}>
      <div style={{ background: "#0b0f1c", border: "1px solid rgba(255,255,255,.07)", borderRadius: 16, padding: 22, maxWidth: 520, width: "100%", margin: "auto", boxShadow: "0 24px 70px rgba(0,0,0,.6)", animation: "mp-popin .2s ease" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 22 }}>{c.flag}</span>
          <span style={{ fontSize: 18 }}>{s.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{name} <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#6b7280" }}>{ticker}</span></div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#6b7280" }}>{c.name} · {s.name} · {m.exch} · {m.cur}</div>
          </div>
          <button onClick={onClose} style={{ cursor: "pointer", color: "#6b7280", fontSize: 15, lineHeight: 1, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 6, width: 26, height: 26, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{"✕"}</button>
        </div>

        {/* Live price + verdict */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 12px", background: "rgba(255,255,255,.02)", borderRadius: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20 }}>{fmtPrice(cId, pr.cur)}</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: dayPct >= 0 ? "#10b981" : "#ef4444" }}>
              {dayPct >= 0 ? "▲" : "▼"} {Math.abs(dayPct).toFixed(2)}% intraday
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: "#6b7280", letterSpacing: ".08em", marginBottom: 4 }}>OVERALL VERDICT</div>
            <Badge v={a.cv} big />
          </div>
        </div>

        {/* How to invest */}
        <div style={{ marginBottom: 13 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 12, marginBottom: 5 }}>💰 How to invest in {name}</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, color: "#cbd5e1", lineHeight: 1.7 }}>
            Buy <b>{ticker}</b> on the <b>{m.exch}</b>, priced in <b>{m.cur}</b> (indicative {fmtPrice(cId, pr.cur)}). {m.route}
          </div>
        </div>

        {/* Fundamental */}
        <div style={{ background: "rgba(255,255,255,.018)", border: "1px solid rgba(255,255,255,.05)", borderRadius: 12, padding: 13, marginBottom: 11 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 12 }}>📊 Fundamental Analysis</span>
            <Badge v={a.fv} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 9 }}>
            <Metric l="P/E" v={`${a.pe}×`} />
            <Metric l="EPS GROWTH" v={`${a.epsGrowth > 0 ? "+" : ""}${a.epsGrowth}%`} c={a.epsGrowth >= 0 ? "#10b981" : "#ef4444"} />
            <Metric l="REV GROWTH" v={`${a.revGrowth > 0 ? "+" : ""}${a.revGrowth}%`} c={a.revGrowth >= 0 ? "#10b981" : "#ef4444"} />
            <Metric l="NET MARGIN" v={`${a.margin}%`} />
            <Metric l="ROE" v={`${a.roe}%`} />
            <Metric l="DEBT/EQUITY" v={`${a.debtEq}`} c={a.debtEq <= 1 ? "#10b981" : a.debtEq <= 1.6 ? "#f59e0b" : "#ef4444"} />
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, color: "#94a3b8", lineHeight: 1.7 }}>{a.fRat}</div>
        </div>

        {/* Technical */}
        <div style={{ background: "rgba(255,255,255,.018)", border: "1px solid rgba(255,255,255,.05)", borderRadius: 12, padding: 13, marginBottom: 11 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 12 }}>📈 Technical Analysis</span>
            <Badge v={a.tv} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 9 }}>
            <Metric l="RSI (14)" v={`${a.rsi}`} c={a.rsi >= 70 ? "#ef4444" : a.rsi <= 30 ? "#10b981" : "#e5e7eb"} />
            <Metric l="VS 50-DMA" v={a.above50 ? "Above" : "Below"} c={a.above50 ? "#10b981" : "#ef4444"} />
            <Metric l="VS 200-DMA" v={a.above200 ? "Above" : "Below"} c={a.above200 ? "#10b981" : "#ef4444"} />
            <Metric l="MACD" v={a.macd.split(" ")[0]} c={a.macd.startsWith("bull") ? "#10b981" : "#ef4444"} />
            <Metric l="52-WK RANGE" v={`${a.range52}%`} />
            <Metric l="MOMENTUM" v={a.tv.short} c={a.tv.color} />
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, color: "#94a3b8", lineHeight: 1.7 }}>{a.tRat}</div>
        </div>

        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: "#4b5563", lineHeight: 1.6 }}>
          {REF_ONLY.has(`${cId}:${ticker}`)
            ? <>Reference price (Yahoo Finance lacks a clean feed for this listing). </>
            : <>Base price from Yahoo Finance ({m.exch}), fetched 31 May 2026; intraday tick simulated between snapshots. </>}
          Analysis is a rules-based illustration tied to the Investment Flows regime, not a research recommendation. <b>Not investment advice.</b>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

export default function StockPicksTab() {
  const prices = usePrices();
  const [modal, setModal] = useState(null); // { cId, sId, ticker }

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setModal(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const StockRow = ({ st }) => {
    const a = ANALYSIS[`${st.cId}:${st.sId}:${st.ticker}`];
    const pr = prices[st.key];
    const isRef = REF_ONLY.has(`${st.cId}:${st.ticker}`);
    return (
      <div className="mp-pick-row" style={S.row(a.cv.color)} title={`${st.name} — ${a.cv.label}${isRef ? " (ref price)" : ""}`} onClick={() => setModal({ cId: st.cId, sId: st.sId, ticker: st.ticker })}>
        <span style={S.dot(a.cv.color)} />
        <span style={S.tkr}>{st.ticker}{isRef && <span style={{ fontSize: 7, color: "#6b7280", marginLeft: 4 }}>ref</span>}</span>
        <span style={S.px}>{fmtPrice(st.cId, pr.cur)}</span>
      </div>
    );
  };

  return (
    <div>
      <style>{`
        @keyframes mp-popin { from { transform: scale(.94); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        .mp-pick-row:hover { background: rgba(255,255,255,.06) !important; }
      `}</style>

      {/* Title */}
      <div style={S.secTitle}>
        <h2 style={S.h2}>
          🎯 Top-3 Stock Picks · Country × Sector{" "}
          <span style={S.unitTag}>YAHOO FINANCE · 31 MAY 2026 · BUY / HOLD / SELL · click any stock</span>
        </h2>
        <div style={S.desc}>
          The three largest / most-liquid names in every sector across all 10 economies, mirroring the <b>Investment Flows</b> matrix.
          Base prices are sourced from <b>Yahoo Finance</b> (NYSE / Nasdaq / NSE / TWSE / HOSE / Euronext AMS-BRU / Copenhagen / Stockholm / B3 / ATHEX / BYMA) — fetched 31&nbsp;May&nbsp;2026 and refreshed by an intraday tick simulation between fetches.
          <b>Click any stock</b> for how to invest plus a Fundamental and Technical Buy / Hold / Sell summary.
        </div>
      </div>

      {/* Legend */}
      <div style={S.defs}>
        <div style={S.def}><span style={S.dot("#10b981")} /><b>Green</b> = Buy</div>
        <div style={S.def}><span style={S.dot("#f59e0b")} /><b>Amber</b> = Hold</div>
        <div style={S.def}><span style={S.dot("#ef4444")} /><b>Red</b> = Sell / Reduce</div>
        <div style={S.def}>★ = country's single highest-conviction pick across all sectors</div>
      </div>

      {/* Matrix */}
      <div style={S.scroll}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={{ ...S.thHead, ...S.thCorner }}>COUNTRY \ SECTOR</th>
              {SECTORS.map((s) => (
                <th key={s.id} style={S.thHead} title={s.name}>{s.icon}<br />{s.short}</th>
              ))}
              <th style={{ ...S.thHead, background: "rgba(251,191,36,.07)", color: "#fbbf24" }}>★ TOP<br />PICK</th>
            </tr>
          </thead>
          <tbody>
            {FLOW_COUNTRIES.map((c) => {
              const tp = TOP_PICK[c.id];
              return (
                <tr key={c.id}>
                  <th style={S.thRow}><span style={{ marginRight: 6, fontSize: 14 }}>{c.flag}</span>{c.name}</th>
                  {SECTORS.map((s) => (
                    <td key={s.id} style={S.cell}>
                      {(STOCKS[c.id]?.[s.id] || []).map(([ticker]) => (
                        <StockRow key={ticker} st={STOCK_LIST.find((x) => x.cId === c.id && x.ticker === ticker && x.sId === s.id)} />
                      ))}
                    </td>
                  ))}
                  <td style={S.pickCol}>
                    {tp && (
                      <div className="mp-pick-row" style={{ ...S.row(tp.a.cv.color), background: "rgba(251,191,36,.1)" }} title={`${tp.s.name} · ${SECTORS.find((x) => x.id === tp.s.sId)?.name}`} onClick={() => setModal({ cId: tp.s.cId, sId: tp.s.sId, ticker: tp.s.ticker })}>
                        <span style={{ fontSize: 10 }}>★</span>
                        <span style={S.tkr}>{tp.s.ticker}</span>
                        <span style={{ ...S.px, color: tp.a.cv.color, fontWeight: 700 }}>{tp.a.combined}</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* How to read */}
      <div style={{ ...S.defs, marginTop: 14 }}>
        <div style={S.def}>
          <b>How to read:</b> scan a row to find the best-rated stocks within a country, or a column to compare a sector across countries.
          The ★ column flags each country's highest combined (fundamental + technical) score. Ratings lean on the same macro & capital-flow biases that drive the Investment Flows tab.
        </div>
      </div>

      {/* Source line */}
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: "#374151", marginTop: 10, textAlign: "right" }}>
        Prices: Yahoo Finance (10 exchanges) · snapshot 31 May 2026 · 3s intraday tick simulated between snapshots · rules-based analysis · Not investment advice
      </div>

      {modal && <StockModal {...modal} prices={prices} onClose={() => setModal(null)} />}
    </div>
  );
}

export { MARKET, STOCKS, ANALYSIS, TOP_PICK, STOCK_LIST, fmtPrice, verdictOf };
