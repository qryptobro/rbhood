// rbhood Threads agent.
// ЭТАП 1 (сейчас): снять скрин анализа с ai.rbhood.kz -> подпись (LLM) -> прислать ЧЕРНОВИК в Telegram на просмотр.
// ЭТАП 2 (позже): кнопки Одобрить/Отклонить -> публикация в Threads (imgbb + Threads API).
import { chromium } from "playwright";

const SITE = process.env.SITE_URL || "https://ai.rbhood.kz";
const BACKEND = process.env.BACKEND_URL || "https://rbhood-ai.onrender.com";
const DEMO_EMAIL = process.env.DEMO_EMAIL;
const DEMO_PASSWORD = process.env.DEMO_PASSWORD;
const GROQ_KEY = process.env.GROQ_API_KEY;
const AGENT_SECRET = process.env.AGENT_SECRET || ""; // общий секрет с бэкендом

// Только крипта — она торгуется 24/7, поэтому карточки всегда активны (форекс/акции по выходным отключены).
const ASSETS = [
  { tab: "crypto", name: "Bitcoin" }, { tab: "crypto", name: "Ethereum" }, { tab: "crypto", name: "Solana" },
  { tab: "crypto", name: "BNB" }, { tab: "crypto", name: "Ripple" }, { tab: "crypto", name: "Cardano" },
  { tab: "crypto", name: "Dogecoin" }, { tab: "crypto", name: "Chainlink" },
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

    // выбрать вкладку по категории актива (crypto -> Крипто и т.д.)
    const tabLabel = { crypto: "Крипто", forex: "Форекс", stocks: "Акции" }[asset.tab] || "Крипто";
    try { await page.getByText(tabLabel, { exact: true }).first().click({ timeout: 6000 }); await sleep(1500); }
    catch (e) { console.log("tab click skipped:", e.message); }

    // кликнуть по активу (по имени)
    const target = page.getByText(asset.name, { exact: false }).first();
    await target.scrollIntoViewIfNeeded().catch(() => {});
    await target.click({ timeout: 15000 });

    await page.getByText(/Технический анализ|Вход|Тейк|Technical analysis|Entry/i).first().waitFor({ timeout: 90000 });
    await sleep(2500);

    return await page.screenshot({ fullPage: false });
  } finally {
    await ctx.close(); await browser.close();
  }
}

// подпись через Groq
const CAPTION_SYS = `Ты — трейдер, который искренне хочет помочь людям и устал смотреть, как новичков разводят на дорогие курсы по трейдингу. Пиши пост для Threads от первого лица, по-человечески, без рекламных штампов.

ВСЕГДА начинай с эмоционального триггера про курсы по трейдингу — каждый раз формулируй ПО-НОВОМУ. Тон (не копируй дословно):
— «Мне искренне жалко людей, которые отдают сотни тысяч за курсы по трейдингу и всё равно сливают…»
— «Знаю столько людей, что купили курс по трейдингу, а в плюс так и не вышли…»
— «Хватит платить за курсы, которые ничему не учат…»

Затем мягко подведи к решению: есть БЕСПЛАТНАЯ платформа rbhood ai — ИИ анализирует любой график (форекс, крипто, акции) за 7 секунд и подсказывает, что делать. Платить не нужно. Ссылка: ai.rbhood.kz

Тон живой и искренний, будто советуешь другу. 3-5 коротких строк. В конце 2-4 хэштега. Без воды.`;

async function caption(asset) {
  const usr = `На скриншоте — пример анализа ${asset.name}. Напиши пост.`;
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", max_tokens: 320, temperature: 1.1, messages: [{ role: "system", content: CAPTION_SYS }, { role: "user", content: usr }] }),
    });
    const j = await r.json();
    const t = (j.choices?.[0]?.message?.content || "").trim();
    if (t) return t;
  } catch { /* фоллбэк */ }
  return `Жалко людей, которые платят за курсы по трейдингу и всё равно в минусе.\nА есть rbhood ai — ИИ разбирает любой график за 7 секунд. Бесплатно.\nФорекс, крипто, акции: ai.rbhood.kz\n#трейдинг #крипто`;
}

// залить скрин на catbox.moe (без ключа) -> публичный URL
async function uploadImage(buffer) {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", new Blob([buffer], { type: "image/png" }), "post.png");
  const r = await fetch("https://catbox.moe/user/api.php", { method: "POST", body: form });
  const url = (await r.text()).trim();
  if (!/^https?:\/\//.test(url)) throw new Error("catbox upload failed: " + url.slice(0, 200));
  return url;
}

// отправить черновик на бэкенд (он пошлёт в Telegram с кнопками Одобрить/Отклонить/Подправить)
async function submitDraft(asset, imageUrl, text) {
  const r = await fetch(`${BACKEND}/api/threads-bot/draft`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-agent-secret": AGENT_SECRET },
    body: JSON.stringify({ asset, imageUrl, caption: text }),
  });
  const j = await r.json();
  if (!j.ok) throw new Error("draft submit failed: " + JSON.stringify(j).slice(0, 300));
  console.log("draft submitted, id:", j.id);
}

(async () => {
  for (const [k, v] of Object.entries({ DEMO_EMAIL, DEMO_PASSWORD, GROQ_KEY }))
    if (!v) throw new Error(`Missing env: ${k}`);
  const asset = pick(ASSETS);
  console.log("asset:", asset.name);
  await wakeBackend();
  const buf = await capture(asset);
  console.log("screenshot captured");
  const text = await caption(asset);
  console.log("caption:\n", text);
  const url = await uploadImage(buf);
  console.log("image url:", url);
  await submitDraft(asset.name, url, text);
  console.log("✅ draft submitted — проверь Telegram (там кнопки)");
})().catch(e => { console.error("AGENT ERROR:", e.message); process.exit(1); });
