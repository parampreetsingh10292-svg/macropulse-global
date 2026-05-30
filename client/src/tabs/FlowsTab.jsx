// ─────────────────────────────────────────────────────────────
// TAB: Investment Flows — Country × Sector capital flow matrix.
// Simulated live feed showing FII / DII / RI flows.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState, useRef, useCallback, useMemo } from "react";

// ─── Constants ───────────────────────────────────────────────

const FLOW_COUNTRIES = [
  { id: "usa",    name: "USA",         iso: "US", flag: "\u{1F1FA}\u{1F1F8}", color: "#3b82f6", idx: "S&P 500" },
  { id: "india",  name: "India",       iso: "IN", flag: "\u{1F1EE}\u{1F1F3}", color: "#f97316", idx: "NIFTY 50" },
  { id: "taiwan", name: "Taiwan",      iso: "TW", flag: "\u{1F1F9}\u{1F1FC}", color: "#10b981", idx: "TAIEX" },
  { id: "vietnam",name: "Vietnam",     iso: "VN", flag: "\u{1F1FB}\u{1F1F3}", color: "#8b5cf6", idx: "VN-Index" },
  { id: "neth",   name: "Netherlands", iso: "NL", flag: "\u{1F1F3}\u{1F1F1}", color: "#a78bfa", idx: "AEX" },
  { id: "denmark",name: "Denmark",     iso: "DK", flag: "\u{1F1E9}\u{1F1F0}", color: "#ec4899", idx: "OMX Cph 25" },
  { id: "sweden", name: "Sweden",      iso: "SE", flag: "\u{1F1F8}\u{1F1EA}", color: "#fb923c", idx: "OMX Stk 30" },
  { id: "brazil", name: "Brazil",      iso: "BR", flag: "\u{1F1E7}\u{1F1F7}", color: "#14b8a6", idx: "Bovespa" },
  { id: "greece", name: "Greece",      iso: "GR", flag: "\u{1F1EC}\u{1F1F7}", color: "#34d399", idx: "Athens General" },
  { id: "arg",    name: "Argentina",   iso: "AR", flag: "\u{1F1E6}\u{1F1F7}", color: "#f59e0b", idx: "S&P MERVAL" },
];

const SECTORS = [
  { id: "tech",       name: "Technology",  short: "Tech",   icon: "\u{1F4BB}", color: "#3b82f6" },
  { id: "finance",    name: "Financials",  short: "Fin",    icon: "\u{1F3E6}", color: "#8b5cf6" },
  { id: "industrial", name: "Industrials", short: "Indu",   icon: "\u{1F3D7}️", color: "#6366f1" },
  { id: "health",     name: "Healthcare",  short: "Health", icon: "\u{1F3E5}", color: "#10b981" },
  { id: "consumer",   name: "Consumer",    short: "Cons",   icon: "\u{1F6D2}", color: "#ec4899" },
  { id: "energy",     name: "Energy",      short: "Enrg",   icon: "⚡",    color: "#f59e0b" },
  { id: "materials",  name: "Materials",   short: "Matl",   icon: "\u{1FAA8}", color: "#fb923c" },
  { id: "realestate", name: "Real Estate", short: "RE",     icon: "\u{1F3E0}", color: "#14b8a6" },
];

const C_SCALE = { usa: 10, india: 7, brazil: 5, taiwan: 4.2, neth: 3.4, sweden: 3, denmark: 2.6, vietnam: 3.4, greece: 2, arg: 2.4 };
const C_BIAS  = { usa: 55, india: 88, taiwan: 62, vietnam: 52, neth: 18, denmark: 10, sweden: 6, brazil: -14, greece: -42, arg: -58 };
const S_BIAS  = { tech: 82, finance: 38, industrial: 30, health: 22, consumer: 14, energy: -12, materials: -6, realestate: -28 };
const T_WEIGHT = { fii: 0.34, dii: 0.50, ri: 0.16 };
const T_TILT   = { fii: 1.25, dii: 0.85, ri: 0.55 };

// ─── Helpers ─────────────────────────────────────────────────

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const R = (a, b) => a + Math.random() * (b - a);

function usd(v) {
  const a = Math.abs(v);
  if (a >= 1000) return (a / 1000).toFixed(2) + "B";
  return Math.round(a) + "M";
}
function usdSigned(v) { return (v >= 0 ? "+" : "−") + usd(v); }

// ─── Model ───────────────────────────────────────────────────

