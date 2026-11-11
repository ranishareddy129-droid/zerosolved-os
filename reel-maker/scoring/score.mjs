#!/usr/bin/env node
// Saves and reads reel scores (rubric: scoring/rubric.md). Run from reel-maker/.
//
//   node scoring/score.mjs add --id <spec-id> --date YYYY-MM-DD --case ZS-0089 \
//        --scores hook=4,one_idea=5,density=4,lime=4,catch=5,sources=4,variety=4 \
//        [--log previews/<id>.log] [--warning "..."] [--failed "..."] \
//        [--lead founders] [--notes "..."]
//   node scoring/score.mjs trial --label <change> --id <spec-id> --base-id <scored id> --scores ... [--log ...] [--failed ...]
//   node scoring/score.mjs metrics --id <spec-id> --views N --avg-watch-time S --pct-watched P --shares N --saves N [--post-url URL]
//   node scoring/score.mjs metrics --id <spec-id> --not-published        (looked 3+ days later; no post found)
//   node scoring/score.mjs due-metrics [--today YYYY-MM-DD]              (reels 3+ days old with no Instagram data yet)
//   node scoring/score.mjs rank                                          (best → worst; Instagram results outrank rubric)
//   node scoring/score.mjs status                                        (reels scored since the last improvement + rollback check)
//   node scoring/score.mjs check-protected <base-ref>                    (exit 1 if a protected file changed since <base-ref>)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { findSecrets } from "../lib/secrets.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REEL = path.resolve(HERE, "..");
const ROOT = path.resolve(REEL, "..");
const SCORES = path.join(REEL, "scores.json");
const TRIALS = path.join(REEL, "trials.json");
const IMPROVEMENTS = path.join(REEL, "improvements.md");
const PROTECTED = path.join(ROOT, ".claude", "protected-files.txt");
const KEYS = ["hook", "one_idea", "density", "lime", "catch", "sources", "variety"];
const NUMBERS_RULE = "every number on screen must come from the case file";
const TRUSTED_BASE = "origin/main"; // owner-reviewed branch; protect it on GitHub so only PRs can move it
// Instructions the agent loads on every run, and new case sources (the evidence behind every number
// on screen): changes need the owner's review, never a direct commit.
const REVIEW_PATHS = /^(reel-memory\.md|\.claude\/skills\/auto-[^/]+\/|reel-maker\/sources\/|reel-maker\/improvements\.md$|reel-maker\/approved-reels\.json$)/;

