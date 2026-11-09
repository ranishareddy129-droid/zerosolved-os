#!/usr/bin/env node
// Lists problem pages from the Zerosolved library (the list is rendered by JavaScript,
// so this opens it in headless Edge/Chrome). Prints one "slug<TAB>url" per line.
//   node list-problems.mjs            → first page of the whole library
//   node list-problems.mjs "q=burnout"  → library search / filter query
import fs from "node:fs";
import puppeteer from "puppeteer-core";

const query = process.argv[2] || "category=all&q=";
const exe = [process.env.CHROME_PATH, process.env.EDGE_PATH,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome", "/usr/bin/chromium"].filter(Boolean).find((p) => fs.existsSync(p));
if (!exe) { console.error("No Chrome/Edge found. Set CHROME_PATH."); process.exit(1); }

const browser = await puppeteer.launch({ executablePath: exe, headless: true });
const page = await browser.newPage();
await page.goto(`https://zerosolved.com/problems?${query}`, { waitUntil: "networkidle2", timeout: 60000 });
await page.waitForSelector('a[href^="/problems/"]', { timeout: 30000 }).catch(() => {});
// scroll to load more, if the list grows on scroll
for (let i = 0; i < 6; i++) { await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await new Promise((r) => setTimeout(r, 600)); }
const links = await page.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="/problems/"]')].map((a) => a.getAttribute("href")))]);
await browser.close();
for (const href of links) console.log(`${href.replace("/problems/", "")}\thttps://zerosolved.com${href}`);
if (!links.length) { console.error("No problems found on the library page."); process.exit(1); }
