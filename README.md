# LinksHub

A curated directory of **4,700+ domains** across **45 categories** — pure HTML, CSS, and vanilla JavaScript. **No frameworks, no build step, no third-party CDN scripts.** Just open `index.html`.

```
┌────────────────────────────────────────┐
│           DomainsHub                   │
│                                        │
│   4,700+ domains · 45 categories       │
│   Press / to search                    │
│                                        │
│   ┌──────┐ ┌──────┐ ┌──────┐           │
│   │  AI  │ │ VPN  │ │Anime │           │
│   │ 624  │ │  44  │ │ 109  │           │
│   └──────┘ └──────┘ └──────┘           │
│   ┌──────┐ ┌──────┐ ┌──────┐           │
│   │ News │ │Music │ │ ...  │           │
│   └──────┘ └──────┘ └──────┘           │
└────────────────────────────────────────┘
```

## ✨ Features

- **Zero dependencies** — no React, no Vite, no npm
- **Beautiful design** — dark/light theme, animated gradient orbs, gradient text, hover effects
- **Fast** — loads in <100ms; the only network request after first paint is `domains.json`
- **Search** — press `/` anywhere to open the search modal; matches both categories and individual domains
- **4,700+ unique domains** — no URLs, no sub-categories, just clean domain lists
- **Domain-only output** — no topic URLs, no sub-pages
- **Mobile responsive**
- **Works offline** after first load (no external dependencies)
- **GitHub Pages ready** — just push to `gh-pages` branch

## 🚀 Quick Start

### Local

```bash
git clone https://github.com/Seminarclass/linkshub.git
cd linkshub
python3 -m http.server 8080
# Open http://localhost:8080
```

### GitHub Pages

1. Fork the repo
2. Settings → Pages → Source: `main` branch, `/` (root)
3. Your site is live at `https://<username>.github.io/linkshub/`

That's it. No build, no deploy step, no configuration.

## 🎨 Design Highlights

- **Animated gradient orbs** in the background (CSS-only)
- **Shine animation** on the logo
- **Gradient text** with hue shift animation
- **Custom favicons** — each domain card shows its first letter on a unique gradient
- **Hover effects** — cards lift, icons rotate, arrows slide
- **Light/dark theme** — toggle in the top right, persisted in localStorage

## ⌨️ Keyboard

| Key | Action |
|---|---|
| `/` | Open search modal |
| `Esc` | Close search modal |
| `↑` / `↓` | Navigate search results |
| `Enter` | Open result |
| `Esc` (on home) | Clear search input |

## 📁 Files

```
linkshub/
├── index.html         — single-page app shell
├── style.css          — all styling (no preprocessor, no minification)
├── app.js             — all behavior (no framework, no bundler)
├── domains.json       — 4,726 unique domains across 45 categories
├── favicon.svg        — gradient logo
├── LICENSE
├── README.md
└── package.json       — only for `npm start` convenience (optional)
```

Total payload: **~140 KB** of HTML + CSS + JS, plus 115 KB of data.

## 📜 License

MIT
