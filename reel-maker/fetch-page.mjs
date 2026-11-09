#!/usr/bin/env node
// Prints the readable text of a Zerosolved page (server-rendered HTML), for scripting a reel.
//   node fetch-page.mjs https://zerosolved.com/today > sources/today.txt
const url = process.argv[2];
if (!url) { console.error("usage: node fetch-page.mjs <url>"); process.exit(1); }
const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Zerosolved Reel Maker)" } });
if (!res.ok) { console.error(`HTTP ${res.status} for ${url}`); process.exit(1); }
let html = await res.text();
html = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/gi, "");
const text = html
  .replace(/<(br|\/p|\/div|\/h\d|\/li|\/tr|\/section|\/header)[^>]*>/gi, "\n")
  .replace(/<!-- -->/g, "")
  .replace(/<[^>]+>/g, " ")
  .replace(/ ([,.;:!?)])/g, "$1")
  .replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
  .replace(/<!-- -->/g, "")
  .split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
process.stdout.write(`SOURCE: ${url}\nFETCHED: ${new Date().toISOString().slice(0, 10)}\n\n${text}\n`);
