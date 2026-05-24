// ─────────────────────────────────────────────────────────────
// TAB: GDP Analysis — bubble chart + financial health report.
// Bubble size = total GDP, color = inflation, X = real GDP
// growth, Y = GDP per capita.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { api, fmtNum } from "../lib/api.js";
import { Card, Source, Loading } from "../components/ui.jsx";
import { Glossary, CountrySummary } from "../components/Glossary.jsx";

// ── Reference GDP data (IMF WEO Apr 2026 / World Bank) ─────
const GDP_REF = {
  usa:     { totalGdp: 29.2,  gdpPerCapita: 86800 },
  arg:     { totalGdp: 0.72,  gdpPerCapita: 15400 },
  taiwan:  { totalGdp: 0.82,  gdpPerCapita: 34800 },
  india:   { totalGdp: 4.27,  gdpPerCapita: 2950  },
  vietnam: { totalGdp: 0.50,  gdpPerCapita: 4950  },
  denmark: { totalGdp: 0.44,  gdpPerCapita: 74500 },
  brazil:  { totalGdp: 2.33,  gdpPerCapita: 10800 },
  neth:    { totalGdp: 1.12,  gdpPerCapita: 63200 },
  sweden:  { totalGdp: 0.63,  gdpPerCapita: 59500 },
  greece:  { totalGdp: 0.25,  gdpPerCapita: 23800 },
};

// Quadrant thresholds
const X_MID = 3.0;   // Real GDP growth %
const Y_MID = 30000; // GDP per capita USD

// Inflation → color (low=cool green → high=hot red)
function inflationColor(rate) {
  if (rate <= 2)   return "#4ade80"; // green
  if (rate <= 3)   return "#86efac"; // light green
  if (rate <= 4)   return "#fde047"; // yellow
  if (rate <= 5.5) return "#fbbf24"; // amber
  if (rate <= 8)   return "#f97316"; // orange
  if (rate <= 15)  return "#ef4444"; // red
  return "#991b1b";                  // dark red (hyper-inflation)
}

// Legend stops for the color bar
const COLOR_STOPS = [
  { pct: 0,   color: "#4ade80", label: "≤2%" },
  { pct: 20,  color: "#86efac", label: "3%" },
  { pct: 40,  color: "#fde047", label: "4%" },
  { pct: 60,  color: "#fbbf24", label: "5%" },
  { pct: 80,  color: "#f97316", label: "8%" },
  { pct: 100, color: "#ef4444", label: "15%+" },
];

const GLOSSARY = [
  { icon: "🫧", term: "Bubble Chart", definition: "A chart where each country is shown as a circle (bubble). The position, size, and color of each bubble tell you different things about that country's economy — you can compare all 10 countries at a glance." },
  { icon: "📏", term: "X-Axis: Real GDP Growth (%)", definition: "The horizontal position shows how fast the country's economy is growing. Further right = faster growth. Real GDP growth removes the effect of inflation to show true economic expansion." },
  { icon: "📐", term: "Y-Axis: GDP Per Capita (USD)", definition: "The vertical position shows how wealthy the average citizen is. Higher up = richer per person. It's the total economy divided by the population — a rough measure of living standards." },
  { icon: "⭕", term: "Bubble Size: Total GDP", definition: "The size of the bubble shows the total size of the country's economy in US Dollars. Bigger bubble = bigger economy. The USA has the largest economy, so its bubble is the biggest." },
  { icon: "🎨", term: "Bubble Color: Inflation Rate", definition: "The color shows how fast prices are rising. Green = low inflation (good for consumers), Yellow/Orange = moderate inflation, Red = high inflation (things are getting expensive fast)." },
  { icon: "↗️", term: "Top-Right Quadrant (Wealthy + Growing)", definition: "Countries here are the best positioned — they are both rich AND growing fast. This is the ideal spot to be." },
  { icon: "↘️", term: "Bottom-Right (Fast Growth, Lower Wealth)", definition: "Countries here are growing quickly but citizens aren't wealthy yet. These are emerging economies with potential — like India and Vietnam." },
  { icon: "↖️", term: "Top-Left (Rich but Slowing)", definition: "Countries here are wealthy but their economies aren't growing much. They might be mature economies facing headwinds." },
  { icon: "↙️", term: "Bottom-Left (Weak Position)", definition: "Countries here have both lower wealth and slower growth. They may need economic reforms or structural changes to improve." },
  { icon: "💵", term: "GDP (Gross Domestic Product)", definition: "The total value of all goods and services produced in a country in one year. It's the most common measure of an economy's size. Think of it as the country's 'annual income.'" },
  { icon: "🔥", term: "Inflation", definition: "The rate at which prices rise over time. 2-3% is healthy, above 5% starts hurting consumers. Very high inflation (like Argentina's 84%) means money loses value rapidly." },
];