function buildModel() {
  const M = {};
  FLOW_COUNTRIES.forEach((c) => {
    M[c.id] = {};
    SECTORS.forEach((s) => {
      M[c.id][s.id] = {};
      const combined = clamp(C_BIAS[c.id] * 0.55 + S_BIAS[s.id] * 0.45 + R(-12, 12), -96, 96);
      const sectorMag = 0.7 + Math.random() * 0.7;
      ["fii", "dii", "ri"].forEach((t) => {
        const base = C_SCALE[c.id] * T_WEIGHT[t] * sectorMag * 22;
        const tilt = clamp((combined / 100) * T_TILT[t], -0.9, 0.9);
        const tin  = Math.max(8, base * (1 + tilt) * R(0.85, 1.15));
        const tout = Math.max(8, base * (1 - tilt) * R(0.85, 1.15));
        M[c.id][s.id][t] = { in: tin, out: tout, tin, tout };
      });
    });
  });
  return M;
}

function tick(M) {
  FLOW_COUNTRIES.forEach((c) =>
    SECTORS.forEach((s) =>
      ["fii", "dii", "ri"].forEach((t) => {
        const cell = M[c.id][s.id][t];
        if (Math.random() < 0.05) {
          cell.tin *= R(0.9, 1.1);
          cell.tout *= R(0.9, 1.1);
        }
        cell.in  = Math.max(5, cell.in  + (cell.tin  - cell.in ) * 0.12 + R(-1, 1) * cell.tin  * 0.06);
        cell.out = Math.max(5, cell.out + (cell.tout - cell.out) * 0.12 + R(-1, 1) * cell.tout * 0.06);
      })
    )
  );
}

function cellFlow(M, cId, sId, type) {
  const cell = M[cId][sId];
  if (type === "all") return { in: cell.fii.in + cell.dii.in + cell.ri.in, out: cell.fii.out + cell.dii.out + cell.ri.out };
  return { in: cell[type].in, out: cell[type].out };
}

// ─── Styles ──────────────────────────────────────────────────

