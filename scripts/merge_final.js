const fs = require("fs");
const prices = require("./prices_out.json");

// Display names (must match StockPicksTab.jsx)
const NAMES = {
  usa: { tech:{AAPL:"Apple",MSFT:"Microsoft",NVDA:"NVIDIA"}, finance:{JPM:"JPMorgan Chase",BAC:"Bank of America",GS:"Goldman Sachs"}, industrial:{CAT:"Caterpillar",GE:"GE Aerospace",HON:"Honeywell"}, health:{UNH:"UnitedHealth",LLY:"Eli Lilly",JNJ:"Johnson & Johnson"}, consumer:{AMZN:"Amazon",WMT:"Walmart",PG:"Procter & Gamble"}, energy:{XOM:"Exxon Mobil",CVX:"Chevron",COP:"ConocoPhillips"}, materials:{LIN:"Linde",FCX:"Freeport-McMoRan",NEM:"Newmont"}, realestate:{PLD:"Prologis",AMT:"American Tower",EQIX:"Equinix"} },
  india: { tech:{TCS:"Tata Consultancy",INFY:"Infosys",HCLTECH:"HCL Technologies"}, finance:{HDFCBANK:"HDFC Bank",ICICIBANK:"ICICI Bank",SBIN:"State Bank of India"}, industrial:{LT:"Larsen & Toubro",SIEMENS:"Siemens India",ABB:"ABB India"}, health:{SUNPHARMA:"Sun Pharma",CIPLA:"Cipla",DRREDDY:"Dr Reddy's"}, consumer:{HINDUNILVR:"Hindustan Unilever",ITC:"ITC",NESTLEIND:"Nestlé India"}, energy:{RELIANCE:"Reliance Industries",ONGC:"ONGC",NTPC:"NTPC"}, materials:{TATASTEEL:"Tata Steel",HINDALCO:"Hindalco",JSWSTEEL:"JSW Steel"}, realestate:{DLF:"DLF",GODREJPROP:"Godrej Properties",OBEROIRLTY:"Oberoi Realty"} },
  taiwan: { tech:{2330:"TSMC",2454:"MediaTek",2317:"Hon Hai (Foxconn)"}, finance:{2882:"Cathay Financial",2881:"Fubon Financial",2891:"CTBC Financial"}, industrial:{2308:"Delta Electronics",1303:"Nan Ya Plastics",2603:"Evergreen Marine"}, health:{1795:"PharmaEssentia",4174:"Bora Pharmaceuticals",6446:"PharmaEngine"}, consumer:{2912:"President Chain Store",1216:"Uni-President",2207:"Hotai Motor"}, energy:{6505:"Formosa Petrochemical",2609:"Yang Ming Marine",1326:"Formosa Chemicals"}, materials:{1101:"Taiwan Cement",2002:"China Steel",1301:"Formosa Plastics"}, realestate:{2542:"Highwealth Construction",2545:"Huang Hsiang",9945:"Ruentex Development"} },
  vietnam: { tech:{FPT:"FPT Corp",CMG:"CMC Corp",ELC:"Elcom"}, finance:{VCB:"Vietcombank",BID:"BIDV",CTG:"VietinBank"}, industrial:{GEX:"Gelex",REE:"REE Corp",GMD:"Gemadept"}, health:{DHG:"DHG Pharma",IMP:"Imexpharm",DBD:"Binh Dinh Pharma"}, consumer:{VNM:"Vinamilk",MSN:"Masan Group",SAB:"Sabeco"}, energy:{GAS:"PetroVietnam Gas",PLX:"Petrolimex",POW:"PV Power"}, materials:{HPG:"Hoa Phat Group",HSG:"Hoa Sen Group",NKG:"Nam Kim Steel"}, realestate:{VHM:"Vinhomes",VIC:"Vingroup",NVL:"Novaland"} },
  neth: { tech:{ASML:"ASML Holding",ADYEN:"Adyen",BESI:"BE Semiconductor"}, finance:{INGA:"ING Group",ABN:"ABN AMRO",AGN:"Aegon"}, industrial:{PHIA:"Philips",WKL:"Wolters Kluwer",RAND:"Randstad"}, health:{ARGX:"argenx",GLPG:"Galapagos",PHARM:"Pharming Group"}, consumer:{AD:"Ahold Delhaize",HEIA:"Heineken",PRX:"Prosus"}, energy:{SBMO:"SBM Offshore",VPK:"Vopak",OCI:"OCI"}, materials:{AKZA:"Akzo Nobel",IMCD:"IMCD",AMG:"AMG Critical Materials"}, realestate:{WHA:"Wereldhave",ECMPA:"Eurocommercial",NSI:"NSI"} },
  denmark: { tech:{NETC:"Netcompany",NNIT:"NNIT",COLUM:"Columbus"}, finance:{DANSKE:"Danske Bank",JYSK:"Jyske Bank",RILBA:"Ringkjøbing Landbobank"}, industrial:{DSV:"DSV","MAERSK-B":"A.P. Møller-Mærsk",FLS:"FLSmidth"}, health:{"NOVO-B":"Novo Nordisk",GMAB:"Genmab","COLO-B":"Coloplast"}, consumer:{"CARL-B":"Carlsberg",RBREW:"Royal Unibrew",PNDORA:"Pandora"}, energy:{ORSTED:"Ørsted",VWS:"Vestas Wind",NKT:"NKT"}, materials:{"ROCK-B":"Rockwool","NSIS-B":"Novonesis",SCHO:"Schouw & Co"}, realestate:{JDAN:"Jeudan",PARKEN:"Parken Sport","TRMD-A":"TORM"} },
  sweden: { tech:{"ERIC-B":"Ericsson","HEXA-B":"Hexagon",EVO:"Evolution"}, finance:{"SEB-A":"SEB","SWED-A":"Swedbank","NDA-SE":"Nordea"}, industrial:{"ATCO-A":"Atlas Copco","VOLV-B":"Volvo",SAND:"Sandvik"}, health:{AZN:"AstraZeneca","GETI-B":"Getinge",SOBI:"Swedish Orphan Biovitrum"}, consumer:{"HM-B":"H&M","ESSITY-B":"Essity","ELUX-B":"Electrolux"}, energy:{"NIBE-B":"NIBE Industrier","EOLU-B":"Eolus Vind",MINEST:"Minesto"}, materials:{BOL:"Boliden","SSAB-A":"SSAB","SCA-B":"SCA"}, realestate:{CAST:"Castellum",FABG:"Fabege","SBB-B":"SBB"} },
  brazil: { tech:{TOTS3:"Totvs",LWSA3:"Locaweb",INTB3:"Intelbras"}, finance:{ITUB4:"Itaú Unibanco",BBDC4:"Bradesco",BBAS3:"Banco do Brasil"}, industrial:{WEGE3:"WEG",EMBR3:"Embraer",RAIL3:"Rumo"}, health:{RDOR3:"Rede D'Or",HAPV3:"Hapvida",FLRY3:"Fleury"}, consumer:{ABEV3:"Ambev",LREN3:"Lojas Renner",MGLU3:"Magazine Luiza"}, energy:{PETR4:"Petrobras",PRIO3:"PRIO",EQTL3:"Equatorial Energia"}, materials:{VALE3:"Vale",GGBR4:"Gerdau",SUZB3:"Suzano"}, realestate:{MULT3:"Multiplan",CYRE3:"Cyrela",IGTI11:"Iguatemi"} },
  greece: { tech:{QUAL:"Quality & Reliability",PROF:"Profile Systems",QUEST:"Quest Holdings"}, finance:{ETE:"National Bank of Greece",EUROB:"Eurobank",ALPHA:"Alpha Services"}, industrial:{MTLN:"Metlen Energy & Metals",AEGN:"Aegean Airlines",ELLAKTOR:"Ellaktor"}, health:{IATR:"Iatriko Athinon",MEDIC:"Medicon Hellas",BIOKA:"Bioiatriki"}, consumer:{OPAP:"OPAP",BELA:"Jumbo",SAR:"Sarantis"}, energy:{PPC:"Public Power Corp",ELPE:"HelleniQ Energy",MOH:"Motor Oil Hellas"}, materials:{TITC:"Titan Cement",VIO:"Viohalco",ELHA:"Elvalhalcor"}, realestate:{LAMDA:"Lamda Development",TRASTOR:"Trastor REIC",PREMIA:"Premia Properties"} },
  arg: { tech:{GLOB:"Globant",MELI:"MercadoLibre",BYMA:"BYMA"}, finance:{GGAL:"Grupo Fin. Galicia",BMA:"Banco Macro",SUPV:"Grupo Supervielle"}, industrial:{MIRG:"Mirgor",CAPX:"Capex",FERR:"Ferrum"}, health:{RICH:"Lab. Richmond",INSU:"Insuagro",BIOC:"Bioceres"}, consumer:{CRES:"Cresud",MORI:"Molinos Río",LEDE:"Ledesma"}, energy:{YPFD:"YPF",PAMP:"Pampa Energía",CEPU:"Central Puerto"}, materials:{TXAR:"Ternium Argentina",ALUA:"Aluar",HARG:"Holcim Argentina"}, realestate:{IRSA:"IRSA Inversiones",IRCP:"IRSA Prop. Comerciales",SAMI:"San Miguel"} },
};

