// ─────────────────────────────────────────────────────────────
// TAB: Macro Economics — 6 indicators vs govt targets + scorecard.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { Card, OutlookTag, Source, Loading } from "../components/ui.jsx";
import { Glossary, CountrySummary } from "../components/Glossary.jsx";

const GLOSSARY = [
  { icon: "📈", term: "GDP Growth (%)", definition: "Gross Domestic Product growth — how fast the country's economy is expanding. Think of it as 'how much more stuff the country produced this year vs last year.' Higher is better — 2-3% is normal for rich countries, 5-7% for developing ones." },
  { icon: "🔥", term: "Inflation (%)", definition: "How fast prices are rising. If inflation is 4%, something that cost $100 last year now costs $104. A little inflation (2%) is normal and healthy. Too much (above 5-6%) means your money loses value quickly." },
  { icon: "🏦", term: "10Y Bond Yield (%)", definition: "The interest rate the government pays when it borrows money for 10 years. Higher yields mean higher borrowing costs. It also reflects how much investors trust the government to repay its debts." },
  { icon: "👥", term: "Unemployment (%)", definition: "The percentage of people who want to work but cannot find a job. Lower is better. Below 4% is usually very good; above 8% signals economic trouble." },
  { icon: "💸", term: "Fiscal Deficit (% of GDP)", definition: "How much more the government spends than it earns in a year, as a share of the total economy. Like a household spending more than its income — a small deficit is normal, but large ones can be risky." },
  { icon: "⚖️", term: "Debt-to-GDP (%)", definition: "The total amount of money the government owes compared to the size of the economy. Below 60% is generally healthy, 60-100% is manageable, above 100% needs careful watching. Think of it like your total debt compared to your annual salary." },
  { icon: "🟢", term: "Bullish (▲ On Track)", definition: "Positive outlook — the indicator is doing well and heading in the right direction. Like a green traffic light." },
  { icon: "🟡", term: "Neutral (◆ Near Target)", definition: "The indicator is roughly on track but not exceptional. Like a yellow traffic light — worth watching." },
  { icon: "🔴", term: "Bearish (▼ Off Track)", definition: "Negative outlook — the indicator is heading in the wrong direction or missing its target. Needs attention or improvement." },
  { icon: "🎯", term: "Target", definition: "The ideal level that the government or central bank is aiming for. For example, most central banks target 2% inflation." },
  { icon: "💯", term: "Macro Score (out of 100)", definition: "An overall health score combining all 6 indicators. Above 65 = strong economy, 45-65 = mixed signals, below 45 = concerning. Think of it as the country's economic 'report card.'" },
  { icon: "📊", term: "vs Prev", definition: "Comparison with the previous period's value. Shows whether things are improving (+) or worsening (-)." },
];

const PARAMS = [
  { key: "gdp", label: "GDP Growth", unit: "%", icon: "📈" },
  { key: "inflation", label: "Inflation", unit: "%", icon: "🔥" },
  { key: "bonds", label: "10Y Bond Yield", unit: "%", icon: "🏦" },
  { key: "unemployment", label: "Unemployment", unit: "%", icon: "👥" },
  { key: "fiscalDeficit", label: "Fiscal Deficit", unit: "% GDP", icon: "💸" },
  { key: "debtToGdp", label: "Debt-to-GDP", unit: "%", icon: "⚖️" },
];
const C = { bullish: "#10b981", neutral: "#f59e0b", bearish: "#ef4444" };
const I = { bullish: "▲", neutral: "◆", bearish: "▼" };

