# VerifiedMole

A curated directory of **3,000+ verified, alive domains** across **45 categories** — pure HTML, CSS, and vanilla JavaScript. No frameworks, no build step, no third-party CDN scripts. Just open `index.html`.

```
┌────────────────────────────────────────┐
│           VerifiedMole                 │
│                                        │
│  Sponsored by yourbrand.com            │
│                                        │
│       3,000+ verified domains           │
│       45 categories · press / to search│
│                                        │
│   ┌──────┐ ┌──────┐ ┌──────┐           │
│   │  AI  │ │ VPN  │ │Anime │           │
│   │ 475  │ │  X   │ │  Y   │           │
│   └──────┘ └──────┘ └──────┘           │
└────────────────────────────────────────┘
```

## ✨ Features

- **Zero dependencies** — no React, no Vite, no npm
- **Verified alive** — every URL was checked via HTTP before being added
- **Classified correctly** — each domain placed in the right category (not just the original file's category)
- **No spam, no porn, no gambling, no URL shorteners** — 32 known-bad URLs removed
- **No dead links** — 1,693 unreachable URLs removed
- **Domain-only output** — clean domain names, no per-domain sub-pages
- **Search** — press `/` anywhere to open the search modal; matches both categories and individual domains
- **Dark / light theme** — toggle in the top right, persisted
- **Mobile responsive**
- **GitHub Pages ready**

## 📊 Data Quality

| Stage | Count |
|---|---|
| Raw URLs extracted from the source files | 5,167 |
| After removing spam / porn / gambling / suspicious TLDs / redirectors | 5,135 |
| **After HTTP validation (alive only)** | **3,098** |
| After deduplication by domain | **2,990 unique domains** |
| **Categories** | **45** |

## 📁 Files

```
linkshub/
├── index.html         — single-page app (home + category views)
├── style.css          — all styling (no preprocessor, no minification)
├── app.js             — all behavior (no framework, no bundler)
├── domains.json       — 2,990 verified unique domains × 45 categories
├── favicon.svg        — gradient logo
├── README.md
├── LICENSE
└── package.json       — only for `npm start` convenience (optional)
```

Total payload: **~160 KB** of HTML + CSS + JS, plus 290 KB of data.

## 🚀 Quick Start

### Local

```bash
git clone https://github.com/Seminarclass/linkshub.git
cd linkshub
python3 -m http.server 8080
# Open http://localhost:8080
```

### GitHub Pages

1. Settings → Pages → Source: `main` branch, `/` (root)
2. Live at `https://<username>.github.io/linkshub/`

## ⌨️ Keyboard

| Key | Action |
|---|---|
| `/` | Open search modal |
| `Esc` | Close search modal |
| `↑` / `↓` | Navigate search results |
| `Enter` | Open result |
| `Enter` (in hero search) | Go to matching category |

## 🔍 Data Pipeline (how the data was built)

1. **Extract** URLs from each category file in the source archive
2. **Filter** known spam / porn / gambling / URL-shortener / suspicious-TLD URLs (32 removed)
3. **Classify** each URL by base domain → correct category (e.g. GitHub URLs moved from "Open Source Code" to "Coding", antivirus vendors moved to "Antivirus")
4. **Validate** every URL via HTTP HEAD (with GET fallback) — 1,693 dead URLs removed
5. **Dedupe** by domain within each category
6. **Output** clean `domains.json`

## 📜 License

MIT
