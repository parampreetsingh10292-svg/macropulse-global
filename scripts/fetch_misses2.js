const TRIES = {
  "vietnam:industrial:VEA": ["GMD.VN", "PHR.VN"],            // replace UPCoM VEA with HOSE Gemadept/PHR
  "denmark:finance:SYDB":   ["SPNO.CO", "RILBA.CO"],         // Sydbank not on Yahoo — Spar Nord / Ringkjøbing
  "sweden:energy:ARISE":    ["OX2.ST", "MINEST.ST", "CTEK.ST"],
  "brazil:industrial:EMBR3":["EMBR3.SA", "ERJ"],              // retry / ADR
  "greece:tech:EPSIL":      ["QUAL.AT", "PROF.AT", "ENTER.AT"],
  "greece:tech:BYTE":       ["BYTEr.AT", "QUEST.AT", "PERFORMANCE.AT"],
  "greece:industrial:MYTIL":["MTL.AT", "MYTILINEOS.AT", "MTLN.AT"],
  "greece:consumer:OPAP":   ["OPAP.AT", "OPAPr.AT"],
  "arg:health:INSU":        ["MORI.BA"],                     // accept will keep INSU as ref if all fail
};

async function tryOne(sym) {
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`,
      { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) return { ok:false };
    const j = await r.json();
    const m = j?.chart?.result?.[0]?.meta;
    if (!m || m.regularMarketPrice == null) return { ok:false };
    return { ok:true, price:m.regularMarketPrice, currency:m.currency, exch:m.fullExchangeName };
  } catch { return { ok:false }; }
}
const sleep = ms => new Promise(r=>setTimeout(r,ms));

(async () => {
  for (const [k, syms] of Object.entries(TRIES)) {
    for (const s of syms) {
      const r = await tryOne(s);
      if (r.ok) { console.log(`${k} → ${s} = ${r.price} ${r.currency} @ ${r.exch}`); break; }
      else console.log(`${k} → ${s} miss`);
      await sleep(150);
    }
  }
})();