const S = {
  secTitle: { margin: "6px 0 4px" },
  h2: { fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: 0 },
  desc: { fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#6b7280", marginTop: 5, lineHeight: 1.7, letterSpacing: ".02em" },
  unitTag: { fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#6366f1", background: "rgba(99,102,241,.12)", border: "1px solid rgba(99,102,241,.25)", borderRadius: 5, padding: "2px 7px", letterSpacing: ".05em" },
  defs: { display: "flex", flexWrap: "wrap", gap: 10, margin: "12px 0 18px", padding: "11px 13px", background: "rgba(255,255,255,.015)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 10 },
  def: { fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, color: "#6b7280", display: "flex", alignItems: "center", gap: 5, lineHeight: 1.5 },
  sw: (bg) => ({ width: 9, height: 9, borderRadius: 2, flexShrink: 0, background: bg }),
  headline: { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "linear-gradient(90deg,rgba(251,191,36,.07),transparent)", border: "1px solid rgba(251,191,36,.18)", borderLeft: "3px solid #fbbf24", borderRadius: 10, marginBottom: 16, flexWrap: "wrap" },
  tag: { fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: ".14em", color: "#fbbf24", background: "rgba(251,191,36,.12)", padding: "3px 8px", borderRadius: 5, whiteSpace: "nowrap" },
  txt: { fontSize: 12, fontWeight: 700 },
  controls: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 },
  label: { fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#6b7280", letterSpacing: ".08em" },
  select: { background: "#0d1117", color: "#e5e7eb", border: "1px solid rgba(255,255,255,.06)", borderRadius: 8, padding: "8px 30px 8px 12px", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, cursor: "pointer", outline: "none" },
  expBtn: { fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#a5b4fc", background: "rgba(99,102,241,.12)", border: "1px solid rgba(99,102,241,.3)", borderRadius: 8, padding: "8px 13px", cursor: "pointer", letterSpacing: ".05em" },
  scroll: { overflowX: "auto", background: "rgba(255,255,255,.022)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, padding: 4 },
  table: { borderCollapse: "collapse", width: "100%", minWidth: 880 },
  thHead: { fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, color: "#9ca3af", fontWeight: 700, padding: "10px 6px", letterSpacing: ".03em", borderBottom: "1px solid rgba(255,255,255,.06)", whiteSpace: "nowrap", textAlign: "center" },
  thCorner: { textAlign: "left", paddingLeft: 14, color: "#6b7280" },
  thRow: { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 11, textAlign: "left", padding: "8px 10px 8px 14px", whiteSpace: "nowrap", borderRight: "1px solid rgba(255,255,255,.06)" },
  cell: (bg, bright) => ({ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 600, padding: "9px 5px", borderRadius: 4, minWidth: 78, cursor: "pointer", textAlign: "center", background: bg, color: bright ? "#fff" : "#cbd5e1", transition: "transform .12s" }),
  totalCol: { background: "rgba(255,255,255,.025)" },
  tot: (c) => ({ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 10, padding: "9px 8px", textAlign: "center", color: c }),
  footTh: { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 10, textAlign: "left", padding: "8px 14px", color: "#9ca3af", borderTop: "1px solid rgba(255,255,255,.06)" },
};

// ─── Cell Detail Modal ───────────────────────────────────────

function BarRow({ label, col, x, mx }) {
  const iw = Math.max((x.in / mx) * 100, 3);
  const ow = Math.max((x.out / mx) * 100, 3);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "5px 0" }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, width: 26, flexShrink: 0, fontWeight: 700, color: col }}>{label}</span>
        <div style={{ flex: 1, display: "flex", gap: 4, alignItems: "center" }}>
          <div style={{ height: 15, background: "rgba(255,255,255,.03)", borderRadius: 4, overflow: "hidden", flex: 1, position: "relative" }}>
            <div style={{ height: "100%", borderRadius: 4, width: `${iw}%`, background: col, position: "relative", minWidth: 2 }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)", animation: "mp-shimmer 2.5s infinite" }} />
            </div>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, width: 44, textAlign: "right", flexShrink: 0, color: "#10b981" }}>{"▲"}{usd(x.in)}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "5px 0" }}>
        <span style={{ width: 26, flexShrink: 0, opacity: 0 }}>.</span>
        <div style={{ flex: 1, display: "flex", gap: 4, alignItems: "center" }}>
          <div style={{ height: 15, background: "rgba(255,255,255,.03)", borderRadius: 4, overflow: "hidden", flex: 1, position: "relative" }}>
            <div style={{ height: "100%", borderRadius: 4, width: `${ow}%`, background: col, opacity: 0.4, position: "relative", minWidth: 2 }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)", animation: "mp-shimmer 2.5s infinite" }} />
            </div>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, width: 44, textAlign: "right", flexShrink: 0, color: "#ef4444" }}>{"▼"}{usd(x.out)}</span>
        </div>
      </div>
    </div>
  );
}

