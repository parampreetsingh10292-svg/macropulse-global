// ─────────────────────────────────────────────────────────────
// REST routes. Each endpoint is cached per its TTL so the app
// stays within free-tier limits even with many open clients.
// ─────────────────────────────────────────────────────────────

import { Router } from "express";
import { getOrSet, cacheStats } from "../cache.js";
import { fetchAllIndices, fetchIndexSeries, fetchAllSparklines } from "../services/indices.js";
import { fetchFX, fetchFxSparklines } from "../services/fx.js";
import { fetchCommodities, fetchCommoditySparklines } from "../services/commodities.js";
import { fetchMacro } from "../services/macro.js";
import { fetchPolicyRates, fetchCalendar } from "../services/rates.js";
import { fetchNews, fetchSovereign } from "../services/news.js";
import { fetchPerformance } from "../services/performance.js";
import { fetchTopStocks } from "../services/stocks.js";
import { COUNTRIES } from "../constants.js";

const r = Router();
const T = (k, d) => Number(process.env[k] || d);

r.get("/health", (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString(), cache: cacheStats() })
);

r.get("/countries", (_req, res) => res.json({ data: COUNTRIES }));

r.get("/indices", async (_req, res, next) => {
  try {
    res.json(await getOrSet("indices", T("CACHE_TTL_QUOTES", 60), fetchAllIndices));
  } catch (e) { next(e); }
});

r.get("/indices/sparklines", async (_req, res, next) => {
  try {
    res.json(await getOrSet("sparklines", 900, fetchAllSparklines));
  } catch (e) { next(e); }
});

r.get("/indices/:id/series", async (req, res, next) => {
  try {
    res.json(
      await getOrSet(`series:${req.params.id}`, T("CACHE_TTL_QUOTES", 60), () =>
        fetchIndexSeries(req.params.id)
      )
    );
  } catch (e) { next(e); }
});

r.get("/fx", async (_req, res, next) => {
  try {
    res.json(await getOrSet("fx", T("CACHE_TTL_FX", 300), fetchFX));
  } catch (e) { next(e); }
});

r.get("/fx/sparklines", async (_req, res, next) => {
  try {
    res.json(await getOrSet("fx-sparklines", 900, fetchFxSparklines));
  } catch (e) { next(e); }
});

r.get("/commodities", async (_req, res, next) => {
  try {
    res.json(await getOrSet("commodities", T("CACHE_TTL_COMMODITIES", 300), fetchCommodities));
  } catch (e) { next(e); }
});

r.get("/commodities/sparklines", async (_req, res, next) => {
  try {
    res.json(await getOrSet("comm-sparklines", 900, fetchCommoditySparklines));
  } catch (e) { next(e); }
});

r.get("/macro", async (_req, res, next) => {
  try {
    res.json(await getOrSet("macro", T("CACHE_TTL_MACRO", 86400), fetchMacro));
  } catch (e) { next(e); }
});

r.get("/rates", async (_req, res, next) => {
  try {
    res.json(await getOrSet("rates", T("CACHE_TTL_MACRO", 86400), fetchPolicyRates));
  } catch (e) { next(e); }
});

r.get("/calendar", async (_req, res, next) => {
  try {
    res.json(await getOrSet("calendar", T("CACHE_TTL_CALENDAR", 21600), fetchCalendar));
  } catch (e) { next(e); }
});

r.get("/news", async (_req, res, next) => {
  try {
    res.json(await getOrSet("news", T("CACHE_TTL_NEWS", 900), fetchNews));
  } catch (e) { next(e); }
});

r.get("/sovereign", async (_req, res, next) => {
  try {
    res.json(await getOrSet("sovereign", T("CACHE_TTL_MACRO", 86400), fetchSovereign));
  } catch (e) { next(e); }
});

r.get("/performance", async (_req, res, next) => {
  try {
    res.json(await getOrSet("performance", T("CACHE_TTL_MACRO", 86400), fetchPerformance));
  } catch (e) { next(e); }
});

r.get("/stocks", async (_req, res, next) => {
  try {
    res.json(await getOrSet("stocks", T("CACHE_TTL_MACRO", 86400), fetchTopStocks));
  } catch (e) { next(e); }
});

// One-shot aggregate for fast initial paint
r.get("/snapshot", async (_req, res, next) => {
  try {
    const [indices, fx, commodities, macro, rates, performance] = await Promise.all([
      getOrSet("indices", T("CACHE_TTL_QUOTES", 60), fetchAllIndices),
      getOrSet("fx", T("CACHE_TTL_FX", 300), fetchFX),
      getOrSet("commodities", T("CACHE_TTL_COMMODITIES", 300), fetchCommodities),
      getOrSet("macro", T("CACHE_TTL_MACRO", 86400), fetchMacro),
      getOrSet("rates", T("CACHE_TTL_MACRO", 86400), fetchPolicyRates),
      getOrSet("performance", T("CACHE_TTL_MACRO", 86400), fetchPerformance),
    ]);
    res.json({ indices, fx, commodities, macro, rates, performance });
  } catch (e) { next(e); }
});

export default r;
