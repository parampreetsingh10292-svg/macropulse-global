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

// ─── Curated top-3 stocks: STOCKS[country][sector] = [[ticker,name,basePrice]×3] ──

const STOCKS = {
  usa: {
    tech:       [["AAPL","Apple",195],["MSFT","Microsoft",430],["NVDA","NVIDIA",880]],
    finance:    [["JPM","JPMorgan Chase",200],["BAC","Bank of America",38],["GS","Goldman Sachs",430]],
    industrial: [["CAT","Caterpillar",350],["GE","GE Aerospace",165],["HON","Honeywell",205]],
    health:     [["UNH","UnitedHealth",490],["LLY","Eli Lilly",780],["JNJ","Johnson & Johnson",155]],
    consumer:   [["AMZN","Amazon",185],["WMT","Walmart",60],["PG","Procter & Gamble",165]],
    energy:     [["XOM","Exxon Mobil",115],["CVX","Chevron",155],["COP","ConocoPhillips",115]],
    materials:  [["LIN","Linde",460],["FCX","Freeport-McMoRan",48],["NEM","Newmont",42]],
    realestate: [["PLD","Prologis",110],["AMT","American Tower",195],["EQIX","Equinix",780]],
  },
  india: {
    tech:       [["TCS","Tata Consultancy",3900],["INFY","Infosys",1650],["HCLTECH","HCL Technologies",1500]],
    finance:    [["HDFCBANK","HDFC Bank",1500],["ICICIBANK","ICICI Bank",1150],["SBIN","State Bank of India",820]],
    industrial: [["LT","Larsen & Toubro",3500],["SIEMENS","Siemens India",6800],["ABB","ABB India",7200]],
    health:     [["SUNPHARMA","Sun Pharma",1600],["CIPLA","Cipla",1450],["DRREDDY","Dr Reddy's",1250]],
    consumer:   [["HINDUNILVR","Hindustan Unilever",2350],["ITC","ITC",430],["NESTLEIND","Nestlé India",2500]],
    energy:     [["RELIANCE","Reliance Industries",2950],["ONGC","ONGC",270],["NTPC","NTPC",360]],
    materials:  [["TATASTEEL","Tata Steel",165],["HINDALCO","Hindalco",650],["JSWSTEEL","JSW Steel",920]],
    realestate: [["DLF","DLF",800],["GODREJPROP","Godrej Properties",2800],["OBEROIRLTY","Oberoi Realty",1750]],
  },
  taiwan: {
    tech:       [["2330","TSMC",980],["2454","MediaTek",1300],["2317","Hon Hai (Foxconn)",205]],
    finance:    [["2882","Cathay Financial",65],["2881","Fubon Financial",92],["2891","CTBC Financial",38]],
    industrial: [["2308","Delta Electronics",380],["1303","Nan Ya Plastics",62],["2603","Evergreen Marine",195]],
    health:     [["1795","PharmaEssentia",480],["4174","Bora Pharmaceuticals",290],["6446","PharmaEngine",95]],
    consumer:   [["2912","President Chain Store",280],["1216","Uni-President",75],["2207","Hotai Motor",620]],
    energy:     [["6505","Formosa Petrochemical",52],["2609","Yang Ming Marine",70],["1326","Formosa Chemicals",48]],
    materials:  [["1101","Taiwan Cement",35],["2002","China Steel",24],["1301","Formosa Plastics",75]],
    realestate: [["2542","Highwealth Construction",45],["2545","Huang Hsiang",28],["9945","Ruentex Development",55]],
  },
  vietnam: {
    tech:       [["FPT","FPT Corp",130000],["CMG","CMC Corp",60000],["ELC","Elcom",25000]],
    finance:    [["VCB","Vietcombank",90000],["BID","BIDV",48000],["CTG","VietinBank",35000]],
    industrial: [["GEX","Gelex",22000],["REE","REE Corp",65000],["VEA","Vietnam Engine",42000]],
    health:     [["DHG","DHG Pharma",110000],["IMP","Imexpharm",65000],["DBD","Binh Dinh Pharma",55000]],
    consumer:   [["VNM","Vinamilk",65000],["MSN","Masan Group",75000],["SAB","Sabeco",55000]],
    energy:     [["GAS","PetroVietnam Gas",78000],["PLX","Petrolimex",38000],["POW","PV Power",13000]],
    materials:  [["HPG","Hoa Phat Group",28000],["HSG","Hoa Sen Group",22000],["NKG","Nam Kim Steel",23000]],
    realestate: [["VHM","Vinhomes",42000],["VIC","Vingroup",45000],["NVL","Novaland",12000]],
  },
  neth: {
    tech:       [["ASML","ASML Holding",720],["ADYEN","Adyen",1400],["BESI","BE Semiconductor",130]],
    finance:    [["INGA","ING Group",16],["ABN","ABN AMRO",16],["AGN","Aegon",6]],
    industrial: [["PHIA","Philips",24],["WKL","Wolters Kluwer",155],["RAND","Randstad",45]],
    health:     [["ARGX","argenx",380],["GLPG","Galapagos",28],["PHARM","Pharming Group",1.3]],
    consumer:   [["AD","Ahold Delhaize",30],["HEIA","Heineken",85],["PRX","Prosus",38]],
    energy:     [["SBMO","SBM Offshore",16],["VPK","Vopak",42],["OCI","OCI",22]],
    materials:  [["AKZA","Akzo Nobel",58],["IMCD","IMCD",145],["AMG","AMG Critical Materials",18]],
    realestate: [["WHA","Wereldhave",15],["ECMPA","Eurocommercial",22],["NSI","NSI",20]],
  },
  denmark: {
    tech:       [["NETC","Netcompany",220],["NNIT","NNIT",110],["COLUM","Columbus",9]],
    finance:    [["DANSKE","Danske Bank",215],["JYSK","Jyske Bank",580],["SYDB","Sydbank",350]],
    industrial: [["DSV","DSV",1450],["MAERSK-B","A.P. Møller-Mærsk",12000],["FLS","FLSmidth",350]],
    health:     [["NOVO-B","Novo Nordisk",580],["GMAB","Genmab",1700],["COLO-B","Coloplast",900]],
    consumer:   [["CARL-B","Carlsberg",850],["ROYAL","Royal Unibrew",480],["PNDORA","Pandora",1050]],
    energy:     [["ORSTED","Ørsted",380],["VWS","Vestas Wind",130],["NKT","NKT",580]],
    materials:  [["ROCK-B","Rockwool",2400],["NSIS-B","Novonesis",430],["SCHO","Schouw & Co",580]],
    realestate: [["JEUDAN","Jeudan",230],["PARKEN","Parken Sport",130],["TORM-A","TORM",180]],
  },
  sweden: {
    tech:       [["ERIC-B","Ericsson",75],["HEXA-B","Hexagon",105],["EVO","Evolution",1200]],
    finance:    [["SEB-A","SEB",150],["SWED-A","Swedbank",220],["NDA-SE","Nordea",130]],
    industrial: [["ATCO-A","Atlas Copco",175],["VOLV-B","Volvo",280],["SAND","Sandvik",230]],
    health:     [["AZN","AstraZeneca",1400],["GETI-B","Getinge",200],["SOBI","Swedish Orphan Biovitrum",320]],
    consumer:   [["HM-B","H&M",145],["ESSITY-B","Essity",290],["ELUX-B","Electrolux",90]],
    energy:     [["NIBE","NIBE Industrier",55],["EOLU-B","Eolus Vind",70],["ARISE","Arise",35]],
    materials:  [["BOL","Boliden",320],["SSAB-A","SSAB",55],["SCA-B","SCA",145]],
    realestate: [["CAST","Castellum",130],["FABG","Fabege",85],["SBB-B","SBB",5]],
  },
  brazil: {
    tech:       [["TOTS3","Totvs",30],["LWSA3","Locaweb",6],["INTB3","Intelbras",22]],
    finance:    [["ITUB4","Itaú Unibanco",33],["BBDC4","Bradesco",14],["BBAS3","Banco do Brasil",27]],
    industrial: [["WEGE3","WEG",38],["EMBR3","Embraer",45],["RAIL3","Rumo",20]],
    health:     [["RDOR3","Rede D'Or",28],["HAPV3","Hapvida",4],["FLRY3","Fleury",16]],
    consumer:   [["ABEV3","Ambev",13],["LREN3","Lojas Renner",16],["MGLU3","Magazine Luiza",11]],
    energy:     [["PETR4","Petrobras",38],["PRIO3","PRIO",42],["EQTL3","Equatorial Energia",32]],
    materials:  [["VALE3","Vale",62],["GGBR4","Gerdau",18],["SUZB3","Suzano",58]],
    realestate: [["MULT3","Multiplan",24],["CYRE3","Cyrela",20],["IGTI11","Iguatemi",22]],
  },
  greece: {
    tech:       [["EPSIL","Epsilon Net",11.5],["PROF","Profile Systems",5.4],["BYTE","Byte Computer",3.0]],
    finance:    [["ETE","National Bank of Greece",8.2],["EUROB","Eurobank",2.2],["ALPHA","Alpha Services",1.85]],
    industrial: [["MYTIL","Metlen Energy & Metals",38],["ARAIG","Aegean Airlines",11],["ELLAKTOR","Ellaktor",1.8]],
    health:     [["IATR","Iatriko Athinon",1.1],["MEDIC","Medicon Hellas",2.4],["BIOK","Bioiatriki",0.55]],
    consumer:   [["OPAP","OPAP",16],["JUMBO","Jumbo",27],["SAR","Sarantis",11]],
    energy:     [["PPC","Public Power Corp",12],["ELPE","HelleniQ Energy",7.5],["MOH","Motor Oil Hellas",22]],
    materials:  [["TITC","Titan Cement",38],["VIO","Viohalco",6.2],["ELHA","Elvalhalcor",2.3]],
    realestate: [["LAMDA","Lamda Development",7.2],["TRASTOR","Trastor REIC",1.3],["PREMIA","Premia Properties",1.4]],
  },
  arg: {
    tech:       [["GLOB","Globant",250000],["MELI","MercadoLibre",2200000],["BYMA","BYMA",480]],
    finance:    [["GGAL","Grupo Fin. Galicia",5800],["BMA","Banco Macro",8500],["SUPV","Grupo Supervielle",1900]],
    industrial: [["MIRG","Mirgor",22000],["CAPX","Capex",4500],["FERR","Ferrum",1200]],
    health:     [["RICH","Lab. Richmond",2200],["INSU","Insuagro",1800],["BIOC","Bioceres",2000]],
    consumer:   [["CRES","Cresud",1500],["MORI","Molinos Río",600],["LEDE","Ledesma",2400]],
    energy:     [["YPFD","YPF",45000],["PAMP","Pampa Energía",3200],["CEPU","Central Puerto",1800]],
    materials:  [["TXAR","Ternium Argentina",1100],["ALUA","Aluar",950],["HARG","Holcim Argentina",2500]],
    realestate: [["IRSA","IRSA Inversiones",2300],["IRCP","IRSA Prop. Comerciales",1800],["SAMI","San Miguel",1300]],
  },
};

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
          Simulated live tick around reference prices · analysis is a rules-based illustration tied to the Investment Flows regime, not a research recommendation. <b>Not investment advice.</b>
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
    return (
      <div className="mp-pick-row" style={S.row(a.cv.color)} title={`${st.name} — ${a.cv.label}`} onClick={() => setModal({ cId: st.cId, sId: st.sId, ticker: st.ticker })}>
        <span style={S.dot(a.cv.color)} />
        <span style={S.tkr}>{st.ticker}</span>
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
          <span style={S.unitTag}>LIVE TICK · BUY / HOLD / SELL · click any stock</span>
        </h2>
        <div style={S.desc}>
          The three largest / most-liquid names in every sector across all 10 economies, mirroring the <b>Investment Flows</b> matrix.
          Each ticker carries a live indicative price and a colour-coded verdict. <b>Click any stock</b> for how to invest plus a Fundamental and Technical Buy / Hold / Sell summary.
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
        Simulated live tick · 3s refresh · reference prices · rules-based analysis · Not investment advice
      </div>

      {modal && <StockModal {...modal} prices={prices} onClose={() => setModal(null)} />}
    </div>
  );
}

export { MARKET, STOCKS, ANALYSIS, TOP_PICK, STOCK_LIST, fmtPrice, verdictOf };
