// Topic-specific discovery orchestrator.
// Given a topic taxonomy, for each topic:
//   1. Build a search query
//   2. Discover candidates from multiple sources
//   3. Validate each candidate URL
//   4. Score and persist to registry
//   5. Audit-log every change
import fs from "node:fs";
import { SourceRegistry } from "./registry.js";
import {
  discoverDuckDuckGo, discoverReddit, discoverHackerNews, discoverGitHub,
  validateUrl, scoreSource,
} from "./sources.js";
import { TopicDiscovery } from "./topicDiscovery.js";
import { audit } from "./audit.js";

// Topic → query templates. Add new topics freely; the system maps them automatically.
const TOPIC_QUERIES = {
  "AI / LLM":          ["best LLM APIs 2026", "open source LLM benchmarks", "AI agent frameworks", "prompt engineering guide"],
  "Software Development": ["modern software development practices 2026", "developer productivity tools", "open source coding assistants"],
  "Frontend":          ["React performance 2026", "Vite vs Next.js 2026", "modern CSS framework comparison"],
  "Backend":           ["Node.js best practices 2026", "API design patterns", "serverless vs containers"],
  "APIs":              ["REST API design", "GraphQL vs REST", "API authentication best practices"],
  "DevOps":            ["CI/CD best practices 2026", "infrastructure as code", "container security"],
  "Cloud / VPS":       ["cheapest VPS for hosting", "Hetzner vs OVH vs DigitalOcean", "self-hosting guide"],
  "Security":          ["OWASP top 10 2026", "web application security", "vulnerability disclosure"],
  "Privacy":           ["privacy tools 2026", "anonymous browsing", "end-to-end encrypted email"],
  "Android":           ["Android development 2026", "Android security best practices", "Kotlin vs Java Android"],
  "iOS":               ["iOS development 2026", "SwiftUI tutorials", "iOS app distribution"],
  "Mobile Development": ["mobile app development 2026", "React Native vs Flutter", "cross-platform frameworks"],
  "Databases":         ["SQLite vs PostgreSQL", "database indexing strategies", "embedded databases 2026"],
  "Web Development":   ["web development 2026", "modern web framework comparison", "web performance optimization"],
  "SEO":               ["SEO best practices 2026", "core web vitals", "JSON-LD structured data"],
  "Performance":       ["web performance 2026", "frontend optimization", "caching strategies"],
  "Email":             ["self-hosted email server", "SMTP protocol explained", "anti-spam techniques"],
  "Networking":        ["DNS providers comparison", "TCP/IP fundamentals", "network security"],
  "Browser Extensions": ["Chrome extension development 2026", "Firefox add-on review"],
  "Cryptocurrency":    ["cryptocurrency exchanges 2026", "self-custody wallets", "blockchain explorers"],
  "Open Source":       ["trending open source projects", "open source licenses comparison"],
  "Search":            ["alternative search engines 2026", "private search engines"],
  "Research":          ["research paper repositories", "academic search engines"],
  "News":              ["technology news sites", "reliable world news sources"],
  "Media":             ["streaming platforms comparison", "video streaming technologies"],
  "Entertainment":     ["anime streaming sites", "comic reader sites"],
  "Tools":             ["best online tools 2026", "productivity tools for developers"],
  "Software":          ["software discovery platforms", "alternative software directories"],
  "Community":         ["developer communities", "tech discussion forums"],
  "Social Media":      ["social media platforms comparison"],
  "Shopping":          ["online shopping platforms"],
  "Books":             ["ebook repositories 2026", "free programming books"],
  "Jobs":              ["developer job boards 2026", "remote tech jobs"],
  "CI/CD":             ["GitHub Actions best practices", "GitLab CI vs Jenkins"],
  "Testing":           ["software testing best practices", "E2E testing frameworks"],
  "Real-time":         ["WebSocket vs Server-Sent Events", "real-time app architectures"],
  "Encoding":          ["character encoding best practices", "base64 vs base32"],
  "Game Development":  ["game engines comparison 2026", "indie game development resources"],
  "Automotive":        ["automotive news sites", "car comparison sites"],
};

