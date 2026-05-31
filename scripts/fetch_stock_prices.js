// Fetch live reference prices for the Stock Picks dataset from Yahoo Finance.
// Server-side (Node) — Yahoo v8 chart endpoint has no auth but is CORS-blocked
// in browsers, so we run this once and bake results into StockPicksTab.jsx.

const SUFFIX = {
  usa: "", india: ".NS", taiwan: ".TW", vietnam: ".VN", neth: ".AS",
  denmark: ".CO", sweden: ".ST", brazil: ".SA", greece: ".AT", arg: ".BA",
};

const STOCKS = {
  usa: {
    tech:[["AAPL","Apple"],["MSFT","Microsoft"],["NVDA","NVIDIA"]],
    finance:[["JPM","JPMorgan Chase"],["BAC","Bank of America"],["GS","Goldman Sachs"]],
    industrial:[["CAT","Caterpillar"],["GE","GE Aerospace"],["HON","Honeywell"]],
    health:[["UNH","UnitedHealth"],["LLY","Eli Lilly"],["JNJ","Johnson & Johnson"]],
    consumer:[["AMZN","Amazon"],["WMT","Walmart"],["PG","Procter & Gamble"]],
    energy:[["XOM","Exxon Mobil"],["CVX","Chevron"],["COP","ConocoPhillips"]],
    materials:[["LIN","Linde"],["FCX","Freeport-McMoRan"],["NEM","Newmont"]],
    realestate:[["PLD","Prologis"],["AMT","American Tower"],["EQIX","Equinix"]],
  },
  india: {
    tech:[["TCS","Tata Consultancy"],["INFY","Infosys"],["HCLTECH","HCL Technologies"]],
    finance:[["HDFCBANK","HDFC Bank"],["ICICIBANK","ICICI Bank"],["SBIN","State Bank of India"]],
    industrial:[["LT","Larsen & Toubro"],["SIEMENS","Siemens India"],["ABB","ABB India"]],
    health:[["SUNPHARMA","Sun Pharma"],["CIPLA","Cipla"],["DRREDDY","Dr Reddy's"]],
    consumer:[["HINDUNILVR","Hindustan Unilever"],["ITC","ITC"],["NESTLEIND","Nestlé India"]],
    energy:[["RELIANCE","Reliance Industries"],["ONGC","ONGC"],["NTPC","NTPC"]],
    materials:[["TATASTEEL","Tata Steel"],["HINDALCO","Hindalco"],["JSWSTEEL","JSW Steel"]],
    realestate:[["DLF","DLF"],["GODREJPROP","Godrej Properties"],["OBEROIRLTY","Oberoi Realty"]],
  },
  taiwan: {
    tech:[["2330","TSMC"],["2454","MediaTek"],["2317","Hon Hai (Foxconn)"]],
    finance:[["2882","Cathay Financial"],["2881","Fubon Financial"],["2891","CTBC Financial"]],
    industrial:[["2308","Delta Electronics"],["1303","Nan Ya Plastics"],["2603","Evergreen Marine"]],
    health:[["1795","PharmaEssentia"],["4174","Bora Pharmaceuticals"],["6446","PharmaEngine"]],
    consumer:[["2912","President Chain Store"],["1216","Uni-President"],["2207","Hotai Motor"]],
    energy:[["6505","Formosa Petrochemical"],["2609","Yang Ming Marine"],["1326","Formosa Chemicals"]],
    materials:[["1101","Taiwan Cement"],["2002","China Steel"],["1301","Formosa Plastics"]],
    realestate:[["2542","Highwealth Construction"],["2545","Huang Hsiang"],["9945","Ruentex Development"]],
  },
  vietnam: {
    tech:[["FPT","FPT Corp"],["CMG","CMC Corp"],["ELC","Elcom"]],
    finance:[["VCB","Vietcombank"],["BID","BIDV"],["CTG","VietinBank"]],
    industrial:[["GEX","Gelex"],["REE","REE Corp"],["VEA","Vietnam Engine"]],
    health:[["DHG","DHG Pharma"],["IMP","Imexpharm"],["DBD","Binh Dinh Pharma"]],
    consumer:[["VNM","Vinamilk"],["MSN","Masan Group"],["SAB","Sabeco"]],
    energy:[["GAS","PetroVietnam Gas"],["PLX","Petrolimex"],["POW","PV Power"]],
    materials:[["HPG","Hoa Phat Group"],["HSG","Hoa Sen Group"],["NKG","Nam Kim Steel"]],
    realestate:[["VHM","Vinhomes"],["VIC","Vingroup"],["NVL","Novaland"]],
  },
  neth: {
    tech:[["ASML","ASML Holding"],["ADYEN","Adyen"],["BESI","BE Semiconductor"]],
    finance:[["INGA","ING Group"],["ABN","ABN AMRO"],["AGN","Aegon"]],
    industrial:[["PHIA","Philips"],["WKL","Wolters Kluwer"],["RAND","Randstad"]],
    health:[["ARGX","argenx"],["GLPG","Galapagos"],["PHARM","Pharming Group"]],
    consumer:[["AD","Ahold Delhaize"],["HEIA","Heineken"],["PRX","Prosus"]],
    energy:[["SBMO","SBM Offshore"],["VPK","Vopak"],["OCI","OCI"]],
    materials:[["AKZA","Akzo Nobel"],["IMCD","IMCD"],["AMG","AMG Critical Materials"]],
    realestate:[["WHA","Wereldhave"],["ECMPA","Eurocommercial"],["NSI","NSI"]],
  },
  denmark: {
    tech:[["NETC","Netcompany"],["NNIT","NNIT"],["COLUM","Columbus"]],
    finance:[["DANSKE","Danske Bank"],["JYSK","Jyske Bank"],["SYDB","Sydbank"]],
    industrial:[["DSV","DSV"],["MAERSK-B","A.P. Møller-Mærsk"],["FLS","FLSmidth"]],
    health:[["NOVO-B","Novo Nordisk"],["GMAB","Genmab"],["COLO-B","Coloplast"]],
    consumer:[["CARL-B","Carlsberg"],["ROYAL","Royal Unibrew"],["PNDORA","Pandora"]],
    energy:[["ORSTED","Ørsted"],["VWS","Vestas Wind"],["NKT","NKT"]],
    materials:[["ROCK-B","Rockwool"],["NSIS-B","Novonesis"],["SCHO","Schouw & Co"]],
    realestate:[["JEUDAN","Jeudan"],["PARKEN","Parken Sport"],["TORM-A","TORM"]],
  },
  sweden: {
    tech:[["ERIC-B","Ericsson"],["HEXA-B","Hexagon"],["EVO","Evolution"]],
    finance:[["SEB-A","SEB"],["SWED-A","Swedbank"],["NDA-SE","Nordea"]],
    industrial:[["ATCO-A","Atlas Copco"],["VOLV-B","Volvo"],["SAND","Sandvik"]],
    health:[["AZN","AstraZeneca"],["GETI-B","Getinge"],["SOBI","Swedish Orphan Biovitrum"]],
    consumer:[["HM-B","H&M"],["ESSITY-B","Essity"],["ELUX-B","Electrolux"]],
    energy:[["NIBE","NIBE Industrier"],["EOLU-B","Eolus Vind"],["ARISE","Arise"]],
    materials:[["BOL","Boliden"],["SSAB-A","SSAB"],["SCA-B","SCA"]],
    realestate:[["CAST","Castellum"],["FABG","Fabege"],["SBB-B","SBB"]],
  },
  brazil: {
    tech:[["TOTS3","Totvs"],["LWSA3","Locaweb"],["INTB3","Intelbras"]],
    finance:[["ITUB4","Itaú Unibanco"],["BBDC4","Bradesco"],["BBAS3","Banco do Brasil"]],
    industrial:[["WEGE3","WEG"],["EMBR3","Embraer"],["RAIL3","Rumo"]],
    health:[["RDOR3","Rede D'Or"],["HAPV3","Hapvida"],["FLRY3","Fleury"]],
    consumer:[["ABEV3","Ambev"],["LREN3","Lojas Renner"],["MGLU3","Magazine Luiza"]],
    energy:[["PETR4","Petrobras"],["PRIO3","PRIO"],["EQTL3","Equatorial Energia"]],
    materials:[["VALE3","Vale"],["GGBR4","Gerdau"],["SUZB3","Suzano"]],
    realestate:[["MULT3","Multiplan"],["CYRE3","Cyrela"],["IGTI11","Iguatemi"]],
  },
  greece: {
    tech:[["EPSIL","Epsilon Net"],["PROF","Profile Systems"],["BYTE","Byte Computer"]],
    finance:[["ETE","National Bank of Greece"],["EUROB","Eurobank"],["ALPHA","Alpha Services"]],
    industrial:[["MYTIL","Metlen Energy & Metals"],["ARAIG","Aegean Airlines"],["ELLAKTOR","Ellaktor"]],
    health:[["IATR","Iatriko Athinon"],["MEDIC","Medicon Hellas"],["BIOK","Bioiatriki"]],
    consumer:[["OPAP","OPAP"],["JUMBO","Jumbo"],["SAR","Sarantis"]],
    energy:[["PPC","Public Power Corp"],["ELPE","HelleniQ Energy"],["MOH","Motor Oil Hellas"]],
    materials:[["TITC","Titan Cement"],["VIO","Viohalco"],["ELHA","Elvalhalcor"]],
    realestate:[["LAMDA","Lamda Development"],["TRASTOR","Trastor REIC"],["PREMIA","Premia Properties"]],
  },
  arg: {
    tech:[["GLOB","Globant"],["MELI","MercadoLibre"],["BYMA","BYMA"]],
    finance:[["GGAL","Grupo Fin. Galicia"],["BMA","Banco Macro"],["SUPV","Grupo Supervielle"]],
    industrial:[["MIRG","Mirgor"],["CAPX","Capex"],["FERR","Ferrum"]],
    health:[["RICH","Lab. Richmond"],["INSU","Insuagro"],["BIOC","Bioceres"]],
    consumer:[["CRES","Cresud"],["MORI","Molinos Río"],["LEDE","Ledesma"]],
    energy:[["YPFD","YPF"],["PAMP","Pampa Energía"],["CEPU","Central Puerto"]],
    materials:[["TXAR","Ternium Argentina"],["ALUA","Aluar"],["HARG","Holcim Argentina"]],
    realestate:[["IRSA","IRSA Inversiones"],["IRCP","IRSA Prop. Comerciales"],["SAMI","San Miguel"]],
  },
};

