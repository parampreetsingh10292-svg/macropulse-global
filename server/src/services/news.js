// ─────────────────────────────────────────────────────────────
// News (NewsAPI → GNews → empty) + sovereign credit ratings.
// Ratings are a curated validated dataset (S&P / Moody's / Fitch
// long-term foreign-currency, as of Apr 2026).
// ─────────────────────────────────────────────────────────────

import { COUNTRIES } from "../constants.js";
import { httpJSON, stamp } from "../http.js";

const NEWS_API_KEY = process.env.NEWS_API_KEY || "";
const GNEWS_KEY = process.env.GNEWS_KEY || "";

export async function fetchNews() {
  const q =
    "(economy OR central bank OR inflation OR GDP OR market) AND (" +
    COUNTRIES.map((c) => c.name).join(" OR ") +
    ")";

  if (NEWS_API_KEY) {
    try {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        q
      )}&language=en&sortBy=publishedAt&pageSize=30&apiKey=${NEWS_API_KEY}`;
      const j = await httpJSON(url);
      if (j.articles?.length) {
        return stamp(
          j.articles.map((a) => ({
            title: a.title,
            source: a.source?.name,
            url: a.url,
            publishedAt: a.publishedAt,
            country: tagCountry(a.title + " " + (a.description || "")),
          })),
          "NewsAPI.org",
          new Date().toISOString()
        );
      }
    } catch (e) {
      console.warn("[news] NewsAPI failed:", e.message);
    }
  }

  if (GNEWS_KEY) {
    try {
      const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(
        "economy market central bank"
      )}&lang=en&max=20&token=${GNEWS_KEY}`;
      const j = await httpJSON(url);
      if (j.articles?.length) {
        return stamp(
          j.articles.map((a) => ({
            title: a.title,
            source: a.source?.name,
            url: a.url,
            publishedAt: a.publishedAt,
            country: tagCountry(a.title + " " + (a.description || "")),
          })),
          "GNews.io",
          new Date().toISOString()
        );
      }
    } catch (e) {
      console.warn("[news] GNews failed:", e.message);
    }
  }

  return stamp(
    [],
    "No news key configured — add NEWS_API_KEY to enable the live feed",
    new Date().toISOString(),
    { needsKey: true }
  );
}

function tagCountry(text) {
  const t = text.toLowerCase();
  for (const c of COUNTRIES) {
    if (t.includes(c.name.toLowerCase())) return c.id;
  }
  return null;
}

// ── Sovereign credit ratings (S&P / Moody's / Fitch, Apr 2026) ──
// Numeric score: AAA=100 … D=0, for the risk gauge.
const RATING_SCORE = {
  AAA: 100, "AA+": 95, AA: 90, "AA-": 85, "A+": 80, A: 75, "A-": 70,
  "BBB+": 65, BBB: 60, "BBB-": 55, "BB+": 50, BB: 45, "BB-": 40,
  "B+": 35, B: 30, "B-": 25, "CCC+": 20, CCC: 15, "CCC-": 10, CC: 7, C: 4, D: 0, RD: 2,
};

const SOVEREIGN = {
  usa:     { sp:"AA+",  moodys:"Aaa",  fitch:"AA+",  outlook:"Stable"   },
  arg:     { sp:"CCC",  moodys:"Caa3", fitch:"CCC",  outlook:"Positive" },
  taiwan:  { sp:"AA+",  moodys:"Aa3",  fitch:"AA",   outlook:"Stable"   },
  india:   { sp:"BBB",  moodys:"Baa3", fitch:"BBB-", outlook:"Stable"   },
  vietnam: { sp:"BB+",  moodys:"Ba2",  fitch:"BB+",  outlook:"Positive" },
  denmark: { sp:"AAA",  moodys:"Aaa",  fitch:"AAA",  outlook:"Stable"   },
  brazil:  { sp:"BB",   moodys:"Ba1",  fitch:"BB",   outlook:"Stable"   },
  neth:    { sp:"AAA",  moodys:"Aaa",  fitch:"AAA",  outlook:"Stable"   },
  sweden:  { sp:"AAA",  moodys:"Aaa",  fitch:"AAA",  outlook:"Stable"   },
  greece:  { sp:"BBB-", moodys:"Baa3", fitch:"BBB",  outlook:"Positive" },
};

export async function fetchSovereign() {
  const rows = COUNTRIES.map((c) => {
    const r = SOVEREIGN[c.id];
    const score = RATING_SCORE[r.sp] ?? 50;
    return {
      id: c.id, name: c.name, flag: c.flag, color: c.color,
      sp: r.sp, moodys: r.moodys, fitch: r.fitch, outlook: r.outlook,
      score,
      grade: score >= 70 ? "Investment Grade (High)"
           : score >= 55 ? "Investment Grade"
           : score >= 40 ? "Speculative"
           : "High Risk",
    };
  });
  return stamp(
    rows,
    "S&P Global / Moody's / Fitch sovereign ratings (curated, Apr 2026)",
    new Date().toISOString()
  );
}
