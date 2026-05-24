// ─────────────────────────────────────────────────────────────
// TAB: Live Indices — real-time index levels for all 10 markets.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { api, fmtNum, fmtPct } from "../lib/api.js";
import { Card, Pulse, Source, Loading } from "../components/ui.jsx";
import { Glossary, CountrySummary } from "../components/Glossary.jsx";

function Spark({ pts, color }) {
  if (pts === undefined)
    return (
      <div style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "80%", height: 2, borderRadius: 1, background: "rgba(255,255,255,.06)", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", width: "30%", height: "100%", background: color || "#6366f1", opacity: 0.5, borderRadius: 1, animation: "mp-shimmer 1.5s ease-in-out infinite" }} />
        </div>
      </div>
    );
  if (!pts || !pts.length)
    return (
      <div style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: 7, color: "#2a3441" }}>
        sparkline unavailable
      </div>
    );
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={pts}>
        <YAxis hide domain={["dataMin", "dataMax"]} />
        <Line type="monotone" dataKey="price" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

const GLOSSARY = [
  { icon: "📊", term: "Stock Market Index", definition: "A number that tracks how a group of important stocks is performing overall. Think of it as a 'score' for the stock market — when it goes up, most stocks are doing well." },
  { icon: "📈", term: "S&P 500", definition: "Tracks the 500 biggest companies in the USA (like Apple, Google, Amazon). It's the most watched stock market number in the world." },
  { icon: "🇮🇳", term: "NIFTY 50", definition: "India's main stock index — tracks the 50 largest companies on India's National Stock Exchange (like Reliance, TCS, Infosys)." },
  { icon: "💰", term: "Index Price", definition: "The current value of the index. A higher number generally means stocks have gone up over time. Each country's index has its own scale." },
  { icon: "📉", term: "Change % (▲ / ▼)", definition: "How much the index moved today compared to yesterday's closing price. Green (▲) means it went up, Red (▼) means it went down. For example, +1.5% means stocks gained 1.5% today." },
  { icon: "🔙", term: "Prev Close", definition: "The price when the market closed yesterday. Today's change is measured from this number." },
  { icon: "⬆️", term: "High (H) / Low (L)", definition: "The highest and lowest price the index reached during today's trading session." },
  { icon: "〰️", term: "Sparkline", definition: "The small line chart inside each card. It shows how the price moved throughout the day — you can see if it went up smoothly or had ups and downs." },
  { icon: "🟢", term: "Live vs Ref", definition: "'Live' means data is being fetched in real-time from market sources. 'Ref' (reference) means the system is using recent stored data because the live source is temporarily unavailable." },
  { icon: "🔄", term: "Auto-Refresh 60s", definition: "The prices update automatically every 60 seconds without you needing to reload the page." },
  { icon: "💱", term: "Currency (USD, INR, BRL...)", definition: "The currency in which the index price is shown. Each country's index is priced in its local currency." },
];

export default function IndicesTab({ countries, active }) {
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState({});
  const [err, setErr] = useState(null);
  const [sparklines, setSparklines] = useState(null);

  async function load() {
    try {
      const r = await api("/indices");
      setData(r.data);
      setMeta({ source: r.source, asOf: r.asOf, live: r.live });
      setErr(null);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    load();
    api("/indices/sparklines")
      .then((r) => setSparklines(r.data || {}))
      .catch(() => setSparklines({}));
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  if (err) return <Card accent="rgba(239,68,68,.3)"><div style={{ color: "#f87171", fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>Failed to load indices: {err}</div></Card>;
  if (!data) return <Loading label="Fetching live index levels…" />;

  const sorted = [...data].sort((a, b) => b.changePct - a.changePct);

  return (
    <div style={{ animation: "mp-fade .3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#374151", letterSpacing: ".12em" }}>
          LIVE INDEX LEVELS · ALL 10 MARKETS · AUTO-REFRESH 60s
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {meta.live ? <Pulse /> : <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#6b7280" }} />}
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: meta.live ? "#10b981" : "#6b7280", letterSpacing: ".08em" }}>
            {meta.live ? "LIVE FEED" : "REFERENCE (add market-data key for live)"}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 10 }}>
        {sorted.map((q) => {
          const up = q.changePct >= 0;
          const c = up ? "#10b981" : "#ef4444";
          return (
            <Card key={q.id} accent={`${q.color}22`} style={{ position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${c}00,${c},${c}00)`, opacity: 0.7 }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{q.flag}</span>
                    <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: "#f9fafb" }}>{q.name}</span>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, color: "#4b5563", marginTop: 2 }}>{q.indexName} · {q.currency}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: "#f9fafb", lineHeight: 1 }}>{fmtNum(q.price, q.price > 10000 ? 0 : 2)}</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: c, marginTop: 3 }}>
                    {up ? "▲" : "▼"} {fmtPct(q.changePct)}
                  </div>
                </div>
              </div>
              <Spark pts={sparklines ? sparklines[q.id] : undefined} color={c} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#4b5563" }}>
                <span>Prev {fmtNum(q.prevClose, q.prevClose > 10000 ? 0 : 2)}</span>
                {q.high != null && <span>H {fmtNum(q.high, 0)} · L {fmtNum(q.low, 0)}</span>}
                <span style={{ color: q.provider?.startsWith("Reference") ? "#6b7280" : "#10b981" }}>
                  {q.provider?.startsWith("Reference") ? "ref" : "live"}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      <Source src={meta.source} asOf={meta.asOf} />

      {/* Country summary */}
      {(() => {
        const cObj = countries?.find((c) => c.id === active);
        const q = data?.find((d) => d.id === active);
        if (!cObj || !q) return null;
        const up = q.changePct >= 0;
        return (
          <CountrySummary country={cObj}>
            {cObj.name}'s stock market index ({q.indexName}) is currently at <strong>{q.price?.toLocaleString()}</strong> {q.currency}.{" "}
            {up
              ? `It is up ${Math.abs(q.changePct).toFixed(2)}% from yesterday's close of ${q.prevClose?.toLocaleString()}, meaning investors are generally optimistic today.`
              : `It is down ${Math.abs(q.changePct).toFixed(2)}% from yesterday's close of ${q.prevClose?.toLocaleString()}, meaning investors are cautious today.`}
            {q.high != null && q.low != null && (
              <> Today's trading range was between {q.low?.toLocaleString()} (lowest) and {q.high?.toLocaleString()} (highest).</>
            )}
            {" "}The data is sourced from <strong>{q.provider}</strong>.
            {!q.provider?.startsWith("Reference") ? " This is live, real-time data." : " This is stored reference data — live data was temporarily unavailable."}
          </CountrySummary>
        );
      })()}

      <Glossary title="New to stock markets? Here's what everything means" terms={GLOSSARY} />
    </div>
  );
}
