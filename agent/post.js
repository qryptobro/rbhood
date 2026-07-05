// rbhood Threads agent.
// ЭТАП 1 (сейчас): снять скрин анализа с ai.rbhood.kz -> подпись (LLM) -> прислать ЧЕРНОВИК в Telegram на просмотр.
// ЭТАП 2 (позже): кнопки Одобрить/Отклонить -> публикация в Threads (imgbb + Threads API).
import { chromium } from "playwright";

const SITE = process.env.SITE_URL || "https://ai.rbhood.kz";
const BACKEND = process.env.BACKEND_URL || "https://rbhood-ai.onrender.com";
const DEMO_EMAIL = process.env.DEMO_EMAIL;
const DEMO_PASSWORD = process.env.DEMO_PASSWORD;
const GROQ_KEY = process.env.GROQ_API_KEY;
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;   // бот для черновиков
const TG_CHAT = process.env.TELEGRAM_CHAT_ID;      // твой личный chat id

const ASSETS = [
  { tab: "crypto", name: "Bitcoin" }, { tab: "crypto", name: "Ethereum" }, { tab: "crypto", name: "Solana" },
  { tab: "forex", name: "Euro / Dollar" }, { tab: "forex", name: "Gold / Dollar" }, { tab: "forex", name: "Pound / Dollar" },
];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// разбудить бэкенд (Render free засыпает)
async function wakeBackend() {
  for (let i = 0; i < 12; i++) {
    try { const r = await fetch(`${BACKEND}/health`, { signal: AbortSignal.timeout(60000) }); if (r.ok) { console.log("backend awake"); return; } } catch {}
    console.log("waking backend…"); await sleep(5000);
  }
}

// Playwright: логин + анализ + скриншот -> Buffer(PNG)
async function capture(asset) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  try {
    await page.goto(`${SITE}/login`, { waitUntil: "networkidle" });
    await page.locator('input[type="email"]').first().fill(DEMO_EMAIL);
    await page.locator('input[type="password"]').first().fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: /Войти|Sign in|Кіру/i }).first().click();
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });
    await sleep(2000);

    try { await page.getByText(/^(Крипто|Форекс|Акции|Crypto|Forex|Stocks)$/i).first().click({ timeout: 4000 }); } catch {}
    await page.getByText(asset.name, { exact: false }).first().click({ timeout: 15000 });
    await page.getByText(/Технический анализ|Вход|Тейк|Technical analysis|Entry/i).first().waitFor({ timeout: 90000 });
    await sleep(2500);

    return await page.screenshot({ fullPage: false });
  } finally {
    await ctx.close(); await browser.close();
  }
}

// подпись через Groq
async function caption(asset) {
  const sys = "Ты SMM-копирайтер. Пиши короткий цепляющий пост для Threads на русском о БЕСПЛАТНОЙ платформе rbhood ai — ИИ-анализ графиков (форекс, крипто, акции) за 7 секунд. Тон живой, без воды. 2-4 строки + 3-5 хэштегов. Обязательно упомяни, что это БЕСПЛАТНО, и ссылку ai.rbhood.kz.";
  const usr = `Актив на скрине: ${asset.name}. Сгенерируй пост.`;
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", max_tokens: 300, messages: [{ role: "system", content: sys }, { role: "user", content: usr }] }),
    });
    const j = await r.json();
    const t = (j.choices?.[0]?.message?.content || "").trim();
    if (t) return t;
  } catch { /* фоллбэк */ }
  return `Бесплатный ИИ-анализ ${asset.name} за 7 секунд 🚀\nФорекс · Крипто · Акции — без оплаты.\nПробуй: ai.rbhood.kz\n#трейдинг #crypto #forex #ИИ`;
}

// прислать черновик (фото + текст) в Telegram
async function sendTelegramDraft(buffer, text) {
  const cap = ("🆕 ЧЕРНОВИК ПОСТА ДЛЯ THREADS:\n\n" + text).slice(0, 1024);
  const form = new FormData();
  form.append("chat_id", TG_CHAT);
  form.append("caption", cap);
  form.append("photo", new Blob([buffer], { type: "image/png" }), "post.png");
  const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendPhoto`, { method: "POST", body: form });
  const j = await r.json();
  if (!j.ok) throw new Error("telegram sendPhoto failed: " + JSON.stringify(j).slice(0, 300));
  console.log("draft sent to Telegram");
}

(async () => {
  for (const [k, v] of Object.entries({ DEMO_EMAIL, DEMO_PASSWORD, GROQ_KEY, TG_TOKEN, TG_CHAT }))
    if (!v) throw new Error(`Missing env: ${k}`);
  const asset = pick(ASSETS);
  console.log("asset:", asset.name);
  await wakeBackend();
  const buf = await capture(asset);
  console.log("screenshot captured");
  const text = await caption(asset);
  console.log("caption:\n", text);
  await sendTelegramDraft(buf, text);
  console.log("✅ draft sent — проверь Telegram");
})().catch(e => { console.error("AGENT ERROR:", e.message); process.exit(1); });
