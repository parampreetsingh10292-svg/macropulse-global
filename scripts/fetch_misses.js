// Try alternate Yahoo symbols for the 19 misses.
const ALT = {
  "taiwan:health:4174": "4174.TWO",            // Bora Pharma - OTC
  "vietnam:industrial:VEA": null,              // UPCoM, not on Yahoo - keep ref
  "neth:health:ARGX": "ARGX.BR",               // argenx is on Brussels primary
  "denmark:finance:SYDB": "SYDB.CO",           // retry
  "denmark:consumer:ROYAL": "RBREW.CO",        // Royal Unibrew's actual ticker
  "denmark:realestate:JEUDAN": "JDAN.CO",      // Jeudan's actual ticker
  "denmark:realestate:TORM-A": "TRMD-A.CO",    // TORM trades as TRMD
  "sweden:energy:NIBE": "NIBE-B.ST",           // dual-class B share
  "sweden:energy:ARISE": "ARISE.ST",           // retry
  "brazil:industrial:EMBR3": "EMBR3.SA",       // retry
  "greece:tech:EPSIL": "EPSIL.AT",             // retry
  "greece:tech:BYTE": "BYTE.AT",               // retry
  "greece:industrial:MYTIL": "METLEN.AT",      // renamed from Mytilineos to Metlen
  "greece:industrial:ARAIG": "AEGN.AT",        // Aegean Airlines actual code
  "greece:health:BIOK": "BIOKA.AT",            // Bioiatriki
  "greece:consumer:OPAP": "OPAr.AT",           // common Yahoo Greek format
  "greece:consumer:JUMBO": "BELA.AT",          // Jumbo trades as BELA
  "arg:health:INSU": null,                     // not on Yahoo BCBA
  "arg:health:BIOC": "BIOX",                   // Bioceres is BIOX on Nasdaq (USD)
};

async function tryOne(sym) {
  if (!sym) return null;
  try {
    const r = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`,
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } }
    );
    if (!r.ok) return { ok: false, status: r.status };
    const j = await r.json();
    const m = j?.chart?.result?.[0]?.meta;
    if (!m || m.regularMarketPrice == null) return { ok: false, err: j?.chart?.error?.description };
    return { ok: true, price: m.regularMarketPrice, currency: m.currency, exch: m.fullExchangeName };
  } catch (e) { return { ok: false, err: e.message }; }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  for (const [k, sym] of Object.entries(ALT)) {
    if (!sym) { console.log(`${k} → SKIP (no alternate)`); continue; }
    const r = await tryOne(sym);
    console.log(`${k} via ${sym} →`, r.ok ? `${r.price} ${r.currency} @ ${r.exch}` : `MISS (${r.err || r.status})`);
    await sleep(150);
  }
})();
