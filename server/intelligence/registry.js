// Source Registry — the heart of the intelligence layer.
// Central store: every discovered/known source, scored across multiple dimensions.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "..", "..", "data");
const REGISTRY_PATH = path.join(DATA_DIR, "registry.json");
const AUDIT_PATH = path.join(DATA_DIR, "audit.jsonl");

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function nowIso() { return new Date().toISOString(); }

export class SourceRegistry {
  constructor({ path = REGISTRY_PATH } = {}) {
    ensureDataDir();
    this.path = path;
    this.sources = this.load();
  }

  load() {
    if (!fs.existsSync(this.path)) return {};
    try {
      const raw = JSON.parse(fs.readFileSync(this.path, "utf8"));
      return raw.sources || {};
    } catch { return {}; }
  }

  save() {
    const out = { savedAt: nowIso(), count: Object.keys(this.sources).length, sources: this.sources };
    fs.writeFileSync(this.path, JSON.stringify(out, null, 2));
  }

  // Get one source by domain
  get(domain) {
    return this.sources[domain.toLowerCase()] || null;
  }

  // List with optional filters
  list({ topic, status = "active", minRelevance = 0, limit } = {}) {
    let arr = Object.values(this.sources);
    if (status) arr = arr.filter(s => s.status === status);
    if (topic) arr = arr.filter(s => (s.topics || []).includes(topic));
    if (minRelevance) arr = arr.filter(s => (s.relevance_score || 0) >= minRelevance);
    arr.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
    if (limit) arr = arr.slice(0, limit);
    return arr;
  }

  // Add or update a source. Returns { action, source, previous }.
  upsert(input) {
    const domain = input.domain.toLowerCase();
    const previous = this.sources[domain] || null;
    const now = nowIso();

    const merged = {
      domain,
      url: input.url || previous?.url || `https://${domain}`,
      topics: input.topics || previous?.topics || [],
      subtopics: input.subtopics || previous?.subtopics || [],
      source_type: input.source_type || previous?.source_type || "unknown",
      relevance_score: input.relevance_score ?? previous?.relevance_score ?? 0.5,
      authority_score: input.authority_score ?? previous?.authority_score ?? 0.5,
      freshness_score: input.freshness_score ?? previous?.freshness_score ?? 0.5,
      last_checked: now,
      last_updated: now,
      status: input.status || previous?.status || "active",
      discovered_from: input.discovered_from || previous?.discovered_from || "manual",
      notes: input.notes || previous?.notes || "",
      // history of all known topic-specific URLs under this domain
      urls: this.mergeUrls(previous?.urls, input.url),
    };

    // Recompute composite
    merged.score = this.compositeScore(merged);
    this.sources[domain] = merged;
    return { action: previous ? "UPDATED" : "ADDED", source: merged, previous };
  }

  mergeUrls(prev, newUrl) {
    const arr = Array.isArray(prev) ? [...prev] : [];
    if (newUrl && !arr.includes(newUrl)) arr.push(newUrl);
    return arr;
  }

  compositeScore(s) {
    return Math.round(
      ((s.relevance_score || 0) * 0.5 +
        (s.authority_score || 0) * 0.3 +
        (s.freshness_score || 0) * 0.2) * 100
    ) / 100;
  }

  // Deactivate (don't delete, so we can reactivate later if useful again)
  deactivate(domain, reason = "") {
    const s = this.sources[domain.toLowerCase()];
    if (!s) return null;
    s.status = "inactive";
    s.notes = (s.notes ? s.notes + " | " : "") + `deactivated: ${reason}`;
    s.last_updated = nowIso();
    return s;
  }

  // Mark a domain as a duplicate of another
  markDuplicate(domain, canonicalDomain) {
    const s = this.sources[domain.toLowerCase()];
    if (!s) return null;
    s.status = "duplicate";
    s.duplicate_of = canonicalDomain.toLowerCase();
    s.last_updated = nowIso();
    return s;
  }

  // Audit log helper
  static audit({ action, topic, domain, url, reason, source, previousStatus, newStatus, verificationResult }) {
    const line = JSON.stringify({ ts: nowIso(), action, topic, domain, url, reason, source, previousStatus, newStatus, verificationResult });
    fs.appendFileSync(AUDIT_PATH, line + "\n");
  }

  stats() {
    const all = Object.values(this.sources);
    return {
      total: all.length,
      active: all.filter(s => s.status === "active").length,
      inactive: all.filter(s => s.status === "inactive").length,
      duplicates: all.filter(s => s.status === "duplicate").length,
      topics: [...new Set(all.flatMap(s => s.topics || []))].length,
      avgScore: all.length ? Math.round((all.reduce((s, x) => s + (x.score || 0), 0) / all.length) * 100) / 100 : 0,
    };
  }
}
