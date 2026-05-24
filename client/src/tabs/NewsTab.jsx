// ─────────────────────────────────────────────────────────────
// TAB: News & Risk — country-tagged headlines + sovereign ratings.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { api, timeAgo } from "../lib/api.js";
import { Card, Bar, Source, Loading } from "../components/ui.jsx";
import { Glossary, CountrySummary } from "../components/Glossary.jsx";

const GLOSSARY = [
  { icon: "📊", term: "Sovereign Credit Rating", definition: "A grade given to a country by rating agencies, showing how likely the country is to repay its debts. Higher ratings (like AAA) mean very safe; lower ratings (like B) mean higher risk. Think of it as a country's 'credit score.'" },
  { icon: "🏛️", term: "S&P / Moody's / Fitch", definition: "The three most important credit rating agencies in the world. They independently evaluate every country's financial health and assign letter grades. Their opinions heavily influence how cheaply a country can borrow money." },
  { icon: "🅰️", term: "AAA (Triple A)", definition: "The highest possible credit rating. Only a handful of very financially stable countries earn this (like Germany, Denmark, Netherlands). It means investors consider lending to this country almost risk-free." },
  { icon: "📈", term: "Investment Grade (BBB- and above)", definition: "Ratings from BBB- up to AAA. Countries in this range are considered safe enough for large institutional investors (pension funds, insurance companies) to invest in." },
  { icon: "⚠️", term: "Speculative/Junk Grade (below BBB-)", definition: "Ratings below BBB- (like BB, B, CCC). These countries are considered riskier — they might struggle to repay debts. They must offer higher interest rates to attract lenders." },
  { icon: "📉", term: "Default Risk Score", definition: "A numerical score (0-100) representing how likely a country is to default (fail to repay debt). Higher score = safer. The bar chart visually shows this — longer green bars are better." },
  { icon: "🔴🟢", term: "Rating Colors", definition: "Green = very safe (score 70+), Blue = safe (55-70), Yellow = moderate risk (40-55), Red = high risk (below 40). These help you quickly identify which countries are financially healthiest." },
  { icon: "📰", term: "Headlines & Geopolitics", definition: "Latest news articles related to the economies and markets of these 10 countries. Geopolitical events (wars, trade disputes, elections) can significantly impact stock markets and currencies." },
  { icon: "🏳️", term: "Country Filter", definition: "Click on a country's flag to see only news headlines related to that country. Click 'ALL' to see all headlines." },
];

