// ─────────────────────────────────────────────────────────────
// TAB: Markets & FX — currencies vs USD/INR, DXY, commodities.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { api, fmtNum, fmtPct } from "../lib/api.js";
import { Card, Source, Loading } from "../components/ui.jsx";

function Spark({ pts, color, height = 32 }) {
  if (pts === undefined)
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "80%", height: 2, borderRadius: 1, background: "rgba(255,255,255,.06)", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", width: "30%", height: "100%", background: color || "#6366f1", opacity: 0.5, borderRadius: 1, animation: "mp-shimmer 1.5s ease-in-out infinite" }} />
        </div>
      </div>
    );
  if (!pts || !pts.length) return null;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={pts}>
        <YAxis hide domain={["dataMin", "dataMax"]} />
        <Line type="monotone" dataKey="price" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function FxTab({ countries }) {
  const [fx, setFx] = useState(null);
  const [comm, setComm] = useState(null);
  const [fxMeta, setFxMeta] = useState({});
  const [cMeta, setCMeta] = useState({});
  const [fxSpark, setFxSpark] = useState(null);
  const [commSpark, setCommSpark] = useState(null);

  useEffect(() => {
    api("/fx").then((r) => { setFx(r.data); setFxMeta({ source: r.source, asOf: r.asOf }); }).catch(() => {});
    api("/commodities").then((r) => { setComm(r.data); setCMeta({ source: r.source, asOf: r.asOf, live: r.live }); }).catch(() => {});
    api("/fx/sparklines").then((r) => setFxSpark(r.data)).catch(() => {});
    api("/commodities/sparklines").then((r) => setCommSpark(r.data)).catch(() => {});
  }, []);

  if (!fx || !comm) return <Loading label="Loading FX & commodities…" />;

  const ccyCountry = (ccy) => countries.filter((c) => c.currency === ccy).map((c) => c.flag).join(" ");

  return (
    <div style={{ animation: "mp-fade .3s ease" }}>
      {/* Top strip: USD/INR + DXY */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <Card accent="rgba(249,115,22,.3)" style={{ flex: "1 1 200px" }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#374151", letterSpacing: ".1em" }}>USD / INR</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, color: "#f97316" }}>₹{fmtNum(fx.usdInr, 2)}</div>
          <Spark pts={fxSpark ? fxSpark["INR"] : undefined} color="#f97316" height={28} />
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#4b5563" }}>1 US Dollar in Indian Rupees</div>
        </Card>
        <Card accent="rgba(59,130,246,.3)" style={{ flex: "1 1 200px" }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#374151", letterSpacing: ".1em" }}>DXY (PROXY)</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, color: "#3b82f6" }}>{fmtNum(fx.dxyProxy, 2)}</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#4b5563" }}>US Dollar Index (basket proxy)</div>
        </Card>
      </div>

      {/* Currencies */}
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#374151", letterSpacing: ".12em", marginBottom: 10 }}>
        CURRENCIES · PER USD & VALUE IN INR
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10, marginBottom: 8 }}>
        {fx.rows.map((r) => {
          const pts = fxSpark ? fxSpark[r.currency] : undefined;
          return (
            <Card key={r.currency} accent="rgba(255,255,255,.07)">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: "#f9fafb" }}>{r.currency}</span>
                <span style={{ fontSize: 12 }}>{ccyCountry(r.currency)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: "#374151" }}>PER USD</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: "#e5e7eb" }}>{fmtNum(r.perUSD, 4)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: "#374151" }}>1 UNIT IN ₹</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: "#f97316" }}>₹{fmtNum(r.inINR, 3)}</div>
                </div>
              </div>
              <Spark pts={pts} color="#6366f1" height={28} />
            </Card>
          );
        })}
      </div>
      <Source src={fxMeta.source} asOf={fxMeta.asOf} />

      {/* Commodities */}
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#374151", letterSpacing: ".12em", margin: "20px 0 10px" }}>
        COMMODITIES
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
        {comm.map((c) => {
          const up = c.changePct >= 0;
          const col = up ? "#10b981" : "#ef4444";
          const pts = commSpark ? commSpark[c.id] : undefined;
          return (
            <Card key={c.id} accent="rgba(255,255,255,.07)">
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#4b5563", letterSpacing: ".08em" }}>{c.label.toUpperCase()}</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: "#f9fafb", marginTop: 2 }}>{fmtNum(c.price, 2)}</div>
              <Spark pts={pts} color={col} height={32} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 3 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#4b5563" }}>{c.unit}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: col }}>{up ? "▲" : "▼"} {fmtPct(c.changePct)}</span>
              </div>
            </Card>
          );
        })}
      </div>
      <Source src={cMeta.source} asOf={cMeta.asOf} />
    </div>
  );
}
