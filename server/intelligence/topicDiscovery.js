// Topic Discovery Engine — analyzes the project source code, dependencies,
// documentation, TODOs, errors, and existing categories to dynamically build
// a topic taxonomy tailored to the project's current needs.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Walk up from server/intelligence -> server -> project root
const ROOT = path.resolve(__dirname, "..", "..", "..");

// Topic detection rules: each rule produces topics with signals.
const RULES = [
  // Direct package.json dependency signals
  { source: "deps", pattern: /react/i, topics: ["Web Development", "Frontend"], score: 0.9 },
  { source: "deps", pattern: /vite/i, topics: ["Web Development", "Build Tools"], score: 0.8 },
  { source: "deps", pattern: /express/i, topics: ["Backend", "APIs"], score: 0.8 },
  { source: "deps", pattern: /smtp/i, topics: ["Email", "DevOps"], score: 0.9 },
  { source: "deps", pattern: /cors/i, topics: ["Web Development", "Security"], score: 0.6 },
  { source: "deps", pattern: /sql\.js|sqlite|better-sqlite/i, topics: ["Databases"], score: 0.9 },
  { source: "deps", pattern: /ws|websocket/i, topics: ["Real-time", "Backend"], score: 0.8 },

  // Source-file content signals
  { source: "code", pattern: /SMTP|RFC ?5321/i, topics: ["Email", "Networking"], score: 1.0 },
  { source: "code", pattern: /MIME|base64|quoted-printable/i, topics: ["Email", "Encoding"], score: 0.9 },
  { source: "code", pattern: /JSON-?LD|application\/ld\+json/i, topics: ["SEO", "Web Development"], score: 0.95 },
  { source: "code", pattern: /sitemap|robots\.txt/i, topics: ["SEO"], score: 0.95 },
  { source: "code", pattern: /canonical/i, topics: ["SEO"], score: 0.9 },
  { source: "code", pattern: /prerender|server.?side.?render|ssr/i, topics: ["SEO", "Performance"], score: 0.9 },
  { source: "code", pattern: /VPN|VirtualPrivateNetwork/i, topics: ["Privacy", "Security"], score: 0.95 },
  { source: "code", pattern: /Proxy/i, topics: ["Privacy", "Networking"], score: 0.9 },
  { source: "code", pattern: /Anime|Streaming|Torrent/i, topics: ["Media", "Entertainment"], score: 0.8 },
  { source: "code", pattern: /AI|artificial|machine.learning|LLM/i, topics: ["AI / LLM", "Research"], score: 1.0 },
  { source: "code", pattern: /Cryptocurrency|bitcoin|blockchain/i, topics: ["Cryptocurrency", "Finance"], score: 0.9 },
  { source: "code", pattern: /Antivirus|Security/i, topics: ["Security"], score: 0.9 },
  { source: "code", pattern: /DNS|domain/i, topics: ["Networking", "Web Development"], score: 0.9 },
  { source: "code", pattern: /Hosting|cloud|vps/i, topics: ["Cloud / VPS", "DevOps"], score: 0.95 },
  { source: "code", pattern: /React|component|jsx/i, topics: ["Frontend", "Web Development"], score: 0.8 },
  { source: "code", pattern: /API|endpoint|REST/i, topics: ["APIs", "Backend"], score: 0.85 },

  // File-extension / path signals
  { source: "path", pattern: /Dockerfile|docker-compose/i, topics: ["DevOps", "Cloud / VPS"], score: 0.95 },
  { source: "path", pattern: /\.sql$|\.db$/i, topics: ["Databases"], score: 0.9 },
  { source: "path", pattern: /android|apk|gradle/i, topics: ["Android", "Mobile Development"], score: 1.0 },
  { source: "path", pattern: /cocos|unity|unreal/i, topics: ["Game Development"], score: 1.0 },
  { source: "path", pattern: /chrome|firefox|extension/i, topics: ["Browser Extensions", "Web Development"], score: 0.9 },
  { source: "path", pattern: /ios|swift|xcode/i, topics: ["iOS", "Mobile Development"], score: 0.9 },

  // TODO / error patterns (when surfaced by inspector)
  { source: "todo", pattern: /test|spec|jest|vitest/i, topics: ["Testing", "Software Development"], score: 0.8 },
  { source: "todo", pattern: /ci|github.?actions|workflow/i, topics: ["CI/CD", "DevOps"], score: 0.9 },
  { source: "todo", pattern: /deploy|vercel|netlify|cloudflare/i, topics: ["Cloud / VPS", "DevOps"], score: 0.85 },
];

export class TopicDiscovery {
  constructor({ projectRoot = ROOT, readFile, readdir, stat } = {}) {
    this.projectRoot = projectRoot;
    this.readFile = readFile || fs.readFileSync;
    this.readdir = readdir || fs.readdirSync;
    this.stat = stat || fs.statSync;
  }

