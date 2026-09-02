// HTTP control plane for the intelligence layer.
// Exposes: trigger cycle, view stats, query registry, list audit log.
import express from "express";
import { SourceRegistry } from "./registry.js";
import { TopicDiscovery } from "./topicDiscovery.js";
import { DiscoveryOrchestrator } from "./orchestrator.js";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

export function mountIntelligenceApi(app) {
  const router = express.Router();
  const registry = new SourceRegistry();
  const orch = new DiscoveryOrchestrator({ registry, topicDiscovery: new TopicDiscovery({ projectRoot: ROOT }) });

  router.get("/stats", (_req, res) => {
    res.json(registry.stats());
  });

  router.get("/topics", (_req, res) => {
    const { topics } = new TopicDiscovery({ projectRoot: ROOT }).analyze();
    res.json({ count: topics.length, topics: topics.slice(0, 50) });
  });

  router.get("/sources", (req, res) => {
    const { topic, status, minRelevance, limit } = req.query;
    const list = registry.list({
      topic, status,
      minRelevance: minRelevance ? Number(minRelevance) : 0,
      limit: limit ? Number(limit) : 100,
    });
    res.json({ count: list.length, sources: list });
  });

  router.post("/cycle", async (req, res) => {
    const { validate = true, maxTopics = 20, maxValidations = 10 } = req.body || {};
    try {
      const r = await orch.runHourlyCycle({ validate, maxTopics, maxValidations });
      res.json(r);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/audit", (req, res) => {
    const lines = req.query.lines ? Number(req.query.lines) : 50;
    const file = path.resolve(ROOT, "data", "audit.jsonl");
    if (!fs.existsSync(file)) return res.json({ count: 0, entries: [] });
    const all = fs.readFileSync(file, "utf8").trim().split("\n");
    const entries = all.slice(-lines).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean).reverse();
    res.json({ count: entries.length, entries });
  });

  router.get("/cycles", (req, res) => {
    const file = path.resolve(ROOT, "data", "cycle-reports.jsonl");
    if (!fs.existsSync(file)) return res.json({ count: 0, cycles: [] });
    const all = fs.readFileSync(file, "utf8").trim().split("\n");
    const cycles = all.slice(-10).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean).reverse();
    res.json({ count: cycles.length, cycles });
  });

  app.use("/api/intelligence", router);
  return orch;
}
