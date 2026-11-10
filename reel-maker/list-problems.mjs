#!/usr/bin/env node
// Lists Zerosolved library problem pages. Prints one "slug<TAB>url" per line.
//
// Primary source: https://zerosolved.com/sitemap.xml (plain HTTP, lists every problem page,
// works in the cloud too). Fallback: the JS-rendered library page in headless Chrome/Edge.
//
//   node list-problems.mjs              → every problem in the library
//   node list-problems.mjs burnout      → only slugs containing "burnout"
//   node list-problems.mjs --random 10  → 10 random problems
import fs from "node:fs";

const args = process.argv.slice(2);
const ri = args.indexOf("--random");
const randomN = ri >= 0 ? Number(args[ri + 1] || 10) : 0;
const filter = args.filter((a, i) => !(ri >= 0 && (i === ri || i === ri + 1)))[0] || "";

async function fromSitemap() {
  const res = await fetch("https://zerosolved.com/sitemap.xml", { headers: { "User-Agent": "Mozilla/5.0 (Zerosolved Reel Maker)" } });
  if (!res.ok) throw new Error(`sitemap HTTP ${res.status}`);
  const xml = await res.text();
  return [...new Set((xml.match(/\/problems\/[a-z0-9-]+/g) || []).map((p) => p.replace("/problems/", "")))];
}

async function fromBrowser() {
  const { default: puppeteer } = await import("puppeteer-core");
  const exe = [process.env.CHROME_PATH, process.env.EDGE_PATH,
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "/usr/bin/google-chrome", "/usr/bin/chromium"].filter(Boolean).find((p) => fs.existsSync(p));
  if (!exe) throw new Error("no Chrome/Edge found (set CHROME_PATH)");
  const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.goto("https://zerosolved.com/problems?category=all&q=", { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForSelector('a[href^="/problems/"]', { timeout: 20000 }).catch(() => {});
  const links = await page.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="/problems/"]')].map((a) => a.getAttribute("href").replace("/problems/", "")))]);
  await browser.close();
  return links;
}

let slugs = [];
try { slugs = await fromSitemap(); } catch (e) { console.error(`sitemap failed (${e.message}); trying the library page`); }
if (!slugs.length) { try { slugs = await fromBrowser(); } catch (e) { console.error(`library page failed (${e.message})`); } }
if (!slugs.length) { console.error("No problems found."); process.exit(1); }

if (filter) slugs = slugs.filter((s) => s.includes(filter.toLowerCase()));
if (randomN) slugs = slugs.map((s) => [Math.random(), s]).sort((a, b) => a[0] - b[0]).slice(0, randomN).map((x) => x[1]);
for (const s of slugs) console.log(`${s}\thttps://zerosolved.com/problems/${s}`);
