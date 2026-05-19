// ─────────────────────────────────────────────────────────────
// TAB: News & Risk — country-tagged headlines + sovereign ratings.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { api, timeAgo } from "../lib/api.js";
import { Card, Bar, Source, Loading } from "../components/ui.jsx";

export default function NewsTab({ countries }) {
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
    </div>
  );
}
