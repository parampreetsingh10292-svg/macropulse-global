// ─────────────────────────────────────────────────────────────
// TAB: Top Stocks — top 3 per market + India access route.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { Card, Source, Loading } from "../components/ui.jsx";

export default function StocksTab({ countries, active, setActive }) {
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState({});

  useEffect(() => {
    api("/stocks").then((r) => { setData(r.data); setMeta({ source: r.source, asOf: r.asOf }); }).catch(() => {});
  }, []);

  if (!data) return <Loading label="Loading top stocks per market…" />;

  const cObj = countries.find((c) => c.id === active);
  const d = data[active];

  return (
    <div style={{ animation: "mp-fade .3s ease" }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#374151", letterSpacing: ".12em", marginBottom: 14 }}>
        {cObj?.flag} TOP 3 PERFORMING STOCKS · {cObj?.name.toUpperCase()}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
        {d.stocks.map((s, i) => (
          <Card key={i} accent={`${cObj?.color}1e`} style={{ background: `${cObj?.color}0c`, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${cObj?.color}1e`, border: `1px solid ${cObj?.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 13, color: cObj?.color, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: "#f9fafb" }}>{s.name}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, color: cObj?.color, background: `${cObj?.color}18`, border: `1px solid ${cObj?.color}33`, borderRadius: 4, padding: "1px 6px" }}>{s.ticker}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#4b5563" }}>{s.sector}</span>
              </div>
            </div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 13, color: "#4ade80", flexShrink: 0 }}>{s.perf}</div>
          </Card>
        ))}
      </div>

      <Card accent="rgba(99,102,241,.22)" style={{ background: "rgba(99,102,241,.07)", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
          <span style={{ fontSize: 15 }}>🇮🇳</span>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: "#a5b4fc" }}>HOW TO INVEST FROM INDIA</span>
        </div>
        <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 12.5, color: "#d1d5db", lineHeight: 1.7, margin: 0 }}>{d.howToInvest}</p>
        <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 5 }}>
          {["Zerodha Coin", "INDmoney", "Vested", "Groww", "PGIM Global Fund"].map((p) => (
            <span key={p} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: "#818cf8", background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.18)", borderRadius: 4, padding: "3px 7px" }}>{p}</span>
          ))}
        </div>
      </Card>

      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#374151", letterSpacing: ".1em", marginBottom: 9 }}>ALL OTHER MARKETS · QUICK VIEW</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 7 }}>
        {countries.filter((c) => c.id !== active).map((c) => (
          <Card key={c.id} accent={`${c.color}1e`} className="mp-row" onClick={() => setActive(c.id)} style={{ cursor: "pointer", padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 7 }}>
              <span style={{ fontSize: 12 }}>{c.flag}</span>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 10, color: "#9ca3af" }}>{c.name}</span>
            </div>
            {data[c.id].stocks.slice(0, 2).map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#4b5563" }}>{s.ticker}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#9ca3af" }}>{s.sector}</span>
              </div>
            ))}
          </Card>
        ))}
      </div>
      <Source src={meta.source} asOf={meta.asOf} />
    </div>
  );
}
