// ─────────────────────────────────────────────────────────────
// Small shared presentational components.
// ─────────────────────────────────────────────────────────────

import { COLORS, ICON } from "../lib/api.js";

export function Pulse({ color = "#10b981" }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8, flexShrink: 0 }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, opacity: 0.35, animation: "mp-ping 1.4s cubic-bezier(0,0,.2,1) infinite" }} />
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, position: "relative" }} />
    </span>
  );
}

export function OutlookTag({ outlook, label }) {
  const c = COLORS[outlook] || "#6b7280";
  return (
    <span style={{
      fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: c,
      background: `${c}18`, border: `1px solid ${c}33`, borderRadius: 5,
      padding: "2px 7px", letterSpacing: ".06em", whiteSpace: "nowrap",
    }}>
      {ICON[outlook] || "●"} {label || (outlook || "").toUpperCase()}
    </span>
  );
}

export function Bar({ value, color, height = 5 }) {
  return (
    <div style={{ position: "relative", height, borderRadius: 3, background: "rgba(255,255,255,.06)", overflow: "hidden", width: "100%" }}>
      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${Math.max(0, Math.min(100, value))}%`, background: `linear-gradient(90deg,${color}66,${color})`, borderRadius: 3, transition: "width 1s ease" }} />
    </div>
  );
}

export function Card({ children, accent = "rgba(255,255,255,.06)", style = {}, ...rest }) {
  return (
    <div
      {...rest}
      style={{
        background: "rgba(255,255,255,.02)",
        border: `1px solid ${accent}`,
        borderRadius: 14,
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Source({ src, asOf }) {
  return (
    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: "#2a3441", marginTop: 8, lineHeight: 1.6 }}>
      Source: {src}{asOf ? ` · as of ${new Date(asOf).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}` : ""}
    </div>
  );
}

export function Loading({ label }) {
  return (
    <div style={{ textAlign: "center", padding: "50px 20px" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 3, marginBottom: 18 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ width: 3, height: 24, borderRadius: 2, background: "#6366f1", opacity: 0.5, animation: `mp-ping ${0.5 + i * 0.1}s ease-in-out infinite alternate` }} />
        ))}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#4b5563", letterSpacing: ".12em" }}>{label || "Loading…"}</div>
    </div>
  );
}

export function GlobalStyles() {
  return (
    <style>{`
      @keyframes mp-ping{0%{transform:scale(1);opacity:.35}75%,100%{transform:scale(2.4);opacity:0}}
      @keyframes mp-fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
      @keyframes mp-spin{to{transform:rotate(360deg)}}
      @keyframes mp-grad{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
      @keyframes mp-shimmer{0%{left:-30%}100%{left:100%}}
      .mp-tab{transition:all .18s;cursor:pointer;border:none;background:none}
      .mp-tab:hover{color:#f9fafb !important}
      .mp-chip{transition:all .16s;cursor:pointer}
      .mp-chip:hover{transform:translateY(-2px)}
      .mp-row{transition:all .15s;cursor:pointer}
      .mp-btn{transition:all .15s;cursor:pointer}
      .mp-btn:hover{opacity:.82;transform:scale(1.02)}
      ::-webkit-scrollbar{width:4px;height:4px}
      ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:2px}
      a{color:#818cf8;text-decoration:none}
      a:hover{text-decoration:underline}
    `}</style>
  );
}