export default function NewsTab({ countries, active }) {
  const [news, setNews] = useState(null);
  const [sov, setSov] = useState(null);
  const [nMeta, setNMeta] = useState({});
  const [sMeta, setSMeta] = useState({});
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api("/news").then((r) => { setNews(r.data); setNMeta({ source: r.source, asOf: r.asOf, needsKey: r.needsKey }); }).catch(() => setNews([]));
    api("/sovereign").then((r) => { setSov(r.data); setSMeta({ source: r.source, asOf: r.asOf }); }).catch(() => {});
  }, []);

  if (!sov) return <Loading label="Loading risk data & headlines…" />;

  const flagOf = (id) => countries.find((c) => c.id === id)?.flag || "🌐";
  const filtered = (news || []).filter((n) => filter === "all" || n.country === filter);

  return (
    <div style={{ animation: "mp-fade .3s ease" }}>
      {/* Sovereign ratings */}
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#374151", letterSpacing: ".12em", marginBottom: 10 }}>
        SOVEREIGN CREDIT RATINGS · S&P / MOODY'S / FITCH · DEFAULT-RISK GAUGE
      </div>
      <Card style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...sov].sort((a, b) => b.score - a.score).map((s) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, width: 20 }}>{s.flag}</span>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 11, color: "#d1d5db", width: 92, flexShrink: 0 }}>{s.name}</span>
              <div style={{ display: "flex", gap: 4, width: 150, flexShrink: 0 }}>
                {[["S&P", s.sp], ["Mdy", s.moodys], ["Fch", s.fitch]].map(([lab, val]) => (
                  <span key={lab} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#9ca3af", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 3, padding: "1px 5px" }}>{lab} {val}</span>
                ))}
              </div>
              <div style={{ flex: 1 }}><Bar value={s.score} color={s.score >= 70 ? "#10b981" : s.score >= 55 ? "#3b82f6" : s.score >= 40 ? "#f59e0b" : "#ef4444"} /></div>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: s.score >= 70 ? "#10b981" : s.score >= 55 ? "#3b82f6" : s.score >= 40 ? "#f59e0b" : "#ef4444", width: 130, textAlign: "right", flexShrink: 0 }}>{s.grade}</span>
            </div>
          ))}
        </div>
      </Card>
      <Source src={sMeta.source} asOf={sMeta.asOf} />

      {/* News */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, margin: "20px 0 10px" }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#374151", letterSpacing: ".12em" }}>HEADLINES & GEOPOLITICS</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <button className="mp-btn" onClick={() => setFilter("all")} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, padding: "4px 9px", borderRadius: 5, background: filter === "all" ? "rgba(99,102,241,.2)" : "rgba(255,255,255,.03)", border: `1px solid ${filter === "all" ? "#6366f155" : "rgba(255,255,255,.07)"}`, color: filter === "all" ? "#818cf8" : "#4b5563" }}>ALL</button>
          {countries.map((c) => (
            <button key={c.id} className="mp-btn" onClick={() => setFilter(c.id)} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, padding: "4px 7px", borderRadius: 5, background: filter === c.id ? `${c.color}22` : "rgba(255,255,255,.03)", border: `1px solid ${filter === c.id ? c.color + "55" : "rgba(255,255,255,.07)"}`, color: filter === c.id ? c.color : "#4b5563" }}>{c.flag}</button>
          ))}
        </div>
      </div>

      {nMeta.needsKey ? (
        <Card accent="rgba(245,158,11,.3)">
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, color: "#fbbf24", lineHeight: 1.6 }}>
            📰 Live news feed is off. Add a free <strong>NEWS_API_KEY</strong> (newsapi.org) to <code>server/.env</code> and restart the backend to enable country-tagged headlines &amp; geopolitical risk signals.
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 30, color: "#374151", fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>No headlines for this filter right now</div>
      ) : (
        <Card>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filtered.slice(0, 25).map((n, i) => (
              <a key={i} href={n.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 6px", borderBottom: i < Math.min(filtered.length, 25) - 1 ? "1px solid rgba(255,255,255,.04)" : "none" }}>
                <span style={{ fontSize: 13, width: 20, flexShrink: 0 }}>{n.country ? flagOf(n.country) : "🌐"}</span>
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 500, fontSize: 11.5, color: "#d1d5db", flex: 1, lineHeight: 1.4 }}>{n.title}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: "#4b5563", flexShrink: 0, textAlign: "right" }}>
                  {n.source}<br />{timeAgo(n.publishedAt)}
                </span>
              </a>
            ))}
          </div>
        </Card>
      )}
      <Source src={nMeta.source} asOf={nMeta.asOf} />

      {/* Country summary */}
      {(() => {
        const cObj = countries?.find((c) => c.id === active);
        if (!cObj || !sov) return null;
        const s = sov.find((sv) => sv.id === active);
        if (!s) return null;
        const gradeQuality = s.score >= 70 ? "very good — considered one of the safest countries to invest in" : s.score >= 55 ? "solid — considered safe for investment (investment grade)" : s.score >= 40 ? "moderate — some risk factors that investors should watch" : "lower — considered riskier, meaning the country pays higher interest to borrow";
        const newsCount = (news || []).filter((n) => n.country === active).length;
        return (
          <CountrySummary country={cObj}>
            <strong>Credit Rating:</strong> {cObj.name} is rated <strong>{s.sp}</strong> by S&P, <strong>{s.moodys}</strong> by Moody's, and <strong>{s.fitch}</strong> by Fitch. This gives it a risk score of <strong>{s.score}/100</strong>, classified as <strong>"{s.grade}"</strong>.{" "}
            In simple terms, {cObj.name}'s credit standing is {gradeQuality}.{" "}
            A good credit rating means the country can borrow money at lower interest rates, which helps fund infrastructure, healthcare, and other public services.{" "}
            {newsCount > 0 ? `There are currently ${newsCount} recent news headlines related to ${cObj.name} in the feed.` : `No specific headlines for ${cObj.name} at the moment.`}
          </CountrySummary>
        );
      })()}

      <Glossary title="What do credit ratings & risk terms mean?" terms={GLOSSARY} />
    </div>
  );
}
