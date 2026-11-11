#!/usr/bin/env node
// Zerosolved Reel Maker — renders a reel spec (JSON) to a 1080×1920 MP4.
//
//   node render.mjs specs/<id>.json             full render → ../output/video/<id>.mp4
//   node render.mjs specs/<id>.json --preview   layout check + one still per scene → previews/<id>/sheet.png
//   options: --out <file.mp4>  --fps 30  --at 3.5,12  (extra preview stills)  --no-music

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";
import { makeMusic } from "./lib/music.mjs";
import { redact } from "./lib/secrets.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const specPath = args.find((a) => a.endsWith(".json"));
if (!specPath) { console.error("usage: node render.mjs specs/<id>.json [--preview] [--out file.mp4]"); process.exit(1); }

const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
const id = spec.id || path.basename(specPath, ".json");
const fps = Number(opt("--fps", spec.fps || 30));
const preview = flag("--preview");

// ---------- validate spec ----------
const TYPES = ["intro", "today", "rows", "list", "cards", "compare", "end"];
const errors = [];
// id names files and folders (previews/<id>, output/video/<id>.mp4): no paths allowed.
if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) errors.push(`id "${id}" must use only a–z, 0–9 and "-" (it becomes a file name)`);
const OUTPUT_DIR = path.resolve(HERE, "..", "output");
const outArg = opt("--out", null);
if (outArg != null) {
  const rel = path.relative(OUTPUT_DIR, path.resolve(outArg));
  if (!/\.mp4$/i.test(outArg) || rel.startsWith("..") || path.isAbsolute(rel)) errors.push(`--out must be an .mp4 inside ${OUTPUT_DIR}`);
}
if (!Array.isArray(spec.scenes) || !spec.scenes.length) errors.push("spec.scenes must be a non-empty array");
(spec.scenes || []).forEach((s, i) => {
  if (!TYPES.includes(s.type)) errors.push(`scene ${i + 1}: unknown type "${s.type}" (use ${TYPES.join(", ")})`);
  if (!(s.duration > 0)) errors.push(`scene ${i + 1}: duration must be > 0`);
});
const total = (spec.scenes || []).reduce((n, s) => n + (s.duration || 0), 0);
if (total < 30 || total > 45) errors.push(`total duration ${total.toFixed(1)}s is outside 30–45s`);
const raw = JSON.stringify({ ...spec, source: undefined, sourceFile: undefined });
if (/ZeroSolved(?!-Promo)/.test(raw)) errors.push('write "Zerosolved", not "ZeroSolved"');
// reel-playbook rules (.claude/skills/reel-playbook/SKILL.md)
const sc = spec.scenes || [];
const last = sc[sc.length - 1];
if (!last || last.type !== "end") errors.push("the last scene must be an end card");
else if ((last.cta || "") !== "Explore Zerosolved.com →") errors.push('end-card CTA must be exactly "Explore Zerosolved.com →"');
if (sc[0] && sc[0].type !== "intro") errors.push("scene 1 must be the short intro logo sting");
if (/!/.test(sc.map((s) => [s.headline, s.kicker, s.sub].join(" ")).join(" "))) errors.push("no exclamation marks in headlines, kickers or subs");
const warns = [];
if (sc[0] && sc[0].type === "intro" && (sc[0].duration > 2 || sc[0].line1 || sc[0].line2)) warns.push("intro should be a 1.5–2s logo sting with no text lines (hook comes next)");
if (sc.length !== 6) warns.push(`playbook arc is 6 scenes (this spec has ${sc.length})`);
if (total < 32 || total > 37) warns.push(`playbook target is 32–37s (this spec is ${total.toFixed(1)}s)`);
sc.forEach((s, i) => { if (Math.abs(s.duration * 2 - Math.round(s.duration * 2)) > 1e-9) warns.push(`scene ${i + 1}: duration should be a multiple of 0.5s (beat grid)`); });
// The numbers rule: every number on screen must come from the case file, never invented.
// Brand constants count only inside their own phrases: 971 case files, 18 categories, 9 modules, "case in 30 seconds".
const BRAND_PHRASES = /\b(971 case files|18 categories|9 modules|30 seconds)\b/gi;
const NON_SCREEN_KEYS = new Set(["type", "icon", "color", "labelColor", "tagColor", "variant", "glow", "cardGlow", "duration", "glowY", "stagger"]);
// NFKC turns full-width and other look-alike digits into ASCII. An ISO date is one token, so a date
// can't vouch for a bare year, and a number shown with % must appear with % in the source.
const ISO_DATE = /\d{4}-\d{2}-\d{2}/g;
const numsIn = (txt) => {
  const t = String(txt).normalize("NFKC");
  const rest = t.replace(ISO_DATE, " ").replace(BRAND_PHRASES, " ");
  return [...(t.match(ISO_DATE) || []), ...(rest.match(/\d[\d,.]*\d%?|\d%?/g) || []).map((n) => n.replace(/,/g, "").replace(/\.$/, ""))];
};
const SOURCES_DIR = path.join(HERE, "sources");
const sourcePath = spec.sourceFile ? path.resolve(path.dirname(specPath), spec.sourceFile) : path.join(SOURCES_DIR, `${id}.txt`);
const inSources = !path.relative(SOURCES_DIR, sourcePath).startsWith("..") && !path.isAbsolute(path.relative(SOURCES_DIR, sourcePath));
if (!inSources) {
  errors.push(`"sourceFile" must be a file inside reel-maker/sources/ (got ${sourcePath})`);
} else if (!fs.existsSync(sourcePath)) {
  errors.push(`no case-file source at ${sourcePath} — save it first (node fetch-page.mjs <url> > sources/${id}.txt) or set "sourceFile"`);
} else {
  const sourceNums = new Set(numsIn(fs.readFileSync(sourcePath, "utf8")));
  for (const n of [...sourceNums]) if (n.endsWith("%")) sourceNums.add(n.slice(0, -1));
  const unsourced = new Map();
  const check = (txt, where) => {
    if (/[^\d\P{Nd}]/u.test(String(txt).normalize("NFKC").replace(/[0-9]/g, ""))) errors.push(`non-ASCII digits are not allowed on screen @ ${where}`);
    for (const n of numsIn(txt)) if (!sourceNums.has(n)) unsourced.set(`${n} @ ${where}: "${String(txt).slice(0, 70)}"`, true);
  };
  const walk = (v, where, key) => {
    if (NON_SCREEN_KEYS.has(key)) return;
    if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${where}[${i}]`, key));
    else if (v && typeof v === "object" && typeof v.value === "number" && "label" in v) {
      check(`${v.value}${v.suffix ?? "%"}`, `${where}.value`); // a stat bar shows value + suffix (default %)
      for (const [k, x] of Object.entries(v)) if (k !== "value") walk(x, `${where}.${k}`, k);
    }
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, `${where}.${k}`, k);
    else if (typeof v === "string" || typeof v === "number") check(v, where);
  };
  (spec.scenes || []).forEach((s, i) => walk(s, `scene ${i + 1} (${s.type})`, ""));
  walk(spec.headerStat, "headerStat", "headerStat");
  for (const u of unsourced.keys()) errors.push(`number not found in the case file (${path.basename(sourcePath)}): ${u}`);
}
// Icon names become file paths under node_modules/lucide-static/icons: plain names only.
JSON.stringify(spec, (k, v) => { if (k === "icon" && typeof v === "string" && !/^[a-z0-9-]+$/.test(v)) errors.push(`icon "${v}" is not a Lucide icon name`); return v; });
// Spec text is echoed in errors and logs: mask anything that looks like a credential.
if (errors.length) { console.error(redact("Spec errors:\n - " + errors.join("\n - "))); process.exit(2); }
if (warns.length) console.warn(redact("PLAYBOOK WARNINGS:\n - " + warns.join("\n - ")));

// ---------- icons ----------
const iconNames = new Set(["check", "sparkles"]);
JSON.stringify(spec, (k, v) => { if (k === "icon" && typeof v === "string") iconNames.add(v); return v; });
const icons = {};
for (const n of iconNames) {
  const f = path.join(HERE, "node_modules/lucide-static/icons", `${n}.svg`);
  if (!fs.existsSync(f)) { console.error(`Unknown icon "${n}" — pick one from node_modules/lucide-static/icons`); process.exit(2); }
  icons[n] = fs.readFileSync(f, "utf8").replace(/<!--[\s\S]*?-->/g, "");
}

// ---------- browser ----------
function findBrowser() {
  const c = [process.env.CHROME_PATH, process.env.EDGE_PATH,
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/chromium"].filter(Boolean);
  const f = c.find((p) => fs.existsSync(p));
  if (!f) throw new Error("No Chrome/Edge found. Set CHROME_PATH.");
  return f;
}

const browser = await puppeteer.launch({
  executablePath: findBrowser(),
  headless: true,
  args: ["--allow-file-access-from-files", "--force-color-profile=srgb", "--hide-scrollbars", "--disable-gpu-vsync", "--mute-audio"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("page error:", redact(e.message)));
// The page may load only the template and the local fonts: no network, no other local files.
const PAGE_FILES = [path.join(HERE, "template"), path.join(HERE, "node_modules", "@fontsource")];
await page.setRequestInterception(true);
page.on("request", (req) => {
  const u = req.url();
  if (u.startsWith("data:") || u.startsWith("about:")) return req.continue();
  if (u.startsWith("file:")) {
    const p = fileURLToPath(u);
    if (PAGE_FILES.some((d) => { const r = path.relative(d, p); return r && !r.startsWith("..") && !path.isAbsolute(r); })) return req.continue();
  }
  console.error(`renderer blocked a request: ${u.slice(0, 120)}`);
  req.abort();
});
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(HERE, "template/index.html")).href, { waitUntil: "load" });
const info = await page.evaluate(async (data) => { const r = window.__init(data); await document.fonts.ready; return r; }, { ...spec, icons });
const fontsOk = await page.evaluate(() => ["700 40px Sora", "400 20px Inter", "400 20px 'JetBrains Mono'"].every((f) => document.fonts.check(f)));
if (!fontsOk) console.warn("WARNING: brand fonts did not load — check node_modules/@fontsource");

const lint = await page.evaluate(() => window.__lint());
console.log(`spec: ${id} · ${spec.scenes.length} scenes · ${info.duration.toFixed(2)}s`);
console.log(lint.length ? redact("LAYOUT WARNINGS:\n - " + lint.join("\n - ")) : "layout: OK (all content inside the safe area)");

function run(cmd, a, input) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, a, { stdio: [input ? "pipe" : "ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => (code === 0 ? res() : rej(new Error(`${cmd} exited ${code}\n${err.slice(-2000)}`))));
    if (input) input(p.stdin);
  });
}

if (preview) {
  const dir = path.join(HERE, "previews", id);
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) if (/^(still_.*\.png|sheet\.jpg|list\.txt)$/.test(f)) fs.unlinkSync(path.join(dir, f)); // only what preview writes
  const times = [];
  let t = 0;
  for (const s of spec.scenes) { times.push(+(t + s.duration - 0.45).toFixed(2)); t += s.duration; }
  for (const x of String(opt("--at", "")).split(",").filter(Boolean)) times.push(Number(x));
  let k = 0;
  for (const tt of times) {
    await page.evaluate((x) => window.__seek(x), tt);
    await page.screenshot({ path: path.join(dir, `still_${String(++k).padStart(2, "0")}_${tt}s.png`) });
  }
  const cols = Math.min(4, times.length), rows = Math.ceil(times.length / cols);
  const list = fs.readdirSync(dir).filter((f) => f.endsWith(".png")).sort();
  fs.writeFileSync(path.join(dir, "list.txt"), list.map((f) => `file '${f}'`).join("\n"));
  await run("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", path.join(dir, "list.txt"),
    "-vf", `scale=360:-1,tile=${cols}x${rows}:padding=8:color=0x222222`, "-frames:v", "1", path.join(dir, "sheet.jpg")]);
  fs.unlinkSync(path.join(dir, "list.txt"));
  console.log(`preview: ${times.length} stills + contact sheet in ${dir}`);
  await browser.close();
  process.exit(0);
}

// ---------- full render ----------
const outFile = path.resolve(opt("--out", path.join(HERE, "..", "output", "video", `${id}.mp4`)));
fs.mkdirSync(path.dirname(outFile), { recursive: true });
const tmp = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TEMP || process.env.TMPDIR || "/tmp"), "zsreel-"));
const wav = path.join(tmp, "music.wav");
const noMusic = flag("--no-music");
if (!noMusic) {
  const m = spec.music || {};
  fs.writeFileSync(wav, makeMusic({ duration: info.duration, cuts: info.cuts, bpm: m.bpm || 120, seed: m.seed || 7, progression: m.progression }));
}

const frames = Math.round(info.duration * fps);
const silent = path.join(tmp, "video.mp4");
const t0 = Date.now();
await run("ffmpeg", ["-y", "-v", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
  "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-profile:v", "high", "-r", String(fps), silent],
  async (stdin) => {
    for (let i = 0; i < frames; i++) {
      await page.evaluate((x) => window.__seek(x), i / fps);
      const jpg = await page.screenshot({ type: "jpeg", quality: 94, optimizeForSpeed: true });
      if (!stdin.write(jpg)) await new Promise((r) => stdin.once("drain", r));
      if (i % fps === 0) process.stdout.write(`\rframe ${i}/${frames} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
    stdin.end();
  });
process.stdout.write(`\rframes: ${frames} rendered in ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
await browser.close();

if (noMusic) fs.copyFileSync(silent, outFile);
else await run("ffmpeg", ["-y", "-v", "error", "-i", silent, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
  "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-shortest", "-movflags", "+faststart", outFile]);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`done: ${outFile}`);