function Gauge({ p, d, color }) {
  if (!d) return null;
  const sc = C[d.outlook];
  const delta = (d.current - d.prev).toFixed(1);
  // visual fill: closeness to target
  const fill =
    p.key === "bonds" ? 60
      : ["gdp"].includes(p.key)
        ? Math.min(100, (d.current / (d.target * 1.5)) * 100)
        : Math.min(100, Math.max(5, 100 - ((d.current - d.target) / Math.max(1, d.target)) * 100));

  return (
    <Card accent="rgba(255,255,255,.07)" style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${sc}00,${sc},${sc}00)`, opacity: 0.8 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
            <span style={{ fontSize: 12 }}>{p.icon}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#4b5563", letterSpacing: ".1em" }}>{p.label.toUpperCase()}</span>
          </div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: "#f9fafb", lineHeight: 1 }}>
            {d.current}<span style={{ fontSize: 12, color: "#6b7280", fontWeight: 400 }}>{p.unit === "% GDP" ? "%" : p.unit}</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <OutlookTag outlook={d.outlook} />
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#6b7280", marginTop: 4 }}>
            {delta > 0 ? "+" : ""}{delta} vs prev
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#374151" }}>Current</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color }}>Target {d.target}{p.unit === "% GDP" ? "%" : p.unit}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,.05)", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${fill}%`, background: `linear-gradient(90deg,${sc}88,${sc})`, borderRadius: 3, transition: "width 1s ease" }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, left: "66%", width: 2, background: `${color}88` }} />
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: "#2a3441", marginTop: 6, display: "flex", justifyContent: "space-between" }}>
        <span>Prev {d.prev}{p.unit === "% GDP" ? "%" : p.unit}</span>
        <span>{d.source}</span>
      </div>
    </Card>
  );
}

