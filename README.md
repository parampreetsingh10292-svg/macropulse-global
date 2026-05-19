# 🌍 MacroPulse Global

> A one-stop macro-economic & market intelligence terminal for the world's top 10 economies.
> Real data, validated sources, live indices, FX, commodities, central-bank tracking, economic calendar, news & sovereign ratings.

**Countries covered:** 🇺🇸 USA · 🇦🇷 Argentina · 🇹🇼 Taiwan · 🇮🇳 India · 🇻🇳 Vietnam · 🇩🇰 Denmark · 🇧🇷 Brazil · 🇳🇱 Netherlands · 🇸🇪 Sweden · 🇬🇷 Greece

---

## 🏗 Architecture

```
macropulse-global/
├── server/          Node + Express backend (data proxy, caching, key hiding)
│   └── src/
│       ├── index.js            Express app + cron refresh
│       ├── routes/             REST endpoints
│       └── services/           One module per data provider
├── client/          React + Vite frontend (the dashboard UI)
│   └── src/
│       ├── App.jsx
│       ├── tabs/               One file per tab
│       ├── components/         Shared UI
│       └── lib/                API client, constants, formatting
└── README.md
```

**Why a backend?** Browser-side calls to market-data APIs fail on CORS and expose API keys. The Express server:
- Proxies every provider so keys never reach the browser
- Caches responses (60 s for quotes, 6–24 h for macro) to respect free-tier rate limits
- Normalises every provider's payload into one clean schema
- Attaches a `source` + `asOf` stamp to every figure so the UI can show provenance

---

## 🔌 Data Sources (all have free tiers)

| Domain | Provider | Free tier | Env var |
|---|---|---|---|
| Stock indices & quotes | **Twelve Data** | 800 req/day | `TWELVE_DATA_KEY` |
| Stock indices (fallback) | **Financial Modeling Prep** | 250 req/day | `FMP_KEY` |
| FX rates | **exchangerate.host** | unlimited, no key | — |
| Commodities | **Twelve Data** / **Metals.dev** | shared / 100 mo | `METALS_DEV_KEY` (opt) |
| Macro indicators | **World Bank API** | unlimited, no key | — |
| Macro (recent/nowcast) | **Trading Economics** | trial key | `TE_KEY` (opt) |
| Central bank rates | **curated + FRED** | unlimited | `FRED_KEY` (opt) |
| Economic calendar | **Financial Modeling Prep** | 250 req/day | `FMP_KEY` |
| News & geopolitics | **NewsAPI** / **GNews** | 100 req/day | `NEWS_API_KEY` |
| Sovereign ratings | **curated dataset** (S&P/Moody's/Fitch) | — | — |

> The app **runs with zero keys** using free no-key providers + bundled validated datasets.
> Add keys to unlock live quotes and higher refresh rates. Every endpoint degrades gracefully.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ and npm

### 2. Backend

```bash
cd server
npm install
cp .env.example .env       # then edit .env to add any API keys you have
npm run dev                # starts on http://localhost:8787
```

### 3. Frontend (new terminal)

```bash
cd client
npm install
npm run dev                # starts on http://localhost:5173
```

Open **http://localhost:5173** — the app proxies all data through the backend automatically.

### 4. Production build

```bash
cd client && npm run build      # outputs client/dist
cd ../server && npm start       # serves API + the built client
```

Deploy the `server` folder to Render/Railway/Fly/your VPS; it serves both API and static client.

---

## 🔑 Getting Free API Keys (optional but recommended)

| Provider | URL | Time |
|---|---|---|
| Twelve Data | https://twelvedata.com/pricing (Basic = free) | 2 min |
| Financial Modeling Prep | https://site.financialmodelingprep.com/developer/docs | 2 min |
| NewsAPI | https://newsapi.org/register | 1 min |
| FRED | https://fred.stlouisfed.org/docs/api/api_key.html | 2 min |

Paste them into `server/.env`. Restart the backend. Done.

---

## 📑 Tabs

1. **Live Indices** — real-time index levels for all 10 markets, % change, sparklines, market open/closed status
2. **Chart & Forecast** — 10-year normalised performance + 6-month AI scenario forecast
3. **Macro Economics** — GDP, inflation, bonds, unemployment, fiscal deficit, debt-to-GDP vs govt targets
4. **Markets & FX** — currencies vs USD/INR, DXY, commodities (Brent, gold, copper, gas)
5. **Rates & Calendar** — central-bank policy rates, next meeting dates, upcoming economic releases
6. **News & Risk** — country-tagged headlines, sovereign credit ratings, CDS-style risk gauge
7. **Top Stocks** — top 3 performers per market + how an Indian investor can access them

---

## ⚖️ Data Integrity Notes

- Every number carries a `source` and `asOf` timestamp shown in the UI footer of each card.
- Free-tier market quotes may be delayed 15 min — this is labelled in the UI, never hidden.
- Macro indicators come from the **World Bank** (official) and are annual/quarterly by nature.
- This software is for information only and is **not financial advice**.

---

## 🛠 Extending

Add a provider: drop a module in `server/src/services/`, expose it via a route, consume it in a tab.
All services follow the same contract: `async function fetchX(): { data, source, asOf }`.
