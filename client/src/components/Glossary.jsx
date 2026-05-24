// ─────────────────────────────────────────────────────────────
// Collapsible glossary section — explains financial terms
// in simple words for beginners.
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { Card } from "./ui.jsx";

export function Glossary({ title, terms }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 22 }}>
      <div
        onClick={() => setOpen(!open)}
        className="mp-btn"
        style={{
          display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
          padding: "10px 14px", borderRadius: 10, width: "100%",
          background: open ? "rgba(99,102,241,.1)" : "rgba(99,102,241,.04)",
          border: "1px solid rgba(99,102,241,.18)",
        }}
      >
        <span style={{ fontSize: 14 }}>📖</span>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: "#a5b4fc", flex: 1, textAlign: "left" }}>
          {title || "What do these terms mean? (Beginner's Guide)"}
        </span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#818cf8", letterSpacing: ".08em" }}>
          {open ? "▲ HIDE" : "▼ SHOW"}
        </span>
      </div>
      {open && (
        <Card accent="rgba(99,102,241,.12)" style={{ marginTop: 8, animation: "mp-fade .3s ease" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
            {terms.map((t) => (
              <div key={t.term} style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(99,102,241,.04)", border: "1px solid rgba(99,102,241,.08)" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 11.5, color: "#e5e7eb", marginBottom: 3 }}>
                  {t.icon ? `${t.icon} ` : ""}{t.term}
                </div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, color: "#9ca3af", lineHeight: 1.65 }}>
                  {t.definition}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export function CountrySummary({ country, children }) {
  if (!country || !children) return null;
  return (
    <Card accent={`${country.color}22`} style={{ marginTop: 16, background: `${country.color}08` }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>{country.flag}</span>
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: "#f9fafb", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <span>{country.name} — What This Data Tells You</span>
          </div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 11.5, color: "#d1d5db", lineHeight: 1.75 }}>
            {children}
          </div>
        </div>
      </div>
    </Card>
  );
}
