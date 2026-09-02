// Prerender script: builds a static HTML snapshot of every route so search engines
// can index the full content (React SPAs need this for SEO).
// Usage: node scripts/prerender.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'categories.json'), 'utf8'));
const BASE_URL = process.env.BASE_URL || 'https://linkshub.pages.dev';

function esc(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function makeHtml({ title, description, canonical, jsonLd, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#0b1020">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(canonical)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>body{font-family:Inter,system-ui,sans-serif;background:#0a0e1a;color:#e8eaf2;margin:0;padding:40px 20px;max-width:1200px;margin:0 auto}a{color:#6366f1;text-decoration:none}h1{font-size:36px;margin-bottom:8px}.muted{color:#9ba3bd}.cat-card{display:flex;align-items:center;gap:14px;padding:18px;border:1px solid #2a3349;border-radius:12px;margin-bottom:10px;background:#1a2138}.cat-icon{width:44px;height:44px;border-radius:10px;background:rgba(99,102,241,.15);display:flex;align-items:center;justify-content:center;font-size:22px}.link-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin:16px 0}.link-card{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #2a3349;border-radius:10px;background:#1a2138}.link-favicon{width:28px;height:28px;border-radius:6px;background:#232c4a;display:flex;align-items:center;justify-content:center;font-weight:700;color:#9ba3bd;text-transform:uppercase}</style>
</head>
<body>
${body}
</body>
</html>`;
}

function homePage() {
  const total = DATA.reduce((s, c) => s + c.count, 0);
  const featured = DATA.slice(0, 12);
  const body = `
<header style="display:flex;align-items:center;gap:12px;margin-bottom:40px">
  <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#ec4899);display:flex;align-items:center;justify-content:center;color:white;font-weight:900">L</div>
  <strong style="font-size:20px">LinksHub</strong>
</header>
<h1>Discover the <span style="background:linear-gradient(135deg,#6366f1,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Best of the Web</span></h1>
<p class="muted">A curated directory of ${total.toLocaleString()}+ websites across ${DATA.length} categories. Fast, beautiful, free.</p>
<h2 style="margin-top:40px;font-size:24px">Browse Categories</h2>
${featured.map(c => `
<a href="/category/${c.slug}" class="cat-card">
  <div class="cat-icon">${esc(c.icon)}</div>
  <div>
    <div style="font-weight:600">${esc(c.name)}</div>
    <div class="muted" style="font-size:13px">${c.count} sites</div>
  </div>
</a>
`).join('')}
<p style="margin-top:32px"><a href="/categories" style="color:#6366f1">View all ${DATA.length} categories →</a></p>`;
  return makeHtml({
    title: 'LinksHub — Discover 5,000+ Curated Websites Across 45 Categories',
    description: 'A fast, beautiful directory of the best sites on the web — from AI tools to streaming, news to coding.',
    canonical: `${BASE_URL}/`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'LinksHub',
      description: 'A curated directory of 5,000+ websites across 45 categories',
      url: BASE_URL,
    },
    body,
  });
}

function categoryPage(cat) {
  const desc = `Discover ${cat.count} curated ${cat.name.toLowerCase()} resources. Hand-picked and organized for easy browsing.`;
  const sections = Object.entries(cat.sections);
  const body = `
<header style="display:flex;align-items:center;gap:12px;margin-bottom:32px">
  <a href="/" style="display:flex;align-items:center;gap:12px;color:inherit">
    <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#ec4899);display:flex;align-items:center;justify-content:center;color:white;font-weight:900">L</div>
    <strong>LinksHub</strong>
  </a>
</header>
<nav style="font-size:14px;color:#9ba3bd;margin-bottom:16px">
  <a href="/" style="color:#9ba3bd">Home</a> / <a href="/categories" style="color:#9ba3bd">Categories</a> / <span style="color:#e8eaf2">${esc(cat.name)}</span>
</nav>
<h1>${cat.icon} ${esc(cat.name)}</h1>
<p class="muted">${esc(desc)}</p>
<p class="muted" style="font-size:14px">${cat.count} sites · ${Object.keys(cat.sections).length} sections</p>
${sections.map(([name, items]) => `
<h2 style="margin-top:32px;font-size:20px;border-bottom:1px solid #2a3349;padding-bottom:10px">${esc(name)} <span style="font-size:12px;color:#9ba3bd;padding:2px 8px;background:#1a2138;border-radius:999px;border:1px solid #2a3349">${items.length}</span></h2>
<div class="link-grid">
${items.map(it => {
  const initial = it.name.charAt(0).toUpperCase();
  const domain = it.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
  return `<a href="${esc(it.url)}" target="_blank" rel="noopener" class="link-card">
    <div class="link-favicon">${esc(initial)}</div>
    <div style="flex:1;min-width:0">
      <div style="font-size:14px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(it.name)}</div>
      <div style="font-size:11px;color:#6b7290;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(domain)}</div>
    </div>
  </a>`;
}).join('')}
</div>
`).join('')}
<p style="margin-top:40px"><a href="/categories" style="color:#6366f1">← Browse all categories</a></p>`;
  return makeHtml({
    title: `${cat.name} — ${cat.count} Curated Sites | LinksHub`,
    description: desc,
    canonical: `${BASE_URL}/category/${cat.slug}`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${cat.name} — LinksHub`,
      description: desc,
      url: `${BASE_URL}/category/${cat.slug}`,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: cat.count,
      },
    },
    body,
  });
}

function writeFile(rel, html) {
  const out = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log(`  wrote ${rel}`);
}

console.log('Prerendering pages...');
if (!fs.existsSync(DIST)) {
  console.error(`dist/ not found. Run \`npm run build\` first.`);
  process.exit(1);
}
writeFile('index.html', homePage());
for (const cat of DATA) {
  writeFile(path.join('category', cat.slug, 'index.html'), categoryPage(cat));
}
writeFile('categories/index.html', homePage().replace(/<title>.*?<\/title>/, '<title>All Categories — LinksHub</title>').replace(/A curated directory of 5,000\+ websites across 45 categories/, `Browse all ${DATA.length} categories.`));
console.log(`\n✅ Prerendered ${DATA.length + 2} pages.`);
