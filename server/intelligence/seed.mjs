// Seed the registry from the project's existing categories.json.
// This brings the intelligence layer up-to-date with what the project already knows.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SourceRegistry } from "./registry.js";
import { TopicDiscovery } from "./topicDiscovery.js";
import { audit } from "./audit.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// server/intelligence -> server -> project root
const ROOT = path.resolve(__dirname, "..", "..");

const registry = new SourceRegistry();
const td = new TopicDiscovery({ projectRoot: ROOT });

// Infer topic for each category using the existing categorizer
const categories = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "data", "categories.json"), "utf8"));
const topicMap = new Map();
for (const c of td.categorizeCategories(categories)) {
  topicMap.set(c.name, c.topics);
}

let added = 0, updated = 0, skipped = 0;
for (const cat of categories) {
  const topics = topicMap.get(cat.name) || ["Web Resources"];
  for (const [sectionName, items] of Object.entries(cat.sections)) {
    for (const item of items) {
      const domain = (() => {
        try { return new URL(item.url).hostname.replace(/^www\./, "").toLowerCase(); } catch { return null; }
      })();
      if (!domain) { skipped++; continue; }
      const result = registry.upsert({
        domain,
        url: item.url,
        topics: [...topics, cat.name, sectionName].filter(Boolean),
        subtopics: [sectionName],
        source_type: item.url.includes("github.com") ? "code-repository" : "web-resource",
        relevance_score: 0.7,
        authority_score: 0.6,
        freshness_score: 0.5,
        discovered_from: `seed:categories.json#${cat.slug}`,
        notes: item.name,
      });
      if (result.action === "ADDED") added++;
      else updated++;
    }
  }
  if (added % 500 === 0) {
    process.stdout.write(`\r  Seeded ${added}…`);
  }
}

registry.save();
console.log(`\n✅ Seeded registry: ${added} added, ${updated} updated, ${skipped} skipped.`);
console.log(`   Total sources: ${Object.keys(registry.sources).length}`);
audit({ action: "CYCLE_COMPLETE", topic: "system", reason: "seed", verificationResult: "ok" });
