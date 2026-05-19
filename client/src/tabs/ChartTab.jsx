// ─────────────────────────────────────────────────────────────
// TAB: Chart & Forecast — 10y normalised performance + forecast.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { api } from "../lib/api.js";
import { Card, Source, Loading } from "../components/ui.jsx";

export default function ChartTab({ countries, active, setActive }) {
  const [perf, setPerf] = useState(null);
  const [meta, setMeta] = useState({});
  const [showFc, setShowFc] = useState(true);
  const [hidden, setHidden] = useState({});

  useEffect(() => {
    api("/performance")
      .then((r) => { setPerf(r.data); setMeta({ source: r.source, asOf: r.asOf, disc: r.forecastDisclaimer }); })
      .catch(() => {});
  }, []);

  if (!perf) return <Loading label="Loading performance history…" />;

  const colorOf = (id) => countries.find((c) => c.id === id)?.color || "#3b82f6";
  const cObj = countries.find((c) => c.id === active);
  const last = perf.history[perf.history.length - 1];
  const fc = perf.forecast[active] || [];

  const merged = [
    ...perf.history,
    ...(showFc ? fc.map((f) => ({ year: f.year, [`${active}_f`]: f.v })) : []),
  ];

  return (
    <div style={{ animation: "mp-fade .3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#374151", letterSpacing: ".12em" }}>
          NORMALISED PERFORMANCE · BASE 100 = APR 2016 · USD
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
          <div onClick={() => setShowFc((p) => !p)} style={{ width: 30, height: 16, borderRadius: 8, position: "relative", background: showFc ? "#6366f1" : "rgba(255,255,255,.1)", transition: "background .2s" }}>
            <div style={{ position: "absolute", top: 2, left: showFc ? 14 : 2, width: 12, height: 12, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
          </div>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, color: showFc ? "#a78bfa" : "#374151" }}>6-MONTH FORECAST</span>
        </label>
      </div>

      <Card>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={merged} margin={{ top: 5, right: 18, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
            <XAxis dataKey="year" tick={{ fill: "#374151", fontSize: 9, fontFamily: "'JetBrains Mono',monospace" }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,.06)" }} />
            <YAxis tick={{ fill: "#374151", fontSize: 9, fontFamily: "'JetBrains Mono',monospace" }} tickLine={false} axisLine={false} domain={[70, "auto"]} width={34} />
            <Tooltip contentStyle={{ background: "rgba(4,7,18,.97)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 10, fontFamily: "monospace", fontSize: 11 }} />
            {showFc && <ReferenceLine x={last.year} stroke="rgba(167,139,250,.35)" strokeDasharray="4 4" />}
            {countries.map((c) => (
              <Line key={c.id} type="monotone" dataKey={c.id} name={c.name} stroke={c.color}
                strokeWidth={active === c.id ? 3 : hidden[c.id] ? 0 : 1.5} dot={false}
                opacity={hidden[c.id] ? 0 : active && active !== c.id ? 0.18 : 1} />
            ))}
            {showFc && <Line type="monotone" dataKey={`${active}_f`} name="Forecast" stroke={colorOf(active)} strokeWidth={2.5} strokeDasharray="7 3" dot={false} />}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {showFc && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#4b5563", letterSpacing: ".12em", marginBottom: 8 }}>
            {cObj?.flag} {cObj?.name.toUpperCase()} · 6-MONTH SCENARIO · BEAR / BASE / BULL
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {fc.map((f, i) => {
              const base = last[active];
              const chg = (((f.v - base) / base) * 100).toFixed(1);
              return (
                <div key={i} style={{ flex: "1 1 78px", background: `${colorOf(active)}0c`, border: `1px solid ${colorOf(active)}2e`, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: "#4b5563", marginBottom: 5 }}>{f.year}</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 14, color: colorOf(active) }}>{f.v}</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: "#4ade80", marginTop: 2 }}>{chg > 0 ? "+" : ""}{chg}%</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7, color: "#374151", marginTop: 4 }}>{f.lo} ↔ {f.hi}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 14 }}>
        {[...countries].sort((a, b) => (last[b.id] || 0) - (last[a.id] || 0)).map((c) => {
          const gain = (((last[c.id] - 100) / 100) * 100).toFixed(0);
          const h = hidden[c.id];
          return (
            <div key={c.id} onClick={() => setHidden((p) => ({ ...p, [c.id]: !p[c.id] }))}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 20, cursor: "pointer", background: h ? "rgba(255,255,255,.015)" : `${c.color}10`, border: `1px solid ${h ? "rgba(255,255,255,.04)" : c.color + "2e"}`, opacity: h ? 0.3 : 1 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: h ? "#374151" : c.color }} />
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: h ? "#374151" : c.color }}>{c.flag} +{gain}%</span>
            </div>
          );
        })}
      </div>

      {meta.disc && (
        <div style={{ marginTop: 12, fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#a78bfa88", lineHeight: 1.6 }}>
          ⚠ {meta.disc}
        </div>
      )}
      <Source src={meta.source} asOf={meta.asOf} />
    </div>
  );
}
