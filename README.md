# LinksHub

A curated directory of **5,000+ websites** across **45 categories** — with an **autonomous topic-wise domain discovery engine** that keeps the source list fresh every hour.

```
┌────────────┐    hourly     ┌──────────────────┐
│  Cron job  │ ────────────► │  Intelligence    │
│  every 1h  │               │  Engine          │
└────────────┘               │                  │
                             │  • Topic Discovery│
                             │  • Multi-source   │
┌────────────┐               │    discovery     │
│  Project   │ ────────────► │  • URL validation│
│  source    │               │  • Scoring       │
└────────────┘               │  • Audit log     │
                             └──────────────────┘
                                      │
                                      ▼
                              ┌──────────────┐
                              │  Registry    │
                              │  (JSON)      │
                              └──────────────┘
```

## ✨ Features

### Web App (React + Vite)

- **5,167 curated sites** across 45 categories (auto-grouped within each category)
- **Search across 5,000+ sites** (press `⌘K` / `Ctrl+K`)
- **Beautiful modern UI** with dark/light theme
- **Static HTML prerender** for every category → instant SEO indexing
- **JSON-LD structured data** on every page
- **Auto-generated sitemap.xml** (48 URLs) + robots.txt
- **Mobile-responsive**, accessible

### Autonomous Intelligence Layer (NEW)

- **Topic Discovery** — dynamically reads the project source code, dependencies, and content to build a taxonomy tailored to what the project actually needs (no fixed list)
- **Multi-source discovery** — DuckDuckGo, Reddit JSON, Hacker News Algolia, GitHub — no third-party APIs required
- **URL validation** — every candidate is HTTP-checked before being added; redirects are tracked
- **Source registry** — 4,300+ sources with composite scoring (relevance × authority × freshness)
- **Audit log** — every `ADDED` / `UPDATED` / `DEACTIVATED` / `VALIDATION_FAILED` / `URL_CHANGED` action is recorded in JSONL
- **Hourly cycle** — runs every hour via cron; checks existing sources, sweeps stale ones, discovers new ones
- **Self-verification** — every cycle checks counts, status, freshness before reporting success
- **HTTP control plane** — `GET /api/intelligence/{stats,topics,sources,audit,cycles}` and `POST /api/intelligence/cycle`

## 🚀 Quick Start

```bash
git clone https://github.com/Seminarclass/linkshub.git
cd linkshub
npm install

# Build the static site
npm run build
npm run prerender
npm run sitemap

# Serve the built site
npx serve dist        # or any static server

# Run the intelligence layer
node server/intelligence/seed.mjs     # seed with existing 5,167 URLs
node server/intelligence/server.mjs   # start the API on :3001
```

## 🤖 Running the Hourly Cycle

The hourly update runs automatically once you install the cron entry (see `scripts/hourly-cycle.sh`).

Manually trigger a cycle:

```bash
# Lightweight cycle (no URL validation) for fast dev
node server/intelligence/run.mjs --no-validate --max-topics=10

# Full cycle (validates URLs via HTTP)
node server/intelligence/run.mjs --validate --max-topics=20 --max-validations=10
```

Or via the HTTP API:

```bash
curl -X POST http://localhost:3001/api/intelligence/cycle \
  -H 'Content-Type: application/json' \
  -d '{"validate": true, "maxTopics": 15, "maxValidations": 10}'
```

## 📊 API Reference (Intelligence Layer)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/intelligence/stats` | Registry totals (sources, topics, avg score) |
| `GET` | `/api/intelligence/topics` | Discovered project topics (ranked) |
| `GET` | `/api/intelligence/sources?topic=AI%20%2F%20LLM&limit=20` | List sources by topic |
| `GET` | `/api/intelligence/audit?lines=50` | Recent audit-log entries |
| `GET` | `/api/intelligence/cycles` | Recent hourly cycle reports |
| `POST` | `/api/intelligence/cycle` | Trigger a cycle on demand |

## 🧠 How the Intelligence Engine Works

1. **Topic Discovery** walks the project tree, scoring topics via:
   - Dependency name patterns (e.g. `react` → Frontend, Web Development)
   - Source-file path patterns (e.g. `Dockerfile` → DevOps, Cloud / VPS)
   - Code content patterns (e.g. `JSON-LD` → SEO)
   - Confidence is derived from signal count × score

2. **For each discovered topic**, the orchestrator builds a search query plan, then:
   - Queries DuckDuckGo HTML (no API key)
   - Pulls from relevant subreddits
   - Searches GitHub for repositories
   - Searches Hacker News for discussions
   - Deduplicates by domain
   - Validates URLs with HEAD/GET (with redirect tracking)
   - Scores with the trusted-domain + spam-filter heuristic
   - Persists to the JSON registry
   - Audits every change

3. **Hourly cron** runs `node server/intelligence/run.mjs` and writes a cycle report to `data/cycle-reports.jsonl`.

4. **Stale sweep** deactivates sources not checked in 30 days with low scores.

## 🗂️ Project Structure

```
linkshub/
├── src/                         — React app
│   ├── components/              — Header, Footer, SearchModal, SEO, Icons
│   ├── pages/                   — Home, Categories, CategoryPage, About
│   ├── data/categories.json     — 5,167 URLs, 45 categories
│   ├── App.jsx, main.jsx, styles.css
├── server/
│   └── intelligence/            — Autonomous discovery engine
│       ├── topicDiscovery.js    — Project-aware topic taxonomy
│       ├── sources.js           — DDG/Reddit/HN/GitHub discoverers
│       ├── orchestrator.js      — Per-topic cycle logic
│       ├── registry.js          — Source scoring + persistence
│       ├── audit.js             — JSONL audit log
│       ├── api.js               — Express HTTP control plane
│       ├── seed.mjs             — Seed registry from categories.json
│       ├── run.mjs              — One-cycle CLI
│       └── server.mjs           — Standalone API server
├── scripts/
│   ├── prerender.mjs            — Build static HTML for every route (SEO)
│   ├── sitemap.mjs              — Generate sitemap.xml
│   └── hourly-cycle.sh          — Cron-friendly cycle runner
├── public/                      — favicon, robots.txt, sitemap.xml
├── data/                        — runtime data (gitignored)
│   ├── registry.json            — all known sources
│   ├── audit.jsonl              — change log
│   └── cycle-reports.jsonl      — hourly cycle summaries
└── dist/                        — built static site (gitignored)
```

## 📜 License

MIT
