// ─────────────────────────────────────────────────────────────
// MacroPulse Global — root app shell.
// Country chips + tab nav + header KPIs. Each tab is lazy-rendered.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { api } from "./lib/api.js";
import { GlobalStyles, Pulse, OutlookTag } from "./components/ui.jsx";
import IndicesTab from "./tabs/IndicesTab.jsx";
import ChartTab from "./tabs/ChartTab.jsx";
import MacroTab from "./tabs/MacroTab.jsx";
import FxTab from "./tabs/FxTab.jsx";
import RatesTab from "./tabs/RatesTab.jsx";
import NewsTab from "./tabs/NewsTab.jsx";
import StocksTab from "./tabs/StocksTab.jsx";
import FlowsTab from "./tabs/FlowsTab.jsx";

const TABS = [
  { id: "indices", label: "📊 Live Indices" },
  { id: "chart", label: "📈 Chart & Forecast" },
  { id: "macro", label: "🏛 Macro Economics" },
  { id: "fx", label: "💱 Markets & FX" },
  { id: "rates", label: "🏦 Rates & Calendar" },
  { id: "news", label: "📰 News & Risk" },
  { id: "stocks", label: "🫧 GDP & Report" },
  { id: "flows", label: "🔥 Investment Flows" },
];

export default function App() {
  const [countries, setCountries] = useState([]);
  const [active, setActive] = useState("usa");
  const [tab, setTab] = useState("indices");
  const [health, setHealth] = useState(null);
  const [macro, setMacro] = useState(null);
  const [perfMeta, setPerfMeta] = useState(null);

  useEffect(() => {
    api("/countries").then((r) => setCountries(r.data)).catch(() => {});
    api("/health").then(setHealth).catch(() => setHealth({ ok: false }));
    api("/macro").then((r) => setMacro(r.data)).catch(() => {});
    api("/performance").then((r) => setPerfMeta(r.data?.meta)).catch(() => {});
  }, []);

  if (!countries.length) {
    return (
      <div style={{ minHeight: "100vh", background: "#04060f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GlobalStyles />
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", gap: 3, justifyContent: "center", marginBottom: 16 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ width: 3, height: 26, borderRadius: 2, background: "#6366f1", opacity: 0.5, animation: `mp-ping ${0.5 + i * 0.1}s ease-in-out infinite alternate` }} />
            ))}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#4b5563", letterSpacing: ".15em" }}>
            CONNECTING TO MACROPULSE BACKEND…
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, color: "#2a3441", marginTop: 8 }}>
            Is the server running on :8787? (cd server &amp;&amp; npm run dev)
          </div>
        </div>
      </div>
    );
  }

  const cObj = countries.find((c) => c.id === active);
  const m = macro?.[active];
  const pm = perfMeta?.[active];

  return (
    <div style={{ minHeight: "100vh", background: "#04060f", color: "#e5e7eb", fontFamily: "'Syne',sans-serif" }}>
      <GlobalStyles />

      {/* TOPBAR */}
      <div style={{ background: "rgba(255,255,255,.018)", borderBottom: "1px solid rgba(255,255,255,.055)", padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(12px)" }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, color: "#2d3748", letterSpacing: ".22em", marginBottom: 3 }}>
            TOP 10 ECONOMIES · ONE-STOP MACRO & MARKET TERMINAL
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(17px,2.4vw,24px)", margin: 0, lineHeight: 1.1, background: "linear-gradient(120deg,#f9fafb 0%,#60a5fa 45%,#a78bfa 100%)", backgroundSize: "200% 200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "mp-grad 5s ease infinite" }}>
            MacroPulse Global
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: health?.ok ? "rgba(16,185,129,.1)" : "rgba(239,68,68,.1)", border: `1px solid ${health?.ok ? "rgba(16,185,129,.25)" : "rgba(239,68,68,.25)"}`, borderRadius: 20, padding: "5px 12px" }}>
          {health?.ok ? <Pulse /> : <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444" }} />}
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: health?.ok ? "#10b981" : "#f87171", letterSpacing: ".08em" }}>
            {health?.ok ? "BACKEND LIVE" : "BACKEND OFFLINE"}
          </span>
        </div>
      </div>

      <div style={{ padding: "16px 18px 48px", maxWidth: 1240, margin: "0 auto" }}>
        {/* COUNTRY CHIPS */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
          {countries.map((c) => {
            const cm = macro?.[c.id];
            const isA = active === c.id;
            return (
              <div key={c.id} className="mp-chip" onClick={() => setActive(c.id)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 10, background: isA ? `${c.color}1e` : "rgba(255,255,255,.025)", border: `1.5px solid ${isA ? c.color + "77" : "rgba(255,255,255,.065)"}`, boxShadow: isA ? `0 0 20px ${c.color}18` : "none" }}>
                <span style={{ fontSize: 13 }}>{c.flag}</span>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 10, color: isA ? "#f9fafb" : "#6b7280" }}>{c.name}</div>
                  {cm && (
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: cm.score >= 65 ? "#10b981" : cm.score >= 45 ? "#f59e0b" : "#ef4444", marginTop: 1 }}>
                      {cm.score}% MACRO
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ACTIVE COUNTRY HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 14, background: "rgba(255,255,255,.018)", border: `1px solid ${cObj?.color}22`, borderRadius: 14, padding: "14px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 30 }}>{cObj?.flag}</span>
            <div>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: "#f9fafb", lineHeight: 1, margin: 0 }}>{cObj?.name}</h2>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#4b5563", marginTop: 2 }}>
                {cObj?.indexName} · {cObj?.currency} · {cObj?.centralBank}
              </div>
            </div>
            {m && <OutlookTag outlook={m.overallOutlook} label={`${(m.overallOutlook || "").toUpperCase()} MACRO`} />}
          </div>
          {pm && (
            <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
              {[
                { l: "10Y CAGR", v: `${pm.annualized}%`, c: cObj?.color },
                { l: "10Y TOTAL", v: `+${pm.totalGain}%`, c: "#4ade80" },
                { l: "MACRO", v: m ? `${m.score}/100` : "—", c: m && m.score >= 65 ? "#10b981" : "#f59e0b" },
              ].map(({ l, v, c }) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: "#374151", letterSpacing: ".1em", marginBottom: 2 }}>{l}</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, color: c }}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: 3, marginBottom: 16, background: "rgba(255,255,255,.025)", borderRadius: 10, padding: 4, flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <button key={t.id} className="mp-tab" onClick={() => setTab(t.id)} style={{ padding: "7px 13px", borderRadius: 7, fontSize: 10, fontFamily: "'Syne',sans-serif", fontWeight: 700, letterSpacing: ".02em", color: tab === t.id ? "#f9fafb" : "#4b5563", background: tab === t.id ? `${cObj?.color}2e` : "transparent", border: tab === t.id ? `1px solid ${cObj?.color}44` : "1px solid transparent" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB BODY */}
        {tab === "indices" && <IndicesTab countries={countries} active={active} />}
        {tab === "chart" && <ChartTab countries={countries} active={active} setActive={setActive} />}
        {tab === "macro" && <MacroTab countries={countries} active={active} setActive={setActive} />}
        {tab === "fx" && <FxTab countries={countries} active={active} />}
        {tab === "rates" && <RatesTab countries={countries} active={active} />}
        {tab === "news" && <NewsTab countries={countries} active={active} />}
        {tab === "stocks" && <StocksTab countries={countries} active={active} setActive={setActive} />}
        {tab === "flows" && <FlowsTab />}

        {/* FOOTER */}
        <div style={{ marginTop: 24, borderTop: "1px solid rgba(255,255,255,.04)", paddingTop: 14, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: "#1a202c", lineHeight: 1.8 }}>
            MacroPulse Global v3.1 · Data: World Bank · IMF WEO · open.er-api.com · Twelve Data · FMP · NewsAPI · S&P/Moody's/Fitch · Each figure carries its source. Not financial advice.
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: "#1a202c" }}>
            Backend caches & proxies all feeds · Add API keys in server/.env for full live data
          </div>
        </div>
      </div>
    </div>
  );
}
