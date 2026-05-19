// ─────────────────────────────────────────────────────────────
// Frontend API client + shared formatting helpers.
// ─────────────────────────────────────────────────────────────

const BASE = "/api";

export async function api(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status} on ${path}`);
  return res.json();
}

export const COLORS = {
  bullish: "#10b981",
  neutral: "#f59e0b",
  bearish: "#ef4444",
};
export const ICON = { bullish: "▲", neutral: "◆", bearish: "▼" };

export function fmtNum(n, dp = 2) {
  if (n == null || isNaN(n)) return "—";
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

export function fmtPct(n, dp = 2) {
  if (n == null || isNaN(n)) return "—";
  const v = Number(n);
  return `${v > 0 ? "+" : ""}${v.toFixed(dp)}%`;
}

export function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function shortDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}