function yahooSym(cId, ticker) {
  // Yahoo uses dot/hyphen variants. Most of our tickers already match; tweak edge cases.
  return ticker + SUFFIX[cId];
}

async function fetchOne(sym) {
  try {
    const r = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`,
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } }
    );
    if (!r.ok) return { sym, ok: false, status: r.status };
    const j = await r.json();
    const meta = j?.chart?.result?.[0]?.meta;
    if (!meta || meta.regularMarketPrice == null) return { sym, ok: false, err: j?.chart?.error?.description };
    return { sym, ok: true, price: meta.regularMarketPrice, currency: meta.currency, exch: meta.fullExchangeName };
  } catch (e) {
    return { sym, ok: false, err: e.message };
  }
}

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

(async () => {
  const out = {}; const missing = [];
  let total = 0, ok = 0;
  for (const [cId, sectors] of Object.entries(STOCKS)) {
    out[cId] = {};
    for (const [sId, list] of Object.entries(sectors)) {
      out[cId][sId] = [];
      for (const [ticker, name] of list) {
        const sym = yahooSym(cId, ticker);
        const r = await fetchOne(sym);
        total++;
        if (r.ok) {
          ok++;
          out[cId][sId].push([ticker, name, +r.price.toFixed(r.price >= 1000 ? 0 : 2)]);
          console.log(`${sym} = ${r.price} ${r.currency}`);
        } else {
          missing.push({ cId, sId, ticker, sym, err: r.err || r.status });
          out[cId][sId].push([ticker, name, null]);
          console.log(`${sym} MISS (${r.err || r.status})`);
        }
        await sleep(120); // be polite
      }
    }
  }
  console.log(`\n=== ${ok}/${total} resolved, ${missing.length} missing ===`);
  console.log(JSON.stringify({ missing }, null, 2));
  require("fs").writeFileSync("scripts/prices_out.json", JSON.stringify(out, null, 2));
  console.log("Wrote scripts/prices_out.json");
})();
