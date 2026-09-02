// Source Discovery — multi-source candidate generator.
// Each discoverer returns a list of {domain, url, topics, source_type, discovered_from}.
// No third-party APIs required for the core flow — uses DuckDuckGo, Reddit JSON, HN Algolia.

import https from "node:https";
import { URL } from "node:url";

const UA = "LinksHub-Intelligence/1.0 (+autonomous-domain-discovery)";

function httpGet(url, { timeout = 15000, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      timeout,
      headers: { "User-Agent": UA, Accept: "application/json, text/html;q=0.9, */*;q=0.5", ...headers },
    }, (res) => {
      // Follow 1 redirect
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        const next = new URL(res.headers.location, url).toString();
        return resolve(httpGet(next, { timeout, headers }));
      }
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        resolve({ status: res.statusCode, headers: res.headers, body });
      });
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }

function domainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, "").toLowerCase(); } catch { return null; }
}

// ---------------- DuckDuckGo HTML search (no API key needed) ----------------
export async function discoverDuckDuckGo(query, { limit = 20 } = {}) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  let body;
  try { ({ body } = await httpGet(url, { timeout: 12000 })); } catch { return []; }
  if (!body) return [];

  // DDG result links look like: <a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2F&...">Title</a>
  const results = [];
  const re = /<a[^>]+class="result__a"[^>]+href="[^"]*uddg=([^&"]+)[^"]*"[^>]*>([^<]+)<\/a>/g;
  let m;
  while ((m = re.exec(body)) && results.length < limit) {
    const href = decodeURIComponent(m[1]);
    const title = m[2].replace(/<[^>]+>/g, "").trim();
    const d = domainOf(href);
    if (d) results.push({ domain: d, url: href, title, source_type: "search-result", discovered_from: "duckduckgo" });
  }
  return results;
}

// ---------------- Reddit JSON (no auth) ----------------
export async function discoverReddit(subreddit, { limit = 25, sort = "top", time = "month" } = {}) {
  const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?t=${time}&limit=${limit}`;
  let body;
  try { ({ body } = await httpGet(url, { timeout: 15000 })); } catch { return []; }
  const j = safeJson(body);
  if (!j?.data?.children) return [];
  const results = [];
  const seen = new Set();
  for (const child of j.data.children) {
    const d = child.data || {};
    // Extract outbound URLs from the post body
    const candidates = [];
    if (d.url_overridden_by_dest) candidates.push(d.url_overridden_by_dest);
    if (d.url && /^https?:/.test(d.url)) candidates.push(d.url);
    // Parse domain from selftext if any
    const domainRe = /https?:\/\/([a-z0-9.-]+)/gi;
    let m;
    while ((m = domainRe.exec(d.selftext || ""))) {
      candidates.push(`https://${m[1]}`);
    }
    for (const c of candidates) {
      const dom = domainOf(c);
      if (!dom || seen.has(dom)) continue;
      seen.add(dom);
      results.push({
        domain: dom,
        url: c.startsWith("http") ? c : `https://${dom}`,
        title: d.title,
        subreddit,
        source_type: "community",
        discovered_from: `reddit:r/${subreddit}`,
      });
    }
    if (results.length >= limit) break;
  }
  return results;
}

// ---------------- Hacker News (Algolia search — public, no auth) ----------------
export async function discoverHackerNews(query, { limit = 20 } = {}) {
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=${limit}`;
  let body;
  try { ({ body } = await httpGet(url, { timeout: 12000 })); } catch { return []; }
  const j = safeJson(body);
  if (!j?.hits) return [];
  const results = [];
  for (const h of j.hits) {
    const targetUrl = h.url || `https://news.ycombinator.com/item?id=${h.objectID}`;
    const dom = domainOf(targetUrl) || "news.ycombinator.com";
    results.push({
      domain: dom,
      url: targetUrl,
      title: h.title,
      source_type: "discussion",
      discovered_from: "hackernews",
      points: h.points,
    });
  }
  // Also always include news.ycombinator.com itself
  results.push({
    domain: "news.ycombinator.com",
    url: "https://news.ycombinator.com",
    title: "Hacker News",
    source_type: "discussion",
    discovered_from: "hackernews",
  });
  return results;
}

