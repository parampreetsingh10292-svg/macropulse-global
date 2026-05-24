// ─────────────────────────────────────────────────────────────
// TAB: Rates & Calendar — central-bank policy rates + upcoming
// economic releases.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { api, shortDate } from "../lib/api.js";
import { Card, Source, Loading } from "../components/ui.jsx";
import { Glossary, CountrySummary } from "../components/Glossary.jsx";

const GLOSSARY = [
  { icon: "🏦", term: "Central Bank", definition: "The institution that controls a country's money supply and sets interest rates. For example, the Federal Reserve (USA), Reserve Bank of India, or European Central Bank. They are like the 'financial guardian' of a country." },
  { icon: "📊", term: "Policy Rate (%)", definition: "The key interest rate set by the central bank. It affects what banks charge you for loans and pay you on savings. When this rate goes up, borrowing gets expensive; when it goes down, borrowing gets cheaper." },
  { icon: "🔴", term: "Hiking", definition: "The central bank is raising interest rates. This is done to fight inflation (slow down rising prices), but it makes loans, mortgages, and credit cards more expensive." },
  { icon: "🟢", term: "Cutting", definition: "The central bank is lowering interest rates. This is done to boost the economy — cheaper loans encourage businesses to invest and people to spend. Usually happens when the economy is slowing down." },
  { icon: "🟡", term: "On Hold", definition: "The central bank is keeping rates unchanged. This usually means they're watching the economy and waiting for more data before making a move." },
  { icon: "📅", term: "Next Meeting", definition: "The date when the central bank will next decide whether to change interest rates. Markets pay close attention to these meetings because rate changes affect stock prices, currency values, and bond yields." },
  { icon: "⏰", term: "Days Countdown", definition: "How many days until the next central bank meeting. As the meeting gets closer, markets often become more volatile due to uncertainty about the decision." },
  { icon: "📈", term: "Delta (from previous)", definition: "How much the rate has changed compared to the previous level. For example, '+0.25 from 4.0%' means the rate was raised by 0.25 percentage points." },
  { icon: "📅", term: "Economic Calendar", definition: "A schedule of upcoming economic data releases and events. These releases (like GDP numbers, inflation reports, jobs data) can cause big market moves." },
  { icon: "🔴🟡🟢", term: "Impact (High/Medium/Low)", definition: "How much the event is expected to move markets. High-impact events (like central bank decisions) can cause big price swings. Low-impact events usually don't cause much movement." },
];

const BIAS = {
  hiking: { c: "#ef4444", t: "HIKING" },
  cutting: { c: "#10b981", t: "CUTTING" },
  hold: { c: "#f59e0b", t: "ON HOLD" },
};
const IMPACT = { High: "#ef4444", Medium: "#f59e0b", Low: "#6b7280" };

export default function RatesTab({ countries, active }) {
  const [rates, setRates] = useState(null);
  const [cal, setCal] = useState(null);
  const [rMeta, setRMeta] = useState({});
  const [cMeta, setCMeta] = useState({});

  useEffect(() => {
    api("/rates").then((r) => { setRates(r.data); setRMeta({ source: r.source, asOf: r.asOf }); }).catch(() => {});
    api("/calendar").then((r) => { setCal(r.data); setCMeta({ source: r.source, asOf: r.asOf }); }).catch(() => {});
  }, []);

  if (!rates || !cal) return <Loading label="Loading central-bank rates & calendar…" />;

  const flagOf = (iso2) => countries.find((c) => c.iso2 === iso2)?.flag || "🌐";

  return (
    <div style={{ animation: "mp-fade .3s ease" }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#374151", letterSpacing: ".12em", marginBottom: 10 }}>
        CENTRAL-BANK POLICY RATES · NEXT MEETING COUNTDOWN
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 10, marginBottom: 8 }}>
        {[...rates].sort((a, b) => a.daysToMeeting - b.daysToMeeting).map((r) => {
          const b = BIAS[r.bias] || BIAS.hold;
          return (
            <Card key={r.id} accent={`${r.color}22`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{r.flag}</span>
                    <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: "#f9fafb" }}>{r.name}</span>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: "#4b5563", marginTop: 2 }}>{r.bank}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: r.color }}>{r.rate}%</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: r.delta < 0 ? "#10b981" : r.delta > 0 ? "#ef4444" : "#6b7280" }}>
                    {r.delta > 0 ? "+" : ""}{r.delta} from {r.prev}%
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: b.c, background: `${b.c}18`, border: `1px solid ${b.c}33`, borderRadius: 4, padding: "2px 7px" }}>{b.t}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#9ca3af" }}>
                  Next: {shortDate(r.nextMeeting)} · <span style={{ color: r.color }}>{r.daysToMeeting}d</span>
                </span>
              </div>
            </Card>
          );
        })}
      </div>
      <Source src={rMeta.source} asOf={rMeta.asOf} />

      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#374151", letterSpacing: ".12em", margin: "20px 0 10px" }}>
        UPCOMING ECONOMIC CALENDAR · NEXT ~3 WEEKS
      </div>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {cal.map((e, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 6px", borderBottom: i < cal.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none" }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#6b7280", width: 54, flexShrink: 0 }}>{shortDate(e.date)}</span>
              <span style={{ fontSize: 13, width: 22, flexShrink: 0 }}>{flagOf(e.country)}</span>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 11, color: "#d1d5db", flex: 1 }}>{e.event}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7.5, color: IMPACT[e.impact] || "#6b7280", border: `1px solid ${(IMPACT[e.impact] || "#6b7280")}44`, borderRadius: 4, padding: "1px 6px", flexShrink: 0 }}>{(e.impact || "").toUpperCase()}</span>
            </div>
          ))}
        </div>
      </Card>
      <Source src={cMeta.source} asOf={cMeta.asOf} />

      {/* Country summary */}
      {(() => {
        const cObj = countries?.find((c) => c.id === active);
        if (!cObj || !rates) return null;
        const r = rates.find((rt) => rt.id === active);
        if (!r) return null;
        const b = BIAS[r.bias] || BIAS.hold;
        const biasExplain = r.bias === "hiking" ? "raising interest rates to fight inflation — this makes loans and mortgages more expensive" : r.bias === "cutting" ? "lowering interest rates to boost the economy — this makes borrowing cheaper and encourages spending" : "keeping rates unchanged while monitoring the economy";
        return (
          <CountrySummary country={cObj}>
            <strong>{r.bank}</strong> ({cObj.name}'s central bank) currently has its policy rate set at <strong>{r.rate}%</strong>.{" "}
            {r.delta !== 0 && <>This is {r.delta > 0 ? "up" : "down"} {Math.abs(r.delta)} percentage points from the previous rate of {r.prev}%.{" "}</>}
            The bank is currently <strong>{b.t.toLowerCase()}</strong> — meaning they are {biasExplain}.{" "}
            The next rate decision meeting is on <strong>{new Date(r.nextMeeting).toLocaleDateString("en-GB", { dateStyle: "medium" })}</strong> ({r.daysToMeeting} days away).{" "}
            Investors and businesses watch this closely because rate changes affect stock markets, currency strength, and the cost of borrowing.
          </CountrySummary>
        );
      })()}

      <Glossary title="What do interest rates & calendar events mean?" terms={GLOSSARY} />
    </div>
  );
}