function CellModal({ M, cId, sId, onClose }) {
  const c = FLOW_COUNTRIES.find((x) => x.id === cId);
  const s = SECTORS.find((x) => x.id === sId);
  if (!c || !s) return null;
  const cell = M[cId][sId];
  const tot = (cell.fii.in + cell.dii.in + cell.ri.in) - (cell.fii.out + cell.dii.out + cell.ri.out);
  const mx = Math.max(cell.fii.in, cell.fii.out, cell.dii.in, cell.dii.out, cell.ri.in, cell.ri.out, 1);

  const types = [
    { key: "fii", label: "FII", name: "FII — Foreign Institutional", col: "#3b82f6" },
    { key: "dii", label: "DII", name: "DII — Domestic Institutional", col: "#8b5cf6" },
    { key: "ri",  label: "RI",  name: "RI — Retail Investors", col: "#f59e0b" },
  ];

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(4,6,15,.78)", backdropFilter: "blur(5px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#0b0f1c", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, padding: 22, maxWidth: 440, width: "100%", boxShadow: "0 24px 70px rgba(0,0,0,.55)", animation: "mp-popin .2s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>{c.flag}</span>
          <span style={{ fontSize: 18 }}>{s.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{c.name} · {s.name}</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#6b7280" }}>{c.idx} · investor-class flow detail (USD M/B)</div>
          </div>
          <button onClick={onClose} style={{ cursor: "pointer", color: "#6b7280", fontSize: 15, lineHeight: 1, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 6, width: 26, height: 26, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{"✕"}</button>
        </div>

        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, margin: "8px 0 4px", padding: "8px 10px", borderRadius: 8, background: tot >= 0 ? "rgba(16,185,129,.1)" : "rgba(239,68,68,.1)", color: tot >= 0 ? "#10b981" : "#ef4444" }}>
          SECTOR NET (all investors): <b>{usdSigned(tot)}</b>
        </div>

        {types.map(({ key, label, name, col }) => {
          const x = cell[key];
          const n = x.in - x.out;
          return (
            <div key={key} style={{ margin: "11px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, marginBottom: 4 }}>
                <span style={{ color: col, fontWeight: 700 }}>{name}</span>
                <span style={{ color: n >= 0 ? "#10b981" : "#ef4444", fontWeight: 700 }}>NET {usdSigned(n)}</span>
              </div>
              <BarRow label={label} col={col} x={x} mx={mx} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CSV Export ───────────────────────────────────────────────

function exportCSV(M) {
  const rows = [["Country", "ISO", "Sector", "InvestorClass", "Inflow_USD_M", "Outflow_USD_M", "Net_USD_M"]];
  FLOW_COUNTRIES.forEach((c) =>
    SECTORS.forEach((s) =>
      ["fii", "dii", "ri"].forEach((t) => {
        const cell = M[c.id][s.id][t];
        rows.push([c.name, c.iso, s.name, t.toUpperCase(), Math.round(cell.in), Math.round(cell.out), Math.round(cell.in - cell.out)]);
      })
    )
  );
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `capital-flows-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── Main Component ──────────────────────────────────────────

export default function FlowsTab() {
  const modelRef = useRef(null);
  const [_, forceUpdate] = useState(0);
  const [filterType, setFilterType] = useState("all");
  const [modal, setModal] = useState(null); // { cId, sId }

  // Initialize model once
  if (!modelRef.current) modelRef.current = buildModel();
  const M = modelRef.current;

  // Live tick every 2s
  useEffect(() => {
    const iv = setInterval(() => {
      tick(M);
      forceUpdate((n) => n + 1);
    }, 2000);
    return () => clearInterval(iv);
  }, [M]);

  // Close modal on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setModal(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Compute matrix data
  const { cells, rowTot, colTot, grand, best, worst, maxAbs, sortedC } = useMemo(() => {
    const cells = {}, rowTot = {}, colTot = {};
    SECTORS.forEach((s) => (colTot[s.id] = 0));
    let grand = 0, best = { v: -1e9 }, worst = { v: 1e9 }, maxAbs = 1;

    FLOW_COUNTRIES.forEach((c) => {
      cells[c.id] = {};
      rowTot[c.id] = 0;
      SECTORS.forEach((s) => {
        const f = cellFlow(M, c.id, s.id, filterType);
        const n = f.in - f.out;
        cells[c.id][s.id] = n;
        rowTot[c.id] += n;
        colTot[s.id] += n;
        grand += n;
        maxAbs = Math.max(maxAbs, Math.abs(n));
        if (n > best.v) best = { v: n, c, s };
        if (n < worst.v) worst = { v: n, c, s };
      });
    });

    const sortedC = [...FLOW_COUNTRIES].sort((a, b) => rowTot[b.id] - rowTot[a.id]);
    return { cells, rowTot, colTot, grand, best, worst, maxAbs, sortedC };
    // eslint-disable-next-line
  }, [_, filterType]);

  const heat = useCallback(
    (n) => {
      const r = clamp(n / maxAbs, -1, 1);
      return r >= 0
        ? `rgba(16,185,129,${(0.1 + 0.62 * r).toFixed(3)})`
        : `rgba(239,68,68,${(0.1 + 0.62 * -r).toFixed(3)})`;
    },
    [maxAbs]
  );

  const tname = filterType === "all" ? "All investors" : filterType.toUpperCase();

  return (
    <div>
      {/* Extra animation keyframes for this tab */}
      <style>{`
        @keyframes mp-popin { from { transform: scale(.94); opacity: 0 } to { transform: scale(1); opacity: 1 } }
      `}</style>

      {/* Title */}
      <div style={S.secTitle}>
        <h2 style={S.h2}>
          {"\u{1F525}"} Country × Sector Flow Matrix{" "}
          <span style={S.unitTag}>NET FLOW · USD · M = million · B = billion</span>
        </h2>
        <div style={S.desc}>
          Pinpoints <b>where capital is actually going</b>: each cell = NET FLOW (inflows − outflows) into that country's sector.
          Deeper green = stronger inflow, deeper red = stronger outflow. Right column & bottom row show totals. <b>Click any cell</b> for its FII / DII / RI split.
        </div>
      </div>

      {/* Legend */}
      <div style={S.defs}>
        <div style={S.def}><span style={S.sw("#3b82f6")} /><b>FII</b> — Foreign Institutional Investors (cross-border capital)</div>
        <div style={S.def}><span style={S.sw("#8b5cf6")} /><b>DII</b> — Domestic Institutional Investors (funds, insurers, pensions)</div>
        <div style={S.def}><span style={S.sw("#f59e0b")} /><b>RI</b> — Retail Investors (individuals)</div>
        <div style={S.def}><span style={S.sw("#10b981")} /><b>Green</b> = net inflow &nbsp; <span style={S.sw("#ef4444")} /><b>Red</b> = net outflow</div>
      </div>

      {/* Controls */}
      <div style={S.controls}>
        <span style={S.label}>INVESTOR CLASS:</span>
        <select style={S.select} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All Investors (FII+DII+RI)</option>
          <option value="fii">FII — Foreign only</option>
          <option value="dii">DII — Domestic Institutions only</option>
          <option value="ri">RI — Retail only</option>
        </select>
        <button style={S.expBtn} onClick={() => exportCSV(M)}>{"⬇"} EXPORT CSV</button>
        <span style={{ ...S.label, marginLeft: "auto" }}>{"\u{1F7E9}"} net inflow &nbsp;·&nbsp; {"\u{1F7E5}"} net outflow &nbsp;·&nbsp; intensity ∝ magnitude</span>
      </div>

      {/* Headline */}
      {best.c && worst.c && (
        <div style={S.headline}>
          <span style={S.tag}>STRONGEST FLOW · {tname}</span>
          <span style={S.txt}>
            Biggest inflow: <b style={{ color: "#34d399" }}>{best.c.flag} {best.c.name} · {best.s.name} {usdSigned(best.v)}</b>
            {" "}&nbsp;|&nbsp;{" "}
            biggest outflow: <b style={{ color: "#f87171" }}>{worst.c.flag} {worst.c.name} · {worst.s.name} {usdSigned(worst.v)}</b>
          </span>
        </div>
      )}

      {/* Matrix Table */}
      <div style={S.scroll}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={{ ...S.thHead, ...S.thCorner }}>COUNTRY \ SECTOR</th>
              {SECTORS.map((s) => (
                <th key={s.id} style={S.thHead} title={s.name}>
                  {s.icon}<br />{s.short}
                </th>
              ))}
              <th style={{ ...S.thHead, ...S.totalCol }}>NET<br />TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {sortedC.map((c) => (
              <tr key={c.id}>
                <th style={S.thRow}>
                  <span style={{ marginRight: 6, fontSize: 14 }}>{c.flag}</span>{c.name}
                </th>
                {SECTORS.map((s) => {
                  const n = cells[c.id][s.id];
                  return (
                    <td key={s.id}>
                      <div
                        style={S.cell(heat(n), Math.abs(n) / maxAbs > 0.45)}
                        title={`${c.name} · ${s.name}: ${usdSigned(n)} — click for FII/DII/RI`}
                        onClick={() => setModal({ cId: c.id, sId: s.id })}
                      >
                        {usdSigned(n)}
                      </div>
                    </td>
                  );
                })}
                <td style={S.totalCol}>
                  <div style={S.tot(rowTot[c.id] >= 0 ? "#10b981" : "#ef4444")}>{usdSigned(rowTot[c.id])}</div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th style={S.footTh}>NET TOTAL</th>
              {SECTORS.map((s) => (
                <td key={s.id} style={S.totalCol}>
                  <div style={S.tot(colTot[s.id] >= 0 ? "#10b981" : "#ef4444")}>{usdSigned(colTot[s.id])}</div>
                </td>
              ))}
              <td style={S.totalCol}>
                <div style={S.tot(grand >= 0 ? "#10b981" : "#ef4444")}>{usdSigned(grand)}</div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* How to read */}
      <div style={{ ...S.defs, marginTop: 16 }}>
        <div style={S.def}>
          <b>How to read:</b> scan a row to compare sectors within a country; scan a column to see which country leads a given sector.
          The brightest green cell = the strongest single capital-attraction in the world right now. Use the dropdown to isolate Foreign (FII), Domestic (DII) or Retail (RI) money.
        </div>
      </div>

      {/* Source line */}
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: "#374151", marginTop: 10, textAlign: "right" }}>
        Simulated live feed · 2s refresh · directional bias based on macro fundamentals
      </div>

      {/* Modal */}
      {modal && <CellModal M={M} cId={modal.cId} sId={modal.sId} onClose={() => setModal(null)} />}
    </div>
  );
}
