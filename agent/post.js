// rbhood Threads agent — раз в день: скрин анализа с ai.rbhood.kz -> подпись (LLM) -> пост в Threads.
// Запускается в GitHub Actions (Ubuntu + Chromium). Все секреты приходят через env.
import { chromium } from "playwright";

// ── конфиг из окружения ──
const SITE = process.env.SITE_URL || "https://ai.rbhood.kz";
const BACKEND = process.env.BACKEND_URL || "https://rbhood-ai.onrender.com";
const DEMO_EMAIL = process.env.DEMO_EMAIL;
const DEMO_PASSWORD = process.env.DEMO_PASSWORD;
const GROQ_KEY = process.env.GROQ_API_KEY;
const IMGBB_KEY = process.env.IMGBB_KEY;            // бесплатный хостинг картинки -> публичный URL
const TH_USER = process.env.THREADS_USER_ID;        // Threads user id
const TH_TOKEN = process.env.THREADS_ACCESS_TOKEN;  // Threads long-lived token

// активы для ротации (каждый день — случайный)
const ASSETS = [
  { tab: "crypto", name: "Bitcoin" }, { tab: "crypto", name: "Ethereum" }, { tab: "crypto", name: "Solana" },
  { tab: "forex", name: "Euro / Dollar" }, { tab: "forex", name: "Gold / Dollar" }, { tab: "forex", name: "Pound / Dollar" },
];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── 1. разбудить бэкенд (Render free засыпает) ──
async function wakeBackend() {
  for (let i = 0; i < 12; i++) {
    try { const r = await fetch(`${BACKEND}/health`, { signal: AbortSignal.timeout(60000) }); if (r.ok) { console.log("backend awake"); return; } } catch {}
    console.log("waking backend…"); await sleep(5000);
  }
}

// ── 2. Playwright: логин + анализ + скриншот ──
async function capture(asset) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  try {
    // логин
    await page.goto(`${SITE}/login`, { waitUntil: "networkidle" });
    await page.locator('input[type="email"], input[placeholder*="@"]').first().fill(DEMO_EMAIL);
    await page.locator('input[type="password"]').first().fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: /Войти|Sign in|Кіру/i }).first().click();
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });
    await sleep(2000);

    // выбрать вкладку и актив
    try { await page.getByText(new RegExp(`^(Крипто|Форекс|Акции|Crypto|Forex|Stocks)$`, "i")).first().click({ timeout: 4000 }); } catch {}
    await page.getByText(asset.name, { exact: false }).first().click({ timeout: 15000 });

    // дождаться результата анализа (появляется технический анализ / торговый план)
    await page.getByText(/Технический анализ|Вход|Тейк|Technical analysis|Entry/i).first().waitFor({ timeout: 90000 });
    await sleep(2500);

    const buf = await page.screenshot({ fullPage: false });
    return buf.toString("base64");
  } finally {
    await ctx.close(); await browser.close();
  }
}

// ── 3. загрузить скрин на imgbb -> публичный URL ──
async function uploadImage(base64) {
  const body = new URLSearchParams({ image: base64 });
  const r = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: "POST", body });
  const j = await r.json();
  if (!j?.data?.url) throw new Error("imgbb upload failed: " + JSON.stringify(j).slice(0, 200));
  return j.data.url;
}

// ── 4. подпись через Groq ──
async function caption(asset) {
  const sys = "Ты SMM-копирайтер. Пиши короткий цепляющий пост для Threads на русском о бесплатной платформе rbhood ai — ИИ-анализ графиков (форекс, крипто, акции) за 7 секунд. Тон живой, без воды. 2-4 строки + 3-5 хэштегов. Обязательно упомяни, что это БЕСПЛАТНО, и ссылку ai.rbhood.kz.";
  const usr = `Актив на скрине: ${asset.name}. Сгенерируй пост.`;
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", max_tokens: 300, messages: [{ role: "system", content: sys }, { role: "user", content: usr }] }),
    });
    const j = await r.json();
    return (j.choices?.[0]?.message?.content || "").trim();
  } catch { /* фоллбэк */ }
  return `Бесплатный ИИ-анализ ${asset.name} за 7 секунд 🚀\nФорекс · Крипто · Акции — без оплаты.\nПробуй: ai.rbhood.kz\n#трейдинг #crypto #forex #ИИ`;
}

// ── 5. пост в Threads (create container -> publish) ──
async function postThreads(imageUrl, text) {
  const base = `https://graph.threads.net/v1.0/${TH_USER}`;
  const create = await fetch(`${base}/threads?media_type=IMAGE&image_url=${encodeURIComponent(imageUrl)}&text=${encodeURIComponent(text)}&access_token=${TH_TOKEN}`, { method: "POST" });
  const cj = await create.json();
  if (!cj?.id) throw new Error("threads create failed: " + JSON.stringify(cj).slice(0, 300));
  await sleep(5000); // Threads рекомендует подождать перед публикацией
  const pub = await fetch(`${base}/threads_publish?creation_id=${cj.id}&access_token=${TH_TOKEN}`, { method: "POST" });
  const pj = await pub.json();
  if (!pj?.id) throw new Error("threads publish failed: " + JSON.stringify(pj).slice(0, 300));
  console.log("posted to Threads:", pj.id);
}

(async () => {
  // обязательные для съёмки; Threads-секреты опциональны (без них — тест-режим без постинга)
  for (const [k, v] of Object.entries({ DEMO_EMAIL, DEMO_PASSWORD, GROQ_KEY, IMGBB_KEY }))
    if (!v) throw new Error(`Missing env: ${k}`);
  const willPost = !!(TH_USER && TH_TOKEN);

  const asset = pick(ASSETS);
  console.log("asset:", asset.name);
  await wakeBackend();
  const b64 = await capture(asset);
  console.log("screenshot captured");
  const url = await uploadImage(b64);
  console.log("image url:", url);
  const text = await caption(asset);
  console.log("caption:\n", text);

  if (willPost) { await postThreads(url, text); console.log("✅ posted"); }
  else console.log("ℹ️ ТЕСТ-режим (нет THREADS_* секретов): пост НЕ отправлен. Проверь картинку по ссылке выше и текст.");
})().catch(e => { console.error("AGENT ERROR:", e.message); process.exit(1); });