// Custom tooltip
function BubbleTooltip({ active: isActive, payload }) {
  if (!isActive || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: "rgba(4,7,18,.95)", border: "1px solid rgba(255,255,255,.12)",
      borderRadius: 12, padding: "12px 14px", minWidth: 180,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{d.flag}</span>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: "#f9fafb" }}>{d.name}</span>
      </div>
      {[
        ["Real GDP Growth", `${d.x}%`],
        ["GDP Per Capita", `$${d.y.toLocaleString()}`],
        ["Total GDP", `$${d.z.toFixed(2)}T`],
        ["Inflation", `${d.inflation}%`],
      ].map(([label, val]) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 3 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#6b7280" }}>{label}</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#e5e7eb", fontWeight: 600 }}>{val}</span>
        </div>
      ))}
      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} />
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: d.color }}>
          Inflation: {d.inflation <= 3 ? "Low" : d.inflation <= 5.5 ? "Moderate" : d.inflation <= 10 ? "High" : "Very High"}
        </span>
      </div>
    </div>
  );
}

// Custom dot — flag label rendered outside the chart via overlay
function BubbleDot(props) {
  const { cx, cy, payload, activeId } = props;
  if (cx == null || cy == null) return null;
  const isActive = payload.id === activeId;
  const r = Math.max(10, Math.sqrt(payload.z) * 14);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={payload.color} fillOpacity={isActive ? 0.85 : 0.55}
        stroke={isActive ? "#f9fafb" : payload.color} strokeWidth={isActive ? 2.5 : 1}
        style={{ cursor: "pointer", transition: "all .2s" }} />
      <text x={cx} y={cy - r - 5} textAnchor="middle"
        style={{ fontSize: 11, fill: "#d1d5db", fontFamily: "'Syne',sans-serif", fontWeight: 600 }}>
        {payload.flag}
      </text>
      <text x={cx} y={cy + 3} textAnchor="middle"
        style={{ fontSize: 7.5, fill: isActive ? "#fff" : "rgba(255,255,255,.8)", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
        {payload.id.toUpperCase()}
      </text>
    </g>
  );
}

export default function StocksTab({ countries, active, setActive }) {
  const [meta, setMeta] = useState({});
  const [macro, setMacro] = useState(null);
  const [indices, setIndices] = useState(null);
  const [fx, setFx] = useState(null);
  const [sov, setSov] = useState(null);
  const [perf, setPerf] = useState(null);
  const [rates, setRates] = useState(null);

  useEffect(() => {
    api("/macro").then((r) => { setMacro(r.data); setMeta({ source: r.source, asOf: r.asOf }); }).catch(() => {});
    api("/indices").then((r) => setIndices(r.data)).catch(() => {});
    api("/fx").then((r) => setFx(r.data)).catch(() => {});
    api("/sovereign").then((r) => setSov(r.data)).catch(() => {});
    api("/performance").then((r) => setPerf(r.data)).catch(() => {});
    api("/rates").then((r) => setRates(r.data)).catch(() => {});
  }, []);

  if (!macro) return <Loading label="Loading GDP bubble chart…" />;

  const cObj = countries.find((c) => c.id === active);

  // Build scatter data
  const scatterData = countries.map((c) => {
    const m = macro[c.id];
    const ref = GDP_REF[c.id] || {};
    return {
      id: c.id, name: c.name, flag: c.flag,
      x: m?.gdp?.current || 0,
      y: ref.gdpPerCapita || 0,
      z: ref.totalGdp || 0.1,
      inflation: m?.inflation?.current || 0,
      color: inflationColor(m?.inflation?.current || 0),
      countryColor: c.color,
    };
  });

  const activePoint = scatterData.find((d) => d.id === active);

  return (
    <div style={{ animation: "mp-fade .3s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#374151", letterSpacing: ".12em" }}>
          GDP BUBBLE CHART · ALL 10 ECONOMIES · CLICK A BUBBLE TO SELECT
        </div>
      </div>

      {/* Quadrant legend strip */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {[
          { label: "↗ Wealthy + Growing", desc: "Top-Right", color: "#10b981" },
          { label: "↘ Fast Growth, Lower Wealth", desc: "Bottom-Right", color: "#3b82f6" },
          { label: "↖ Rich but Slowing", desc: "Top-Left", color: "#f59e0b" },
          { label: "↙ Weak Position", desc: "Bottom-Left", color: "#ef4444" },
        ].map((q) => (
          <div key={q.label} style={{
            fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: q.color,
            background: `${q.color}10`, border: `1px solid ${q.color}25`,
            borderRadius: 6, padding: "4px 8px",
          }}>
            {q.label}
          </div>
        ))}
      </div>

      {/* Bubble chart */}
      <Card>
        <ResponsiveContainer width="100%" height={420}>
          <ScatterChart margin={{ top: 25, right: 25, bottom: 20, left: 10 }}
            onClick={(e) => {
              if (e?.activePayload?.[0]?.payload?.id) setActive(e.activePayload[0].payload.id);
            }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />

            {/* Quadrant reference lines */}
            <ReferenceLine x={X_MID} stroke="rgba(255,255,255,.12)" strokeDasharray="6 4" />
            <ReferenceLine y={Y_MID} stroke="rgba(255,255,255,.12)" strokeDasharray="6 4" />

            <XAxis
              type="number" dataKey="x" name="Real GDP Growth"
              label={{ value: "Real GDP Growth (%)", position: "bottom", offset: 0, style: { fill: "#4b5563", fontSize: 9, fontFamily: "'JetBrains Mono',monospace" } }}
              tick={{ fill: "#4b5563", fontSize: 9, fontFamily: "'JetBrains Mono',monospace" }}
              tickLine={false} axisLine={{ stroke: "rgba(255,255,255,.08)" }}
              domain={[0, "dataMax + 1"]}
            />
            <YAxis
              type="number" dataKey="y" name="GDP Per Capita"
              label={{ value: "GDP Per Capita (USD)", angle: -90, position: "insideLeft", offset: 15, style: { fill: "#4b5563", fontSize: 9, fontFamily: "'JetBrains Mono',monospace" } }}
              tick={{ fill: "#4b5563", fontSize: 9, fontFamily: "'JetBrains Mono',monospace" }}
              tickLine={false} axisLine={{ stroke: "rgba(255,255,255,.08)" }}
              tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
              domain={[0, "dataMax + 5000"]}
              width={52}
            />
            <ZAxis type="number" dataKey="z" range={[300, 3000]} name="Total GDP" />

            <Tooltip content={<BubbleTooltip />} cursor={false} />

            <Scatter data={scatterData} shape={(props) => <BubbleDot {...props} activeId={active} />}>
              {scatterData.map((d) => (
                <Cell key={d.id} fill={d.color} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* Inflation color legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, justifyContent: "center" }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#4b5563" }}>INFLATION:</span>
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {COLOR_STOPS.map((s, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 30, height: 8, background: s.color, borderRadius: i === 0 ? "4px 0 0 4px" : i === COLOR_STOPS.length - 1 ? "0 4px 4px 0" : 0 }} />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7, color: "#4b5563", marginTop: 2 }}>{s.label}</span>
              </div>
            ))}
          </div>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#4b5563" }}>BUBBLE SIZE = TOTAL GDP</span>
        </div>
      </Card>

      {/* Country detail cards — all 10 in a compact row */}
      <div style={{ marginTop: 14, fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#374151", letterSpacing: ".12em", marginBottom: 8 }}>
        GDP SNAPSHOT · ALL 10 ECONOMIES
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 7, marginBottom: 8 }}>
        {[...scatterData].sort((a, b) => b.z - a.z).map((d) => {
          const isA = d.id === active;
          const c = countries.find((c) => c.id === d.id);
          return (
            <Card key={d.id} accent={isA ? `${c?.color}44` : "rgba(255,255,255,.06)"}
              className="mp-row" onClick={() => setActive(d.id)}
              style={{ cursor: "pointer", padding: 10, background: isA ? `${c?.color}0c` : undefined }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                <span style={{ fontSize: 13 }}>{d.flag}</span>
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 10, color: isA ? "#f9fafb" : "#9ca3af" }}>{d.name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5 }}>
                <span style={{ color: "#4b5563" }}>GDP</span>
                <span style={{ color: "#e5e7eb", fontWeight: 600 }}>${d.z.toFixed(2)}T</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5 }}>
                <span style={{ color: "#4b5563" }}>Growth</span>
                <span style={{ color: d.x >= X_MID ? "#10b981" : "#f59e0b" }}>{d.x}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5 }}>
                <span style={{ color: "#4b5563" }}>Per Capita</span>
                <span style={{ color: "#e5e7eb" }}>${(d.y / 1000).toFixed(1)}k</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5 }}>
                <span style={{ color: "#4b5563" }}>Inflation</span>
                <span style={{ color: d.color }}>{d.inflation}%</span>
              </div>
            </Card>
          );
        })}
      </div>
      <Source src={meta.source + " + IMF WEO GDP reference"} asOf={meta.asOf} />

      {/* Country summary */}
      {(() => {
        if (!cObj || !activePoint) return null;
        const quadrant =
          activePoint.x >= X_MID && activePoint.y >= Y_MID ? "top-right (wealthy + growing) — the strongest position"
          : activePoint.x >= X_MID && activePoint.y < Y_MID ? "bottom-right (fast growth, lower wealth) — an emerging economy with strong momentum"
          : activePoint.x < X_MID && activePoint.y >= Y_MID ? "top-left (rich but slowing) — a mature economy that may need new growth engines"
          : "bottom-left (weak position) — facing challenges on both growth and wealth";
        return (
          <CountrySummary country={cObj}>
            <strong>Position:</strong> {cObj.name} sits in the <strong>{quadrant}</strong>.{" "}
            Its economy produces <strong>${activePoint.z.toFixed(2)} trillion</strong> per year (total GDP), with each citizen earning roughly <strong>${activePoint.y.toLocaleString()}</strong> per year (GDP per capita).{" "}
            The economy is growing at <strong>{activePoint.x}%</strong> per year.{" "}
            Inflation is at <strong>{activePoint.inflation}%</strong>, which is {activePoint.inflation <= 3 ? "low and well-controlled — good news for consumers" : activePoint.inflation <= 5.5 ? "moderate — worth watching but not alarming" : activePoint.inflation <= 10 ? "elevated — the cost of living is rising noticeably" : "very high — money is losing value rapidly, making daily life more expensive"}.{" "}
            The bubble size shows {cObj.name} has the {[...scatterData].sort((a, b) => b.z - a.z).findIndex((d) => d.id === active) + 1}{["st","nd","rd"][([...scatterData].sort((a, b) => b.z - a.z).findIndex((d) => d.id === active))] || "th"} largest economy among these 10 countries.
          </CountrySummary>
        );
      })()}

      {/* ── Comprehensive Financial Health Report (kept from previous version) ── */}
      {(() => {
        if (!cObj || !macro || !macro[active]) return null;
        const m = macro[active];
        const idx = indices?.find((i) => i.id === active);
        const ccyRow = fx?.rows?.find((r) => r.currency === cObj.currency);
        const sovData = sov?.find((s) => s.id === active);
        const perfMeta = perf?.meta?.[active];
        const perfHist = perf?.history;
        const rateData = rates?.find((r) => r.id === active);
        const fc = perf?.forecast?.[active];
        const lastHist = perfHist?.[perfHist.length - 1];
        const fcLast = fc?.[fc.length - 1];

        const signals = [];
        let positives = 0, negatives = 0;
        if (m.gdp?.outlook === "bullish") { positives++; signals.push("GDP growth is strong"); }
        else if (m.gdp?.outlook === "bearish") { negatives++; signals.push("GDP growth is weak"); }
        if (m.inflation?.outlook === "bullish") { positives++; signals.push("inflation is under control"); }
        else if (m.inflation?.outlook === "bearish") { negatives++; signals.push("inflation is high"); }
        if (m.unemployment?.outlook === "bullish") { positives++; signals.push("job market is healthy"); }
        else if (m.unemployment?.outlook === "bearish") { negatives++; signals.push("unemployment is a concern"); }
        if (m.fiscalDeficit?.outlook === "bullish") { positives++; signals.push("government spending is disciplined"); }
        else if (m.fiscalDeficit?.outlook === "bearish") { negatives++; signals.push("government deficit is widening"); }
        if (m.debtToGdp?.outlook === "bullish") { positives++; signals.push("national debt is manageable"); }
        else if (m.debtToGdp?.outlook === "bearish") { negatives++; signals.push("debt levels are concerning"); }
        if (rateData?.bias === "cutting") { positives++; signals.push("central bank is cutting rates (supports growth)"); }
        else if (rateData?.bias === "hiking") { negatives++; signals.push("central bank is hiking rates (slows growth)"); }

        const outlook6m = positives > negatives + 1 ? "positive" : positives > negatives ? "moderately positive" : positives === negatives ? "mixed" : negatives > positives + 1 ? "negative" : "moderately cautious";
        const outlookColor = outlook6m.includes("positive") ? "#10b981" : outlook6m === "mixed" ? "#f59e0b" : "#ef4444";
        const outlookEmoji = outlook6m.includes("positive") ? "📈" : outlook6m === "mixed" ? "⚖️" : "📉";

        return (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#374151", letterSpacing: ".12em", marginBottom: 10 }}>
              {cObj.flag} COMPREHENSIVE FINANCIAL HEALTH REPORT · {cObj.name.toUpperCase()}
            </div>
            <Card accent={`${cObj.color}28`} style={{ background: `${cObj.color}06` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                <span style={{ fontSize: 28 }}>{cObj.flag}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: "#f9fafb" }}>{cObj.name} — Financial Health Report Card</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#4b5563", marginTop: 2 }}>Aggregated analysis from all dashboard data · Not financial advice</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, color: m.score >= 65 ? "#10b981" : m.score >= 45 ? "#f59e0b" : "#ef4444" }}>{m.score}/100</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: "#4b5563" }}>MACRO SCORE</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 8, marginBottom: 16 }}>
                {[
                  { label: "Stock Market", value: idx ? idx.price?.toLocaleString() : "—", sub: idx ? `${idx.changePct >= 0 ? "+" : ""}${idx.changePct?.toFixed(2)}% today` : "", color: idx?.changePct >= 0 ? "#10b981" : "#ef4444" },
                  { label: "GDP Growth", value: `${m.gdp?.current}%`, sub: `Target: ${m.gdp?.target}%`, color: m.gdp?.outlook === "bullish" ? "#10b981" : m.gdp?.outlook === "neutral" ? "#f59e0b" : "#ef4444" },
                  { label: "Inflation", value: `${m.inflation?.current}%`, sub: `Target: ${m.inflation?.target}%`, color: m.inflation?.outlook === "bullish" ? "#10b981" : m.inflation?.outlook === "neutral" ? "#f59e0b" : "#ef4444" },
                  { label: "Currency", value: ccyRow ? `${ccyRow.perUSD} / USD` : "—", sub: cObj.currency, color: cObj.color },
                  { label: "Credit Rating", value: sovData?.sp || "—", sub: sovData ? `Score: ${sovData.score}/100` : "", color: sovData?.score >= 70 ? "#10b981" : sovData?.score >= 55 ? "#3b82f6" : "#f59e0b" },
                  { label: "Policy Rate", value: rateData ? `${rateData.rate}%` : "—", sub: rateData ? (rateData.bias === "cutting" ? "Cutting" : rateData.bias === "hiking" ? "Hiking" : "On Hold") : "", color: rateData?.bias === "cutting" ? "#10b981" : rateData?.bias === "hiking" ? "#ef4444" : "#f59e0b" },
                  { label: "10Y Return", value: perfMeta ? `+${perfMeta.totalGain}%` : "—", sub: perfMeta ? `${perfMeta.annualized}% CAGR` : "", color: "#4ade80" },
                  { label: "Debt-to-GDP", value: `${m.debtToGdp?.current}%`, sub: `Target: ${m.debtToGdp?.target}%`, color: m.debtToGdp?.outlook === "bullish" ? "#10b981" : m.debtToGdp?.outlook === "neutral" ? "#f59e0b" : "#ef4444" },
                ].map((item) => (
                  <div key={item.label} style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 10, padding: "10px 10px", textAlign: "center" }}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: "#4b5563", letterSpacing: ".08em", marginBottom: 4 }}>{item.label.toUpperCase()}</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, color: item.color }}>{item.value}</div>
                    {item.sub && <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: "#4b5563", marginTop: 2 }}>{item.sub}</div>}
                  </div>
                ))}
              </div>

              <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 10, padding: 14, marginBottom: 14 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: "#f9fafb", marginBottom: 8 }}>📋 Current Financial Situation (in simple words)</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 11.5, color: "#d1d5db", lineHeight: 1.75 }}>
                  {cObj.name}'s economy is currently growing at <strong>{m.gdp?.current}%</strong>
                  {m.gdp?.current >= m.gdp?.target ? " — meeting its growth target, which is a positive sign" : ` — slightly below its ${m.gdp?.target}% target`}.{" "}
                  Inflation stands at <strong>{m.inflation?.current}%</strong>
                  {m.inflation?.current <= m.inflation?.target * 1.2 ? ", which is well managed and close to the target" : m.inflation?.current <= m.inflation?.target * 2 ? ", somewhat above target meaning everyday items are getting slightly pricier" : ", which is very high — the cost of living is rising rapidly"}.{" "}
                  The job market shows an unemployment rate of <strong>{m.unemployment?.current}%</strong>
                  {m.unemployment?.current <= m.unemployment?.target ? " — healthier than target, meaning most people who want jobs can find them" : " — higher than ideal, indicating the economy needs to create more jobs"}.{" "}
                  {idx && <>The stock market ({cObj.indexName}) is at <strong>{idx.price?.toLocaleString()}</strong>, {idx.changePct >= 0 ? "up" : "down"} {Math.abs(idx.changePct).toFixed(2)}% today.{" "}</>}
                  {sovData && <>International rating agencies rate {cObj.name} as <strong>{sovData.grade}</strong> (score {sovData.score}/100), meaning {sovData.score >= 70 ? "it's considered a very safe place to invest" : sovData.score >= 55 ? "it's considered a reliable investment destination" : sovData.score >= 40 ? "it has some risk factors that investors should consider" : "investors view it as higher risk, demanding higher returns"}.{" "}</>}
                  {rateData && <>The central bank ({rateData.bank}) has its policy rate at {rateData.rate}% and is currently {rateData.bias === "cutting" ? "cutting rates to stimulate growth" : rateData.bias === "hiking" ? "raising rates to control inflation" : "holding rates steady"}.{" "}</>}
                  {perfMeta && <>Over the past 10 years, an investment of $100 in {cObj.name}'s market would now be worth approximately ${lastHist?.[active] || "—"} — a total gain of +{perfMeta.totalGain}%.{" "}</>}
                  {m.summary}
                </div>
              </div>

              <div style={{ background: `${outlookColor}0a`, border: `1px solid ${outlookColor}22`, borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 16 }}>{outlookEmoji}</span>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: "#f9fafb" }}>6-Month Outlook: <span style={{ color: outlookColor, textTransform: "uppercase" }}>{outlook6m}</span></div>
                </div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 11.5, color: "#d1d5db", lineHeight: 1.75, marginBottom: 10 }}>
                  Based on all available data, {cObj.name}'s financial outlook for the next 6 months is <strong style={{ color: outlookColor }}>{outlook6m}</strong>.{" "}
                  {fcLast && lastHist && <>The forecast model projects the market performance index to reach {fcLast.v} (from current {lastHist[active]}), with a range of {fcLast.lo} to {fcLast.hi}.{" "}</>}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#9ca3af", marginBottom: 6 }}>Key factors driving this assessment:</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {signals.map((s, i) => {
                    const isPositive = ["strong", "control", "healthy", "disciplined", "manageable", "cutting"].some(w => s.includes(w));
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Syne',sans-serif", fontSize: 11, color: isPositive ? "#10b981" : "#ef4444" }}>
                        <span>{isPositive ? "✅" : "⚠️"}</span> {s.charAt(0).toUpperCase() + s.slice(1)}
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 10, fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#4b556388", lineHeight: 1.6 }}>
                  ⚠ This is a simplified assessment based on available macro data, not professional investment advice. Always consult a qualified financial advisor before making investment decisions.
                </div>
              </div>
            </Card>
          </div>
        );
      })()}

      <Glossary title="What do the GDP bubble chart terms mean?" terms={GLOSSARY} />
    </div>
  );
}