  // Walk the project, scoring topics by signal matches.
  analyze() {
    const scores = new Map();
    const signals = []; // audit trail
    const bump = (topic, score, source, where) => {
      if (!scores.has(topic)) scores.set(topic, { topic, score: 0, signals: 0, sources: new Set() });
      const entry = scores.get(topic);
      entry.score += score;
      entry.signals += 1;
      entry.sources.add(source);
      signals.push({ topic, score, source, where });
    };

    const ignore = (p) => {
      if (p.includes("node_modules")) return true;
      if (p.includes("/.git/")) return true;
      if (p.includes("/dist/")) return true;
      if (p.includes("/.cache/")) return true;
      // Skip our own data dir (registry/audit) but keep src/data/ (categories.json)
      // IMPORTANT: match on the suffix of the projectRoot, not "/data/" anywhere in the abs path
      const rel = p.startsWith(this.projectRoot + "/") ? p.slice(this.projectRoot.length + 1) : p;
      if (rel === "data" || rel.startsWith("data/")) return true;
      return false;
    };
    const walk = (dir) => {
      let entries;
      try { entries = this.readdir(dir); } catch { return; }
      for (const e of entries) {
        const fp = path.join(dir, e);
        if (ignore(fp)) continue;
        let st;
        try { st = this.stat(fp); } catch { continue; }
        if (st.isDirectory()) walk(fp);
        else this.scanFile(fp, bump);
      }
    };
    walk(this.projectRoot);

    // Convert to sorted list, with confidence derived from score + signal count.
    const topics = Array.from(scores.values())
      .map(t => ({
        topic: t.topic,
        score: Math.round(t.score * 100) / 100,
        signals: t.signals,
        sources: Array.from(t.sources),
        confidence: Math.min(1, Math.log2(1 + t.signals) * t.score / 6),
      }))
      .sort((a, b) => b.score - a.score);

    return { topics, signals: signals.slice(-200) };
  }

  scanFile(fp, bump) {
    const ext = path.extname(fp).toLowerCase();
    if (![".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx", ".json", ".md", ".html", ".css", ".yml", ".yaml", ".toml", ".sh"].includes(ext)) return;
    let content;
    try { content = this.readFile(fp, "utf8"); } catch { return; }
    const short = fp.replace(this.projectRoot + "/", "");

    // Dependencies file → check every rule with source="deps"
    if (fp.endsWith("package.json")) {
      try {
        const pkg = JSON.parse(content);
        const all = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}), ...(pkg.peerDependencies || {}) };
        for (const [name] of Object.entries(all)) {
          for (const r of RULES.filter(r => r.source === "deps")) {
            if (r.pattern.test(name)) for (const t of r.topics) bump(t, r.score, "deps", `${short}: ${name}`);
          }
        }
      } catch {}
    }

    // Path signals
    for (const r of RULES.filter(r => r.source === "path")) {
      if (r.pattern.test(fp)) for (const t of r.topics) bump(t, r.score, "path", short);
    }

    // Code content (truncated for speed)
    const code = content.length > 200_000 ? content.slice(0, 200_000) : content;
    for (const r of RULES.filter(r => r.source === "code" || r.source === "todo")) {
      if (r.pattern.test(code)) for (const t of r.topics) bump(t, r.score, r.source, short);
    }
  }

  // For an existing categories list, infer which topic each belongs to.
  categorizeCategories(categories) {
    const keywordToTopic = {
      // AI / LLM
      ai: "AI / LLM", "artificial intelligence": "AI / LLM", "machine learning": "AI / LLM",
      chatbot: "AI / LLM", gpt: "AI / LLM", llm: "AI / LLM",
      // Dev
      coding: "Software Development", programming: "Software Development", developer: "Software Development",
      github: "Open Source", "open source": "Open Source", "open-source": "Open Source",
      // Security / privacy
      vpn: "Privacy", proxy: "Privacy", privacy: "Privacy", security: "Security",
      antivirus: "Security", "anti-malware": "Security", cybersecurity: "Security",
      // Media
      streaming: "Media", movies: "Media", music: "Media", videos: "Media", tv: "Media",
      anime: "Entertainment", comics: "Entertainment", memes: "Entertainment",
      torrent: "Media", downloader: "Media",
      // Web
      hosting: "Cloud / VPS", dns: "Networking", domain: "Web Development", blog: "Web Development",
      forum: "Community", reddit: "Community", "social media": "Social Media",
      // Tools
      tool: "Tools", software: "Software", pdf: "Tools", editing: "Tools", image: "Tools",
      // News
      news: "News",
      // Money
      crypto: "Cryptocurrency", bitcoin: "Cryptocurrency", blockchain: "Cryptocurrency",
      // Work
      job: "Jobs", career: "Jobs",
      // Shop
      shopping: "Shopping", shop: "Shopping", store: "Shopping",
      // Search
      "search engine": "Search", search: "Search",
      // Mobile
      apk: "Android", android: "Android",
      // Books
      book: "Books", ebook: "Books",
      // Other
      extension: "Browser Extensions", browser: "Browser Extensions",
      motor: "Automotive", car: "Automotive",
    };
    return categories.map(c => {
      const name = c.name.toLowerCase();
      const topics = new Set();
      for (const [kw, topic] of Object.entries(keywordToTopic)) {
        if (name.includes(kw)) topics.add(topic);
      }
      return { name: c.name, slug: c.slug, topics: Array.from(topics) };
    });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const td = new TopicDiscovery({});
  const result = td.analyze();
  console.log(`Discovered ${result.topics.length} topics from project:`);
  for (const t of result.topics.slice(0, 20)) {
    console.log(`  ${t.topic.padEnd(28)}  score=${t.score.toFixed(2).padStart(6)}  signals=${t.signals}  conf=${t.confidence.toFixed(2)}`);
  }
}