const REDDIT_SUBS = {
  "AI / LLM": ["LocalLLaMA", "MachineLearning", "artificial", "ChatGPT"],
  "Software Development": ["programming", "webdev", "ExperiencedDevs"],
  "Frontend": ["reactjs", "vuejs", "sveltejs"],
  "Backend": ["node", "golang", "rust"],
  "Security": ["netsec", "cybersecurity", "AskNetsec"],
  "Privacy": ["privacy", "selfhosted"],
  "Self-hosting / Cloud": ["selfhosted", "homelab"],
  "Web Development": ["webdev"],
  "Open Source": ["opensource", "github"],
  "Cryptocurrency": ["CryptoCurrency", "Bitcoin", "ethereum"],
  "Android": ["androiddev", "Android"],
  "iOS": ["iOSProgramming"],
  "Game Development": ["gamedev", "unity3d", "unrealengine"],
  "Entertainment": ["anime", "manga"],
  "Media": ["cordcutters", "Streaming"],
  "Mobile Development": ["iOSProgramming", "androiddev"],
  "Search": ["DuckDuckGo"],
  "Books": ["books"],
  "Jobs": ["cscareerquestions", "forhire"],
  "DevOps": ["devops", "sysadmin"],
  "Databases": ["PostgreSQL", "SQLite", "mongodb"],
  "Networking": ["networking", "sysadmin"],
};

export class DiscoveryOrchestrator {
  constructor({ registry, topicDiscovery } = {}) {
    this.registry = registry || new SourceRegistry();
    this.topicDiscovery = topicDiscovery || new TopicDiscovery({});
  }

  // Build a dynamic topic taxonomy from the project
  buildTaxonomy() {
    const { topics } = this.topicDiscovery.analyze();
    // Map the discovered topics to our query templates; add fallbacks for known ones
    const taxonomy = [];
    for (const t of topics) {
      const queries = TOPIC_QUERIES[t.topic] || [`best ${t.topic} resources 2026`, `top ${t.topic} websites`];
      const subs = REDDIT_SUBS[t.topic] || [];
      taxonomy.push({ topic: t.topic, score: t.score, confidence: t.confidence, queries, subreddits: subs });
    }
    return taxonomy;
  }

  // One full discovery cycle for a single topic
  async discoverTopic(topic, { validate = true, maxValidations = 25 } = {}) {
    const summary = { topic, candidates: 0, added: 0, updated: 0, removed: 0, duplicates: 0, validationFailures: 0 };
    const candidates = new Map(); // domain -> merged record

    // Discover from each query via DuckDuckGo
    for (const q of (topic.queries || []).slice(0, 2)) {
      const results = await discoverDuckDuckGo(q, { limit: 12 });
      for (const r of results) this.absorb(candidates, r, topic.topic);
    }

    // Reddit
    for (const sub of (topic.subreddits || []).slice(0, 2)) {
      const results = await discoverReddit(sub, { limit: 15 });
      for (const r of results) this.absorb(candidates, r, topic.topic);
    }

    // GitHub
    if (topic.queries?.[0]) {
      const results = await discoverGitHub(topic.queries[0], { limit: 8 });
      for (const r of results) this.absorb(candidates, r, topic.topic);
    }

    // Always check Hacker News
    if (topic.queries?.[0]) {
      const hnResults = await discoverHackerNews(topic.queries[0], { limit: 10 });
      for (const r of hnResults) this.absorb(candidates, r, topic.topic);
    }

    summary.candidates = candidates.size;

    // Validate (limit to top N by heuristic score)
    const ranked = Array.from(candidates.values())
      .map(c => ({ ...c, _score: scoreSource(c) }))
      .sort((a, b) => (b._score.relevance + b._score.authority) - (a._score.relevance + a._score.authority));

    let validated = 0;
    for (const c of ranked) {
      if (validate && validated >= maxValidations) break;
      let validation = { ok: true };
      if (validate) {
        validation = await validateUrl(c.url);
        validated++;
        if (!validation.ok) {
          summary.validationFailures++;
          // Deactivate
          this.registry.deactivate(c.domain, `validation failed: ${validation.status || validation.error}`);
          audit({ action: "VALIDATION_FAILED", topic: topic.topic, domain: c.domain, url: c.url, reason: validation.error || `status ${validation.status}`, verificationResult: "failed" });
          continue;
        }
        if (validation.redirect) {
          // Track redirect
          c.url = validation.finalUrl;
          if (validation.finalDomain && validation.finalDomain !== c.domain) {
            audit({ action: "URL_CHANGED", topic: topic.topic, domain: c.domain, url: validation.finalUrl, reason: "redirect", verificationResult: "ok" });
            c.domain = validation.finalDomain;
          }
        }
      }

      // Dedupe
      const existing = this.registry.get(c.domain);
      if (existing && existing.status === "duplicate") {
        summary.duplicates++;
        continue;
      }
      const result = this.registry.upsert({
        domain: c.domain,
        url: c.url,
        topics: [...new Set([...(existing?.topics || []), c._topic])],
        subtopics: c.subtopics || [],
        source_type: c.source_type,
        relevance_score: c._score.relevance,
        authority_score: c._score.authority,
        freshness_score: c._score.freshness,
        discovered_from: c.discovered_from,
        notes: c.title ? `title: ${c.title.slice(0, 80)}` : "",
      });
      if (result.action === "ADDED") {
        summary.added++;
        audit({ action: "ADDED", topic: topic.topic, domain: c.domain, url: c.url, source: c.discovered_from, verificationResult: "ok" });
      } else {
        summary.updated++;
        audit({ action: "UPDATED", topic: topic.topic, domain: c.domain, url: c.url, source: c.discovered_from, previousStatus: result.previous?.status, newStatus: result.source.status, verificationResult: "ok" });
      }
    }
    return summary;
  }

