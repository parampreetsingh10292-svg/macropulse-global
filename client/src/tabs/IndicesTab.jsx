// ─────────────────────────────────────────────────────────────
// TAB: Live Indices — real-time index levels for all 10 markets.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { api, fmtNum, fmtPct } from "../lib/api.js";
import { Card, Pulse, Source, Loading } from "../components/ui.jsx";

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

export default function IndicesTab() {
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
    </div>
  );
}
