// ─────────────────────────────────────────────────────────────
// MacroPulse Global — Express entry point.
// Serves the JSON API and (in production) the built React client.
// ─────────────────────────────────────────────────────────────

import "dotenv/config";
import express from "express";
import cors from "cors";
import compression from "compression";
import cron from "node-cron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import api from "./routes/api.js";
import { getOrSet } from "./cache.js";
import { fetchAllIndices } from "./services/indices.js";
import { fetchFX } from "./services/fx.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8787;
const ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(compression());
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" ? true : ORIGIN,
  })
);
app.use(express.json());

// Request log (lightweight)
app.use((req, _res, next) => {
  if (req.path.startsWith("/api"))
    console.log(`${new Date().toISOString()}  ${req.method} ${req.path}`);
  next();
});

app.use("/api", api);

// Serve built client in production
const clientDist = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) res.status(200).send("MacroPulse Global API is running. Build the client to serve the UI.");
  });
});

// Centralised error handler
app.use((err, _req, res, _next) => {
  console.error("[error]", err.message);
  res.status(502).json({ error: "upstream_failed", message: err.message });
});

app.listen(PORT, () => {
  console.log(`\n  🌍  MacroPulse Global API → http://localhost:${PORT}`);
  console.log(`     Health: http://localhost:${PORT}/api/health\n`);
});

// Warm the fast-moving caches every 5 minutes (respects API rate limits on cloud)
cron.schedule("*/5 * * * *", async () => {
  try {
    await getOrSet("indices", 300, fetchAllIndices);
    await getOrSet("fx", 300, fetchFX);
  } catch (e) {
    console.warn("[cron] warm failed:", e.message);
  }
});