  absorb(map, r, topicName) {
    if (!r?.domain) return;
    const dom = r.domain.toLowerCase();
    if (!map.has(dom)) {
      map.set(dom, { ...r, _topic: topicName, _firstSeen: Date.now() });
    } else {
      const cur = map.get(dom);
      cur.topics = cur.topics || [];
      if (!cur.topics.includes(topicName)) cur.topics.push(topicName);
      // Keep highest-quality source_type
      if (r.source_type && r.source_type !== "search-result") cur.source_type = r.source_type;
    }
  }

  // Hourly cycle: discover + update + verify
  async runHourlyCycle({ validate = true, maxTopics = 20, maxValidations = 10 } = {}) {
    const startedAt = new Date().toISOString();
    const taxonomy = this.buildTaxonomy().slice(0, maxTopics);
    const cycleReport = {
      startedAt,
      finishedAt: null,
      topicsAnalyzed: taxonomy.map(t => t.topic),
      newDomains: 0,
      newUrls: 0,
      updatedSources: 0,
      removedDeactivated: 0,
      duplicatesMerged: 0,
      validationFailures: 0,
      projectChangesDetected: [],
      perTopic: [],
      overallUpdateStatus: "ok",
      verificationStatus: "pending",
    };

    for (const topic of taxonomy) {
      try {
        const s = await this.discoverTopic(topic, { validate, maxValidations });
        cycleReport.newDomains += s.added;
        cycleReport.updatedSources += s.updated;
        cycleReport.validationFailures += s.validationFailures;
        cycleReport.duplicatesMerged += s.duplicates;
        cycleReport.perTopic.push(s);
      } catch (e) {
        cycleReport.perTopic.push({ topic: topic.topic, error: e.message });
        audit({ action: "VALIDATION_FAILED", topic: topic.topic, reason: e.message, verificationResult: "failed" });
      }
    }

    // Deactivate sources not touched in 30 days with low scores
    this.sweepStale(30);

    // Self-verification: re-load and confirm counts
    cycleReport.finishedAt = new Date().toISOString();
    const stats = this.registry.stats();
    const verify = {
      totalSources: stats.total,
      activeSources: stats.active,
      topicsCovered: stats.topics,
      avgScore: stats.avgScore,
    };
    const ok = verify.totalSources > 0;
    cycleReport.overallUpdateStatus = ok ? "ok" : "warning";
    cycleReport.verificationStatus = ok ? "ok" : "no-sources";

    // Persist the cycle report
    this.appendCycleReport(cycleReport, verify);
    this.registry.save();

    audit({ action: "CYCLE_COMPLETE", topic: "system", reason: "hourly", verificationResult: cycleReport.verificationStatus, source: "orchestrator" });

    return { ...cycleReport, verify };
  }

  sweepStale(daysInactive) {
    const cutoff = Date.now() - daysInactive * 86400_000;
    let removed = 0;
    for (const s of Object.values(this.registry.sources)) {
      if (s.status !== "active") continue;
      const last = new Date(s.last_checked || 0).getTime();
      if (last < cutoff && (s.score || 0) < 0.4) {
        this.registry.deactivate(s.domain, "stale and low-score");
        removed++;
        audit({ action: "DEACTIVATED", domain: s.domain, reason: "stale", verificationResult: "ok" });
      }
    }
    return removed;
  }

  appendCycleReport(report, verify) {
    const file = "data/cycle-reports.jsonl";
    fs.mkdirSync("data", { recursive: true });
    fs.appendFileSync(file, JSON.stringify({ ...report, verify }) + "\n");
  }
}

// Default export for the run script
export default DiscoveryOrchestrator;
