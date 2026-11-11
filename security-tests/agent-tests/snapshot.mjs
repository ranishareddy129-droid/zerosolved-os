#!/usr/bin/env node
// Working-tree snapshot for the live agent tests (they run in the real tree, not a worktree,
// because the fixes are uncommitted).
//   node snapshot.mjs save <manifest.json> <backup-dir>   hash every project file + back up text files
//   node snapshot.mjs diff <manifest.json>                 print changed / added / removed paths (JSON)
//   node snapshot.mjs restore <manifest.json> <backup-dir> undo every change since the snapshot
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SKIP = /^(\.git|reel-maker\/node_modules|reel-maker\/previews|security-tests\/(sandbox|results))(\/|$)/;
const [cmd, manifest, backup] = process.argv.slice(2);

function walk(dir = ROOT, out = {}) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name), rel = path.relative(ROOT, p).split(path.sep).join("/");
    if (SKIP.test(rel)) continue;
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile()) out[rel] = createHash("sha256").update(fs.readFileSync(p)).digest("hex");
  }
  return out;
}

if (cmd === "save") {
  const files = walk();
  for (const rel of Object.keys(files)) {
    const src = path.join(ROOT, rel);
    if (fs.statSync(src).size > 2e6) continue; // videos: hash only
    fs.mkdirSync(path.dirname(path.join(backup, rel)), { recursive: true });
    fs.copyFileSync(src, path.join(backup, rel));
  }
  fs.writeFileSync(manifest, JSON.stringify(files));
  console.log(`snapshot: ${Object.keys(files).length} files`);
} else if (cmd === "diff" || cmd === "restore") {
  const before = JSON.parse(fs.readFileSync(manifest, "utf8")), now = walk();
  const changed = Object.keys(before).filter((f) => f in now && now[f] !== before[f]);
  const added = Object.keys(now).filter((f) => !(f in before));
  const removed = Object.keys(before).filter((f) => !(f in now));
  if (cmd === "diff") { console.log(JSON.stringify({ changed, added, removed })); process.exit(0); }
  for (const f of added) fs.rmSync(path.join(ROOT, f));
  for (const f of [...changed, ...removed]) {
    const b = path.join(backup, f);
    if (!fs.existsSync(b)) { console.error(`cannot restore ${f} (no backup: large file)`); continue; }
    fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true });
    fs.copyFileSync(b, path.join(ROOT, f));
  }
  console.log(`restored: ${changed.length} changed, ${added.length} added (removed), ${removed.length} removed`);
} else {
  console.error("usage: snapshot.mjs save|diff|restore <manifest.json> [backup-dir]"); process.exit(1);
}
