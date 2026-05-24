// ─────────────────────────────────────────────────────────────
// TAB: Markets & FX — currencies vs USD/INR, DXY, commodities.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { api, fmtNum, fmtPct } from "../lib/api.js";
import { Card, Source, Loading } from "../components/ui.jsx";
import { Glossary, CountrySummary } from "../components/Glossary.jsx";

const FX_GLOSSARY = [
  { icon: "💱", term: "FX (Foreign Exchange)", definition: "The market where currencies are bought and sold. When you exchange Rupees for Dollars at a bank, you're participating in FX. It's the largest financial market in the world." },
  { icon: "🇺🇸", term: "USD (US Dollar)", definition: "The world's most widely used currency. Most international trade, oil, and gold are priced in USD, making it the global benchmark." },
  { icon: "💹", term: "Per USD", definition: "How many units of a currency you need to buy 1 US Dollar. For example, if INR per USD is 96.82, you need about 97 Rupees to buy 1 Dollar." },
  { icon: "🇮🇳", term: "1 Unit in ₹ (INR value)", definition: "How many Indian Rupees one unit of that currency is worth. Useful for Indian investors to understand the cost of foreign currencies." },
  { icon: "📊", term: "DXY (Dollar Index Proxy)", definition: "Measures the US Dollar's strength against 6 major world currencies. Above 100 = Dollar is strong, Below 100 = Dollar is weak. A strong dollar makes imports cheaper for Americans but hurts exporters." },
  { icon: "🛢️", term: "Brent Crude (USD/bbl)", definition: "The global benchmark price for oil, measured in Dollars per barrel (159 liters). Oil prices affect petrol, transport, food prices, and inflation. Oil-importing countries like India suffer when prices rise." },
  { icon: "🥇", term: "Gold (USD/oz)", definition: "Price of gold per troy ounce (~31 grams). Gold is a 'safe haven' — investors buy it when worried about the economy. Rising gold = more uncertainty." },
  { icon: "🔶", term: "Copper (USD/lb)", definition: "Price of copper per pound. Used in construction, electronics, and EVs. Rising copper often signals economic growth — it's called 'Dr. Copper' because it 'diagnoses' the economy." },
  { icon: "🔥", term: "Natural Gas (USD/MMBtu)", definition: "Price per million British Thermal Units. Used for heating, electricity, and cooking. Prices spike in cold winters or supply disruptions." },
  { icon: "〰️", term: "Sparkline", definition: "The small line chart showing how the price moved throughout the day. Upward slope = price rising; downward = falling." },
  { icon: "▲▼", term: "Change %", definition: "How much a commodity price changed today. Green ▲ = price went up, Red ▼ = price went down. For example, -5% on oil means it fell significantly today." },
];

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

export default function FxTab({ countries, active }) {
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

      {/* Country summary */}
      {(() => {
        const cObj = countries?.find((c) => c.id === active);
        if (!cObj) return null;
        const ccyRow = fx.rows.find((r) => r.currency === cObj.currency);
        const brent = comm.find((c) => c.id === "brent");
        const gold = comm.find((c) => c.id === "gold");
        return (
          <CountrySummary country={cObj}>
            <strong>Currency:</strong> {cObj.name} uses the <strong>{cObj.currency}</strong>.{" "}
            {ccyRow?.perUSD && <>One US Dollar currently buys {ccyRow.perUSD.toLocaleString()} {cObj.currency}.{" "}</>}
            {ccyRow?.inINR && <>One {cObj.currency} is worth ₹{ccyRow.inINR} in Indian Rupees.{" "}</>}
            {cObj.currency !== "USD" && (
              <>A stronger {cObj.currency} (lower per-USD number) makes imports cheaper for {cObj.name}, while a weaker one helps exporters.{" "}</>
            )}
            <strong>Key commodities:</strong> Brent crude oil is at ${brent?.price?.toFixed(2)}/barrel ({brent?.changePct >= 0 ? "up" : "down"} {Math.abs(brent?.changePct || 0).toFixed(1)}% today).{" "}
            Gold is at ${gold?.price?.toLocaleString()}/oz.{" "}
            {cObj.id === "india" && "India imports ~85% of its oil, so high oil prices directly increase India's trade deficit and inflation."}
            {cObj.id === "usa" && "The US is a major oil producer, so higher oil prices benefit its energy sector but increase consumer costs."}
            {cObj.id === "brazil" && "Brazil is a major commodity exporter — high commodity prices generally benefit its economy."}
          </CountrySummary>
        );
      })()}

      <Glossary title="New to currencies & commodities? Here's what it all means" terms={FX_GLOSSARY} />
    </div>
  );
}
