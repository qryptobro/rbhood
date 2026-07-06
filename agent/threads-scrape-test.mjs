// Локальный тест скрапинга Threads с сохранённой сессией.
// Запуск (в папке agent): node threads-scrape-test.mjs
import { chromium } from "playwright";
import fs from "fs";

const storageState = JSON.parse(fs.readFileSync("threads-session.json", "utf8"));
const QUERIES = ["трейдинг", "инвестиции", "биткоин"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ storageState, viewport: { width: 1280, height: 1400 }, locale: "ru-RU" });
const page = await ctx.newPage();
const collected = new Map();

for (const q of QUERIES) {
  try {
    await page.goto(`https://www.threads.com/search?q=${encodeURIComponent(q)}&serp_type=default`, { waitUntil: "domcontentloaded", timeout: 40000 });
    await sleep(4000);
    if (/\/login/.test(page.url())) { console.log("!! редирект на login — сессия не подхватилась"); break; }
    for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 2200); await sleep(1200); }
    const items = await page.evaluate(() => {
      let conts = Array.from(document.querySelectorAll('div[data-pressable-container="true"]'));
      if (!conts.length) conts = Array.from(document.querySelectorAll("article"));
      return conts.map((c) => (c.innerText || "").replace(/\s+\n/g, "\n").trim()).filter((t) => t.length >= 30).map((t) => t.slice(0, 300));
    });
    for (const t of items) collected.set(t, true);
    console.log(`"${q}": контейнеров с текстом +${items.length} (url: ${page.url()})`);
  } catch (e) { console.log(`"${q}": ошибка ${e.message.slice(0, 100)}`); }
}

await page.screenshot({ path: "threads-debug.png" });
console.log(`\n=== ИТОГО уникальных: ${collected.size} ===`);
[...collected.keys()].slice(0, 6).forEach((t, i) => console.log(`\n[${i + 1}] ${t.replace(/\n/g, " | ").slice(0, 200)}`));
console.log("\nСкрин сохранён: threads-debug.png");
await browser.close();
process.exit(0);
