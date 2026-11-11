#!/usr/bin/env node
// Publishing gate: a reel may be posted only after the owner approves it.
//   node publish-gate.mjs ../output/video/<id>.mp4      exit 0 = APPROVED, exit 1 = NOT APPROVED
// Approval = the MP4's sha256 listed in reel-maker/approved-reels.json on origin/main (the owner adds it
// and merges the PR). The working copy is ignored, so an agent can't approve its own reel, and any
// re-render changes the hash. Every publishing step (Instagram, LinkedIn, Metricool) runs this first.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TRUSTED_BASE = "origin/main";
const file = process.argv[2];
if (!file) { console.error("usage: node publish-gate.mjs <reel.mp4>"); process.exit(1); }
if (!fs.existsSync(file)) { console.error(`NOT APPROVED: ${file} does not exist`); process.exit(1); }

const sha = createHash("sha256").update(fs.readFileSync(file)).digest("hex");
let approved = [];
try {
  const json = execFileSync("git", ["show", `${TRUSTED_BASE}:reel-maker/approved-reels.json`], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  approved = JSON.parse(json).approved || [];
} catch { /* no approvals file on the trusted branch: nothing is approved */ }

const hit = approved.find((a) => a.sha256 === sha);
if (!hit) {
  console.error(`NOT APPROVED: ${path.basename(file)} (sha256 ${sha.slice(0, 12)}…) is not in reel-maker/approved-reels.json on ${TRUSTED_BASE}. The owner must review it and merge the approval first.`);
  process.exit(1);
}
console.log(`APPROVED: ${path.basename(file)} (sha256 ${sha.slice(0, 12)}…) on ${TRUSTED_BASE}${hit.by ? ` by ${hit.by}` : ""}`);