// Manual price merges from second-round substitution and fallback refs (last known good ref).
const MANUAL = {
  "vietnam:industrial:GMD": 72300,
  "denmark:finance:RILBA": 1576,
  "denmark:consumer:RBREW": 417.6,
  "denmark:realestate:JDAN": 205,
  "denmark:realestate:TRMD-A": 176.7,
  "sweden:energy:NIBE-B": 36.27,
  "sweden:energy:MINEST": 0.93,
  "neth:health:ARGX": 715.6,
  "taiwan:health:4174": 28.6,
  "greece:tech:QUAL": 1.29,
  "greece:tech:QUEST": 7.63,
  "greece:industrial:MTLN": 41.86,
  "greece:industrial:AEGN": 12.39,
  "greece:health:BIOKA": 1.68,
  "greece:consumer:BELA": 23.28,
  // No-Yahoo-data fallbacks — last verifiable reference values (so simulated tick at least centres on plausible levels).
  "brazil:industrial:EMBR3": 71.5,
  "greece:consumer:OPAP":    17.95,
  "arg:health:INSU":         1800,
  "arg:health:BIOC":         350,
};

function priceFor(cId, sId, ticker) {
  // Check the fetched JSON first
  const row = prices[cId]?.[sId]?.find(x => x[0] === ticker);
  if (row && row[2] != null) return row[2];
  // Manual / substituted
  const key = `${cId}:${sId}:${ticker}`;
  if (MANUAL[key] != null) return MANUAL[key];
  return null;
}

function fmtNum(v) {
  if (v == null) return "null";
  return v >= 1000 ? Math.round(v).toString() : v.toFixed(2);
}

const lines = [];
lines.push("const STOCKS = {");
for (const [cId, sectors] of Object.entries(NAMES)) {
  lines.push(`  ${cId}: {`);
  for (const [sId, tickers] of Object.entries(sectors)) {
    const items = Object.entries(tickers).map(([t, n]) => {
      const p = priceFor(cId, sId, t);
      const tk = JSON.stringify(t);
      const nm = JSON.stringify(n);
      return `[${tk},${nm},${fmtNum(p)}]`;
    });
    lines.push(`    ${sId.padEnd(10)}:[${items.join(",")}],`);
  }
  lines.push(`  },`);
}
lines.push("};");
fs.writeFileSync("scripts/STOCKS_literal.js", lines.join("\n"));
console.log("Wrote scripts/STOCKS_literal.js");
console.log("Total entries with null:", lines.join("\n").split("null").length - 1);
