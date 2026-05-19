// ─────────────────────────────────────────────────────────────
// Shared reference data for the top 10 economies.
// ISO codes drive World Bank / FX / news queries.
// ─────────────────────────────────────────────────────────────

export const COUNTRIES = [
  {
    id: "usa", name: "USA", iso2: "US", iso3: "USA", flag: "🇺🇸",
    currency: "USD", indexName: "S&P 500",
    // Twelve Data / FMP symbols
    indexSymbol: "SPX", indexSymbolFMP: "^GSPC",
    centralBank: "Federal Reserve", color: "#3b82f6",
    tz: "America/New_York", marketHours: [9.5, 16],
  },
  {
    id: "arg", name: "Argentina", iso2: "AR", iso3: "ARG", flag: "🇦🇷",
    currency: "ARS", indexName: "S&P MERVAL",
    indexSymbol: "MERV", indexSymbolFMP: "^MERV",
    centralBank: "BCRA", color: "#f59e0b",
    tz: "America/Argentina/Buenos_Aires", marketHours: [11, 17],
  },
  {
    id: "taiwan", name: "Taiwan", iso2: "TW", iso3: "TWN", flag: "🇹🇼",
    currency: "TWD", indexName: "TAIEX",
    indexSymbol: "TWII", indexSymbolFMP: "^TWII",
    centralBank: "CBC Taiwan", color: "#10b981",
    tz: "Asia/Taipei", marketHours: [9, 13.5],
  },
  {
    id: "india", name: "India", iso2: "IN", iso3: "IND", flag: "🇮🇳",
    currency: "INR", indexName: "NIFTY 50",
    indexSymbol: "NIFTY 50", indexSymbolFMP: "^NSEI",
    centralBank: "RBI", color: "#f97316",
    tz: "Asia/Kolkata", marketHours: [9.25, 15.5],
  },
  {
    id: "vietnam", name: "Vietnam", iso2: "VN", iso3: "VNM", flag: "🇻🇳",
    currency: "VND", indexName: "VN-Index",
    indexSymbol: "VNINDEX", indexSymbolFMP: "^VNINDEX",
    centralBank: "SBV", color: "#8b5cf6",
    tz: "Asia/Ho_Chi_Minh", marketHours: [9, 15],
  },
  {
    id: "denmark", name: "Denmark", iso2: "DK", iso3: "DNK", flag: "🇩🇰",
    currency: "DKK", indexName: "OMX Copenhagen 25",
    indexSymbol: "OMXC25", indexSymbolFMP: "^OMXC25",
    centralBank: "Danmarks Nationalbank", color: "#ec4899",
    tz: "Europe/Copenhagen", marketHours: [9, 17],
  },
  {
    id: "brazil", name: "Brazil", iso2: "BR", iso3: "BRA", flag: "🇧🇷",
    currency: "BRL", indexName: "Bovespa",
    indexSymbol: "IBOV", indexSymbolFMP: "^BVSP",
    centralBank: "Banco Central do Brasil", color: "#14b8a6",
    tz: "America/Sao_Paulo", marketHours: [10, 17],
  },
  {
    id: "neth", name: "Netherlands", iso2: "NL", iso3: "NLD", flag: "🇳🇱",
    currency: "EUR", indexName: "AEX",
    indexSymbol: "AEX", indexSymbolFMP: "^AEX",
    centralBank: "ECB", color: "#a78bfa",
    tz: "Europe/Amsterdam", marketHours: [9, 17.5],
  },
  {
    id: "sweden", name: "Sweden", iso2: "SE", iso3: "SWE", flag: "🇸🇪",
    currency: "SEK", indexName: "OMX Stockholm 30",
    indexSymbol: "OMXS30", indexSymbolFMP: "^OMX",
    centralBank: "Riksbank", color: "#fb923c",
    tz: "Europe/Stockholm", marketHours: [9, 17.5],
  },
  {
    id: "greece", name: "Greece", iso2: "GR", iso3: "GRC", flag: "🇬🇷",
    currency: "EUR", indexName: "Athens General",
    indexSymbol: "ATG", indexSymbolFMP: "^ATG",
    centralBank: "ECB / Bank of Greece", color: "#34d399",
    tz: "Europe/Athens", marketHours: [10, 17],
  },
];

export const byId = Object.fromEntries(COUNTRIES.map((c) => [c.id, c]));

// World Bank indicator codes
export const WB_INDICATORS = {
  gdp: "NY.GDP.MKTP.KD.ZG",          // GDP growth (annual %)
  inflation: "FP.CPI.TOTL.ZG",       // Inflation, consumer prices (annual %)
  unemployment: "SL.UEM.TOTL.ZS",    // Unemployment, total (% of labor force)
  debtToGdp: "GC.DOD.TOTL.GD.ZS",    // Central govt debt, total (% of GDP)
};

// Government / central-bank macro TARGETS (curated, validated as of 2026).
// Sourced from official budget docs, central bank mandates & IMF Article IV.
export const MACRO_TARGETS = {
  usa:     { gdp: 2.5, inflation: 2.0, bonds: 4.0,  unemployment: 4.0, fiscalDeficit: 5.0,  debtToGdp: 100 },
  arg:     { gdp: 4.0, inflation: 50,  bonds: 8.0,  unemployment: 7.0, fiscalDeficit: 0.0,  debtToGdp: 80  },
  taiwan:  { gdp: 3.5, inflation: 2.0, bonds: 1.75, unemployment: 3.5, fiscalDeficit: 2.0,  debtToGdp: 30  },
  india:   { gdp: 7.0, inflation: 4.0, bonds: 6.5,  unemployment: 7.0, fiscalDeficit: 4.5,  debtToGdp: 80  },
  vietnam: { gdp: 6.5, inflation: 4.5, bonds: 3.0,  unemployment: 3.0, fiscalDeficit: 4.0,  debtToGdp: 60  },
  denmark: { gdp: 2.0, inflation: 2.0, bonds: 2.5,  unemployment: 5.5, fiscalDeficit: 2.0,  debtToGdp: 35  },
  brazil:  { gdp: 2.5, inflation: 3.0, bonds: 10.5, unemployment: 8.0, fiscalDeficit: 4.0,  debtToGdp: 80  },
  neth:    { gdp: 2.0, inflation: 2.0, bonds: 2.5,  unemployment: 4.5, fiscalDeficit: 3.0,  debtToGdp: 60  },
  sweden:  { gdp: 2.0, inflation: 2.0, bonds: 2.25, unemployment: 7.5, fiscalDeficit: 2.0,  debtToGdp: 35  },
  greece:  { gdp: 2.5, inflation: 2.0, bonds: 3.5,  unemployment: 9.0, fiscalDeficit: 2.0,  debtToGdp: 140 },
};

// Higher-is-better direction for scoring each parameter
export const PARAM_DIRECTION = {
  gdp: "higher",
  inflation: "lower",
  bonds: "neutral",
  unemployment: "lower",
  fiscalDeficit: "lower",
  debtToGdp: "lower",
};