export default function MacroTab({ countries, active, setActive }) {
  const [macro, setMacro] = useState(null);
  const [meta, setMeta] = useState({});
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api("/macro").then((r) => { setMacro(r.data); setMeta({ source: r.source, asOf: r.asOf }); }).catch(() => {});
  }, []);

  if (!macro) return <Loading label="Loading macro indicators from World Bank + IMF…" />;

  const cObj = countries.find((c) => c.id === active);
  const m = macro[active];
  const params = filter === "all" ? PARAMS : PARAMS.filter((p) => m[p.key]?.outlook === filter);

  return (
    <div style={{ animation: "mp-fade .3s ease" }}>
      <Card accent={`${cObj?.color}28`} style={{ background: `${cObj?.color}0e`, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 18 }}>{cObj?.flag}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: "#f9fafb" }}>{cObj?.name} Macro Overview</span>
              <OutlookTag outlook={m.overallOutlook} label={`${(m.overallOutlook || "").toUpperCase()} MACRO`} />
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#4b5563", marginLeft: "auto" }}>Score {m.score}/100</span>
            </div>
            <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, color: "#9ca3af", lineHeight: 1.6, margin: 0 }}>{m.summary}</p>
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#374151", letterSpacing: ".1em", alignSelf: "center" }}>FILTER:</span>
        {[["all", "All", "#6b7280"], ["bullish", "▲ On Track", "#10b981"], ["neutral", "◆ Near Target", "#f59e0b"], ["bearish", "▼ Off Track", "#ef4444"]].map(([k, l, col]) => (
          <button key={k} className="mp-btn" onClick={() => setFilter(k)} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, padding: "5px 11px", borderRadius: 6, background: filter === k ? `${col}20` : "rgba(255,255,255,.03)", border: `1px solid ${filter === k ? col + "55" : "rgba(255,255,255,.07)"}`, color: filter === k ? col : "#4b5563" }}>{l}</button>
        ))}
      </div>

      {params.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#374151", fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>No parameters match this filter for {cObj?.name}</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 10, marginBottom: 20 }}>
          {params.map((p) => <Gauge key={p.key} p={p} d={m[p.key]} color={cObj?.color || "#3b82f6"} />)}
        </div>
      )}

      <Card style={{ overflow: "auto" }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#374151", letterSpacing: ".12em", marginBottom: 12 }}>ALL MARKETS · MACRO HEALTH SCORECARD</div>
        <div style={{ minWidth: 640 }}>
          <div style={{ display: "grid", gridTemplateColumns: "120px repeat(6,1fr) 70px", gap: 6, marginBottom: 8 }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: "#374151" }}>COUNTRY</div>
            {PARAMS.map((p) => <div key={p.key} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7, color: "#374151", textAlign: "center" }}>{p.icon} {p.label.split(" ")[0].toUpperCase()}</div>)}
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: "#374151", textAlign: "center" }}>SCORE</div>
          </div>
          {[...countries].sort((a, b) => macro[b.id].score - macro[a.id].score).map((c) => {
            const cm = macro[c.id];
            const isA = c.id === active;
            return (
              <div key={c.id} className="mp-row" onClick={() => setActive(c.id)} style={{ display: "grid", gridTemplateColumns: "120px repeat(6,1fr) 70px", gap: 6, marginBottom: 5, padding: 8, borderRadius: 8, background: isA ? `${c.color}10` : "rgba(255,255,255,.015)", border: `1px solid ${isA ? c.color + "33" : "rgba(255,255,255,.04)"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 11 }}>{c.flag}</span>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 10, color: isA ? c.color : "#9ca3af" }}>{c.name}</span>
                </div>
                {PARAMS.map((p) => {
                  const d = cm[p.key];
                  return (
                    <div key={p.key} style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C[d.outlook], fontWeight: 600 }}>{d.current}{p.unit === "% GDP" ? "%" : p.unit}</div>
                      <div style={{ fontSize: 7, color: C[d.outlook] + "aa" }}>{I[d.outlook]}</div>
                    </div>
                  );
                })}
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 13, color: cm.score >= 65 ? "#10b981" : cm.score >= 45 ? "#f59e0b" : "#ef4444" }}>{cm.score}</div>
                  <div style={{ width: "100%", height: 3, borderRadius: 2, background: "rgba(255,255,255,.05)", marginTop: 3 }}>
                    <div style={{ height: "100%", width: `${cm.score}%`, background: cm.score >= 65 ? "#10b981" : cm.score >= 45 ? "#f59e0b" : "#ef4444", borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      <Source src={meta.source} asOf={meta.asOf} />

      {/* Country summary */}
      {(() => {
        if (!cObj || !m) return null;
        const gdp = m.gdp, inf = m.inflation, unemp = m.unemployment, debt = m.debtToGdp, fisc = m.fiscalDeficit, bond = m.bonds;
        const gdpStatus = gdp.current >= gdp.target ? "meeting its growth target" : "growing slightly below target";
        const infStatus = inf.current <= inf.target * 1.2 ? "under control" : inf.current <= inf.target * 2 ? "elevated and worth watching" : "very high — everyday items are getting expensive fast";
        const unempStatus = unemp.current <= unemp.target ? "in a healthy range" : "higher than ideal, meaning job creation needs to improve";
        const debtStatus = debt.current <= 60 ? "low, giving the government room to spend" : debt.current <= 100 ? "moderate — needs careful management" : "high — the government owes a lot relative to the economy";
        return (
          <CountrySummary country={cObj}>
            <strong>Economy:</strong> {cObj.name}'s economy is growing at {gdp.current}% — {gdpStatus} ({gdp.target}% target).{" "}
            <strong>Prices:</strong> Inflation is at {inf.current}%, which is {infStatus}.{" "}
            <strong>Jobs:</strong> Unemployment at {unemp.current}% is {unempStatus}.{" "}
            <strong>Government finances:</strong> Fiscal deficit is {fisc.current}% of GDP and debt is {debt.current}% of GDP — {debtStatus}.{" "}
            <strong>Borrowing costs:</strong> The 10-year bond yield is {bond.current}%.{" "}
            <strong>Overall:</strong> The macro health score is <strong>{m.score}/100</strong> with a <strong>{m.overallOutlook}</strong> outlook. {m.summary}
          </CountrySummary>
        );
      })()}

      <Glossary title="What do these economic terms mean?" terms={GLOSSARY} />
    </div>
  );
}