// ---------------- GitHub topic search (public REST) ----------------
export async function discoverGitHub(query, { limit = 15 } = {}) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=${limit}`;
  let body;
  try { ({ body } = await httpGet(url, { timeout: 15000, headers: { Accept: "application/vnd.github+json" } })); } catch { return []; }
  const j = safeJson(body);
  if (!j?.items) return [];
  const results = [];
  for (const repo of j.items) {
    const owner = (repo.owner?.login || "").toLowerCase();
    results.push({
      domain: "github.com",
      url: repo.html_url,
      title: repo.full_name,
      description: repo.description,
      source_type: "code-repository",
      discovered_from: `github:${owner}`,
      stars: repo.stargazers_count,
      topics: repo.topics || [],
      language: repo.language,
    });
  }
  return results;
}

// ---------------- Web URL validator ----------------
export async function validateUrl(url, { timeout = 8000 } = {}) {
  try {
    const res = await httpGet(url, { timeout, headers: { "User-Agent": UA } });
    const ok = res.status >= 200 && res.status < 400;
    // Detect redirect target
    const finalUrl = res.url || url;
    const finalDomain = domainOf(finalUrl) || domainOf(url);
    return {
      ok,
      status: res.status,
      finalUrl,
      finalDomain,
      redirect: finalDomain !== domainOf(url),
    };
  } catch (e) {
    return { ok: false, error: e.message, status: 0 };
  }
}

// ---------------- Heuristic scoring ----------------
const TRUSTED_DOMAINS = new Set([
  "github.com", "news.ycombinator.com", "reddit.com", "wikipedia.org", "wikimedia.org",
  "mozilla.org", "developer.mozilla.org", "w3.org", "w3schools.com",
  "stackoverflow.com", "stackexchange.com", "arxiv.org", "nist.gov", "ietf.org",
  "owasp.org", "krebsonsecurity.com", "schneier.com",
  // AI / dev
  "openai.com", "anthropic.com", "ai.google", "deepmind.google", "huggingface.co",
  "replicate.com", "kaggle.com", "paperswithcode.com",
  // News / tech
  "arstechnica.com", "wired.com", "theverge.com", "techcrunch.com",
  "nytimes.com", "bbc.com", "reuters.com", "theguardian.com",
  // Dev docs
  "npmjs.com", "pypi.org", "crates.io", "maven.org", "docker.com",
]);

const SPAM_INDICATORS = /(casino|porn|xxx|gambling|crypto-?airdrop|free-?money|cheap-shoes|replica|knock-?off|crack-|torrent-?free)/i;
const SEO_FARM_INDICATORS = /(\.xyz|\.top|\.click|\.loan|\.review|\.work|\.download)(?:\/|$)/i;

export function scoreSource({ domain, source_type, discovered_from, title, points, stars, description }) {
  if (SPAM_INDICATORS.test(domain) || SPAM_INDICATORS.test(title || "")) {
    return { authority: 0.05, relevance: 0, freshness: 0, reason: "spam indicator" };
  }
  if (SEO_FARM_INDICATORS.test(domain)) {
    return { authority: 0.1, relevance: 0, freshness: 0, reason: "seo-farm tld" };
  }

  // Authority
  let authority = 0.5;
  if (TRUSTED_DOMAINS.has(domain)) authority = 0.95;
  else if (domain.endsWith(".gov") || domain.endsWith(".edu")) authority = 0.95;
  else if (domain.endsWith(".org")) authority = 0.75;
  else if (source_type === "code-repository") authority = 0.7;
  else if (source_type === "community") authority = 0.6;

  // Freshness (rough: assume fresh if discovered recently, no direct way to know)
  const freshness = 0.7;

  // Relevance — based on source type and engagement signals
  let relevance = 0.5;
  if (source_type === "code-repository") relevance = 0.7;
  if (source_type === "official-documentation") relevance = 0.95;
  if (source_type === "discussion" && (points || 0) > 100) relevance = 0.85;
  if (source_type === "community" && (points || 0) > 500) relevance = 0.8;
  if (stars && stars > 1000) relevance = Math.min(0.95, relevance + 0.1);

  return { authority, relevance, freshness };
}