const [cmd, ...rest] = process.argv.slice(2);
const opt = {}; const multi = { warning: [], failed: [] };
for (let i = 0; i < rest.length; i++) {
  if (!rest[i].startsWith("--")) { (opt._ ||= []).push(rest[i]); continue; }
  const k = rest[i].slice(2); const v = rest[i + 1] && !rest[i + 1].startsWith("--") ? rest[++i] : true;
  if (k in multi) multi[k].push(v); else opt[k] = v;
}
const die = (m) => { console.error(m); process.exit(1); };
const readJson = (f, fallback) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : fallback);
const writeJson = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2) + "\n");
// execFileSync (no shell): works even when the system shell setting (ComSpec) is unusual.
const git = (c) => { try { return execFileSync("git", c.split(" ").filter(Boolean), { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { return ""; } };
const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const r2 = (x) => Math.round(x * 100) / 100;

function parseScores(s) {
  if (!s || s === true) die(`--scores is required: ${KEYS.map((k) => k + "=1..5").join(",")}`);
  const out = {};
  for (const part of String(s).split(",")) {
    const [k, v] = part.split("=").map((x) => x.trim());
    if (!KEYS.includes(k)) die(`unknown rubric key "${k}" (keys: ${KEYS.join(", ")})`);
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1 || n > 5) die(`${k} must be a whole number 1–5 (got "${v}")`);
    out[k] = n;
  }
  const missing = KEYS.filter((k) => !(k in out));
  if (missing.length) die(`missing rubric scores: ${missing.join(", ")}`);
  return out;
}

function warningsFromLog(f) {
  if (!f || f === true) return [];
  const p = path.resolve(REEL, f);
  if (!fs.existsSync(p)) die(`log not found: ${f}`);
  const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
  const out = []; let inBlock = false;
  for (const l of lines) {
    if (/^(PLAYBOOK|LAYOUT) WARNINGS:/.test(l)) { inBlock = true; continue; }
    if (inBlock && /^\s+- /.test(l)) { out.push(l.replace(/^\s+- /, "").trim()); continue; }
    inBlock = false;
    if (/^WARNING:|^Spec errors:|^page error:/.test(l)) out.push(l.trim());
  }
  return out;
}

function version() {
  const hash = git("rev-parse HEAD");
  const dirty = git("status --porcelain -- .claude reel-memory.md reel-maker/template reel-maker/render.mjs");
  return { commit: hash || "unknown", uncommittedRuleChanges: !!dirty,
    autoSkills: fs.existsSync(path.join(ROOT, ".claude", "skills"))
      ? fs.readdirSync(path.join(ROOT, ".claude", "skills")).filter((d) => d.startsWith("auto-")) : [] };
}

function igScore(e) { // % watched first, then (shares+saves)/views
  const m = e.instagram; if (!m || m.notPublished || m.pctWatched == null) return null;
  return [Number(m.pctWatched), m.views ? (Number(m.shares || 0) + Number(m.saves || 0)) / Number(m.views) : 0];
}
function ranked(runs) {
  return [...runs].sort((a, b) => {
    const ia = igScore(a), ib = igScore(b);
    if (ia && !ib) return -1; if (ib && !ia) return 1;
    if (ia && ib) return ib[0] - ia[0] || ib[1] - ia[1];
    return b.total - a.total;
  });
}
function improvementRows() {
  if (!fs.existsSync(IMPROVEMENTS)) return [];
  return fs.readFileSync(IMPROVEMENTS, "utf8").split(/\r?\n/)
    .filter((l) => /^\|\s*\d{4}-\d{2}-\d{2}/.test(l))
    .map((l) => { const c = l.split("|").slice(1, -1).map((x) => x.trim());
      return { date: c[0], action: c[1], change: c[2], evidence: c[3], before: c[4], after: c[5], commit: c[6] }; });
}

const data = readJson(SCORES, { note: "One entry per verified reel. Rubric: scoring/rubric.md. Written by scoring/score.mjs.", runs: [] });

switch (cmd) {
  case "add": {
    if (!opt.id) die("--id is required");
    const scores = parseScores(opt.scores);
    const entry = {
      date: opt.date && opt.date !== true ? opt.date : new Date().toISOString().slice(0, 10),
      id: opt.id, caseId: opt.case || null, leadAudience: opt.lead || null,
      scores, total: Object.values(scores).reduce((s, x) => s + x, 0), max: KEYS.length * 5,
      previewWarnings: [...warningsFromLog(opt.log), ...multi.warning],
      failed: multi.failed, version: version(), notes: opt.notes || "",
      scoredAt: new Date().toISOString(),
    };
    const i = data.runs.findIndex((r) => r.id === entry.id);
    if (i >= 0) { entry.instagram = data.runs[i].instagram; entry.rescored = true; data.runs[i] = entry; } else data.runs.push(entry);
    writeJson(SCORES, data);
    console.log(`scored ${entry.id}: ${entry.total}/${entry.max} · ${entry.previewWarnings.length} warning(s) · ${entry.failed.length} failure(s) · ${entry.version.commit.slice(0, 7)}`);
    break;
  }
  case "trial": {
    if (!opt.id || !opt.label) die("--id and --label are required");
    const scores = parseScores(opt.scores);
    const t = readJson(TRIALS, { note: "Preview-only test scores from self-improvement runs. Not real reels.", trials: [] });
    const base = data.runs.find((r) => r.id === opt["base-id"]);
    t.trials.push({ date: new Date().toISOString().slice(0, 10), label: opt.label, id: opt.id, baseId: opt["base-id"] || null,
      baseTotal: base ? base.total : null, scores, total: Object.values(scores).reduce((s, x) => s + x, 0),
      previewWarnings: [...warningsFromLog(opt.log), ...multi.warning], failed: multi.failed, version: version() });
    writeJson(TRIALS, t);
    const mine = t.trials.filter((x) => x.label === opt.label);
    const before = mine.map((x) => x.baseTotal).filter((x) => x != null);
    console.log(`trial "${opt.label}": ${mine.length} scored · avg ${r2(avg(mine.map((x) => x.total)))} vs before ${r2(avg(before))} · failures ${mine.reduce((s, x) => s + x.failed.length, 0)}`);
    break;
  }
  case "metrics": {
    const e = data.runs.find((r) => r.id === opt.id); if (!e) die(`no scored reel with id ${opt.id}`);
    e.instagram = opt["not-published"] ? { notPublished: true, checkedAt: new Date().toISOString() } : {
      views: Number(opt.views), avgWatchTimeSec: Number(opt["avg-watch-time"]), pctWatched: Number(opt["pct-watched"]),
      shares: Number(opt.shares), saves: Number(opt.saves), postUrl: opt["post-url"] || null, fetchedAt: new Date().toISOString() };
    writeJson(SCORES, data); console.log(`instagram metrics saved for ${e.id}`);
    break;
  }
  case "due-metrics": {
    const today = new Date((opt.today && opt.today !== true ? opt.today : new Date().toISOString().slice(0, 10)) + "T00:00:00Z");
    const due = data.runs.filter((r) => !r.instagram && (today - new Date(r.date + "T00:00:00Z")) / 864e5 >= 3);
    if (!due.length) console.log("none due");
    for (const r of due) console.log(`${r.id}\t${r.date}\t${r.caseId || ""}`);
    break;
  }
  case "rank": {
    const withIg = data.runs.filter(igScore).length;
    console.log(`${data.runs.length} reels · ${withIg} with Instagram metrics · ranking by ${withIg >= 6 ? "Instagram % watched" : "Instagram where present, else rubric total"}`);
    ranked(data.runs).forEach((r, i) => {
      const ig = igScore(r);
      console.log(`${i + 1}. ${r.id}\t${r.date}\trubric ${r.total}/${r.max}${ig ? `\twatched ${ig[0]}% · (shares+saves)/views ${r2(ig[1])}` : ""}\t${r.version.commit.slice(0, 7)}${r.failed.length ? "\tFAILED: " + r.failed.join("; ") : ""}`);
    });
    break;
  }
  case "status": {
    const rows = improvementRows();
    const kept = rows.filter((r) => /^kept/i.test(r.action));
    const tested = rows.filter((r) => !/^skipped/i.test(r.action)); // a skipped week doesn't reset the count
    const last = tested.length ? tested[tested.length - 1] : null;
    const since = last ? data.runs.filter((r) => r.date > last.date) : data.runs;
    console.log(`last tested improvement: ${last ? `${last.date} · ${last.action} · ${last.change}` : "none"}`);
    console.log(`reels scored since then: ${since.length} (self-improve needs 5)`);
    const lk = kept[kept.length - 1];
    if (lk) {
      const after = data.runs.filter((r) => r.date > lk.date);
      const before = data.runs.filter((r) => r.date <= lk.date).slice(-5);
      const reverted = rows.some((r) => /^revert/i.test(r.action) && r.commit && lk.commit && r.change.includes(lk.commit.slice(0, 7)));
      const a = avg(after.map((r) => r.total)), b = avg(before.map((r) => r.total));
      console.log(`last kept change ${lk.date} (${lk.commit}): ${after.length} reels after, avg ${r2(a)} · 5 before avg ${r2(b)}`);
      if (!reverted && after.length >= 5 && before.length && a < b) console.log(`ROLLBACK: reels after ${lk.commit} average ${r2(a)} < ${r2(b)} before. git revert ${lk.commit}`);
      else console.log("rollback: not needed" + (after.length < 5 ? " (need 5 reels after the change to judge)" : ""));
    }
    break;
  }
  case "check-protected": {
    const arg = opt._?.[0]; if (!arg) die("usage: check-protected <base-ref>  (e.g. origin/main or a commit hash)");
    if (!git(`rev-parse --verify ${arg}`)) die(`unknown git ref ${arg}`);
    // The caller's ref alone can't be trusted (commit first, then pass HEAD). Always also check
    // against the owner-reviewed branch; fail closed if it is missing.
    if (!git(`rev-parse --verify ${TRUSTED_BASE}`)) die(`trusted base ${TRUSTED_BASE} not found — run git fetch origin (failing closed)`);
    const bases = [...new Set([git(`merge-base HEAD ${TRUSTED_BASE}`), git(`rev-parse ${arg}`)].filter(Boolean))];
    const entries = (txt) => txt.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
    const memNow = fs.existsSync(path.join(ROOT, "reel-memory.md")) ? fs.readFileSync(path.join(ROOT, "reel-memory.md"), "utf8") : "";
    const untracked = git("ls-files --others --exclude-standard").split("\n").filter(Boolean);
    const bad = [], review = [];
    let checked = 0;
    for (const base of bases) {
      // The list comes from the base as well as the working copy, so editing the list can't unprotect a file.
      const list = [...new Set([...entries(git(`show ${base}:.claude/protected-files.txt`)), ...entries(fs.readFileSync(PROTECTED, "utf8"))])];
      checked = Math.max(checked, list.length);
      const changes = git(`diff --name-status ${base}`).split("\n").filter(Boolean).map((l) => { const p = l.split("\t"); return { s: p[0][0], files: p.slice(1) }; });
      for (const { s, files } of changes) for (const f of files) {
        for (const p of list) if (p.endsWith("/") ? f.startsWith(p) && s !== "A" : f === p) bad.push(`${s} ${f}`);
        if (f.startsWith(".claude/skills/reel-playbook/")) bad.push(`reel-playbook must not be edited by agents: ${f}`);
        if (REVIEW_PATHS.test(f)) review.push(`${s} ${f}`);
      }
      // Every numbers-rule line in the base must still be there, word for word.
      for (const l of git(`show ${base}:reel-memory.md`).split(/\r?\n/)) {
        if (l.toLowerCase().includes(NUMBERS_RULE) && !memNow.split(/\r?\n/).includes(l)) bad.push(`reel-memory.md changed or removed the numbers rule line: "${l.slice(0, 80)}…"`);
      }
    }
    for (const f of untracked) if (REVIEW_PATHS.test(f)) review.push(`?? ${f}`);
    // Secret scan: every added, changed or untracked text file (values are printed masked).
    const touched = new Set(untracked);
    for (const base of bases) for (const l of git(`diff --name-only --diff-filter=AMR ${base}`).split("\n").filter(Boolean)) touched.add(l);
    for (const f of touched) {
      const p = path.join(ROOT, f);
      if (!fs.existsSync(p) || !fs.statSync(p).isFile() || fs.statSync(p).size > 2e6) continue;
      const buf = fs.readFileSync(p);
      if (buf.includes(0)) continue; // binary (video, images, fonts)
      for (const h of findSecrets(buf.toString("utf8"))) bad.push(`possible secret in ${f}:${h.line} (${h.kind}: ${h.masked})`);
    }
    if (!memNow.toLowerCase().includes(NUMBERS_RULE)) bad.push(`reel-memory.md no longer states the numbers rule ("${NUMBERS_RULE}")`);
    if (review.length) bad.push(...[...new Set(review)].map((r) => `needs owner review (push to a branch and open a PR, don't commit to main): ${r}`));
    if (bad.length) { console.error("PROTECTED FILES CHANGED — do not commit:\n - " + [...new Set(bad)].join("\n - ")); process.exit(1); }
    console.log(`protected files unchanged since ${bases.map((b) => b.slice(0, 7)).join(" and ")} (${checked} entries checked)`);
    break;
  }
  default:
    die("commands: add | trial | metrics | due-metrics | rank | status | check-protected   (see the header of this file)");
}
