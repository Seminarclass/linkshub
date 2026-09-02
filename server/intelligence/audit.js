// Audit log helper — appends one line per significant change to data/audit.jsonl
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIT_PATH = path.resolve(__dirname, "..", "..", "data", "audit.jsonl");

function nowIso() { return new Date().toISOString(); }

export function audit(entry) {
  try {
    fs.mkdirSync(path.dirname(AUDIT_PATH), { recursive: true });
    const line = JSON.stringify({ ts: nowIso(), ...entry });
    fs.appendFileSync(AUDIT_PATH, line + "\n");
  } catch (e) {
    // Never let audit failures break the pipeline
    console.error("audit failed:", e.message);
  }
}
