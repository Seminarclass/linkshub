// One-shot server: hosts the intelligence HTTP API for testing.
import express from "express";
import cors from "cors";
import { mountIntelligenceApi } from "./api.js";

const app = express();
app.use(cors());
app.use(express.json());
mountIntelligenceApi(app);

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Intelligence API on http://0.0.0.0:${PORT}`);
  console.log(`  GET  /api/intelligence/stats`);
  console.log(`  GET  /api/intelligence/topics`);
  console.log(`  GET  /api/intelligence/sources?topic=AI&limit=20`);
  console.log(`  POST /api/intelligence/cycle  body: {validate, maxTopics, maxValidations}`);
  console.log(`  GET  /api/intelligence/audit?lines=20`);
  console.log(`  GET  /api/intelligence/cycles`);
});
