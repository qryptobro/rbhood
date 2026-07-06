// rbhood Threads agent.
// Раз в день: берёт 3 из 6 углов (ротация), для каждого — скрин анализа + текст на RU и KZ,
// -> отправляет 6 черновиков на бэкенд, тот шлёт их в Telegram с кнопками (Одобрить/Отклонить/Подправить).
import { chromium } from "playwright";

const SITE = process.env.SITE_URL || "https://ai.rbhood.kz";
const BACKEND = process.env.BACKEND_URL || "https://rbhood-ai.onrender.com";
const DEMO_EMAIL = process.env.DEMO_EMAIL;
const DEMO_PASSWORD = process.env.DEMO_PASSWORD;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const AGENT_SECRET = process.env.AGENT_SECRET || "";

// Только крипта — торгуется 24/7, карточки всегда активны.
const ASSETS = ["Bitcoin", "Ethereum", "Solana", "BNB", "Ripple", "Cardano", "Dogecoin", "Chainlink"];

// 6 углов ведения Threads (ротируются — 3 в день)
const ANGLES = [
  { name: "Формулы хуков", prompt: "Раскрой 5 повторяющихся ФОРМУЛ вирусных хуков в нише трейдинга (только формулы-шаблоны, без примеров)." },
  { name: "Разбор убеждения", prompt: "Разбей убеждение трейдеров «я пробовал — не сработало» на 3 логические ошибки." },
  { name: "Момент затыка", prompt: "Опиши не проблему, а МОМЕНТ, когда трейдер понимает, что застрял." },
  { name: "Острое мнение", prompt: "Сформулируй жёсткую, разделяющую аудиторию, но логически защитимую позицию по трейдингу." },
  { name: "Оператор системы", prompt: "Перепиши личный результат в трейдинге так, будто автор не герой, а хладнокровный оператор системы." },
  { name: "Что НЕ делать", prompt: "Скажи, что в трейдинге делать НЕ нужно, даже если все так советуют." },
];

// Формулы вирусных хуков — паттерны реально залетевших постов по трейдингу.
// Добавляется в каждый промпт, чтобы текст читался как топовый, а не как ИИ-заготовка.
const HOOK_RULES = ` ГЛАВНОЕ: первая строка — ХУК, который останавливает скролл. Возьми ОДНУ из формул залетевших постов:
• Резкое противоречие: «Все учат X. Именно это и сливает депозит.»
• Конкретика/цифра: «3 сделки в неделю. Не больше. Вот почему.»
• Разрыв шаблона / незакрытая петля: «Год терял деньги, пока не понял одну вещь.»
• Вызов идентичности: «Если ты всё ещё торгуешь по индикаторам — ты не трейдер, ты игрок.»
• Польза за 1 строку: «Сохрани, чтобы не слить депо.»
Правила: первая строка самая сильная; короткие рубленые фразы и переносы строк; без штампов и канцелярита; пиши как живой трейдер, а не бренд.`;

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const shuffle = (a) => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

// хэштеги — отдельным блоком в самом конце (выдёргиваем из текста)
function fmt(text) {
  const tags = (text.match(/#[\p{L}\p{N}_]+/gu) || []);
  let body = text.replace(/#[\p{L}\p{N}_]+/gu, "").replace(/[ \t]+\n/g, "\n").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return tags.length ? `${body}\n\n${[...new Set(tags)].join(" ")}` : body;
}

// Рекомендацию платформы и хэштеги добавляем САМИ (LLM пишет только текст поста) — так держим лимит Threads.
const REC = {
  ru: [
    "Кстати, сам графики смотрю через rbhood ai — бесплатно, разбирает за 7 сек: ai.rbhood.kz",
    "Я через rbhood ai смотрю — бесплатный ИИ-разбор графика за 7 сек: ai.rbhood.kz",
  ],
  kz: [
    "Айтпақшы, графикті rbhood ai арқылы қараймын — тегін, 7 секунд: ai.rbhood.kz",
    "Өзім rbhood ai қолданам — график талдауы тегін: ai.rbhood.kz",
  ],
};
const TAGS = { ru: "#трейдинг #форекс #крипто #акция", kz: "#трейдинг #форекс #крипто #акция" };
const rndRec = (l) => REC[l][Math.floor(Math.random() * REC[l].length)];
const stripTags = (t) => t.replace(/#[\p{L}\p{N}_]+/gu, "").replace(/\*+/g, "").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
function trimTo(t, max) {
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const m = cut.match(/[\s\S]*[.!?…\n]/);
  return (m ? m[0] : cut).trim();
}
function toneInstr(lang) {
  return lang === "kz"
    ? " Постты ҚАЗАҚША жаз. Тірі адамдай, қарапайым ауызекі тілмен, ЖИ жазғаны білінбесін. ТЕК пост мәтіні, өте қысқа: 1-3 сөйлем. Сілтеме, жарнама, ұсыныс ҚОСПА."
    : " Пиши по-русски, как живой человек — просто и коротко (1-3 предложения), без штампов, чтобы не было видно ИИ. ТОЛЬКО текст поста. НЕ добавляй ссылок, рекламы и рекомендаций.";
}

async function buildCaption(idx, lang) {
  const sys = ANGLES[idx].prompt + HOOK_RULES + toneInstr(lang);
  let content = "";
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: sys }] },
        contents: [{ role: "user", parts: [{ text: "Напиши пост." }] }],
        generationConfig: { maxOutputTokens: 300, temperature: 1.1, thinkingConfig: { thinkingBudget: 0 } },
      }),
    });
    const j = await r.json();
    content = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("").trim();
  } catch { /* ignore */ }
  content = trimTo(stripTags(content), 320) || (lang === "kz" ? "Трейдинг — жүйе, болжам емес." : "Трейдинг — это система, а не угадайка.");
  return `${content}\n\n${rndRec(lang)}\n\n${TAGS[lang]}`;
}

async function wakeBackend() {
  for (let i = 0; i < 12; i++) {
    try { const r = await fetch(`${BACKEND}/health`, { signal: AbortSignal.timeout(60000) }); if (r.ok) { console.log("backend awake"); return; } } catch {}
    console.log("waking backend…"); await sleep(5000);
  }
}

// логин + анализ актива + скриншот -> Buffer(PNG)
async function capture(assetName) {
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
    try { await page.getByText("Крипто", { exact: true }).first().click({ timeout: 6000 }); await sleep(1500); } catch {}
    const target = page.getByText(assetName, { exact: false }).first();
    await target.scrollIntoViewIfNeeded().catch(() => {});
    await target.click({ timeout: 15000 });
    await page.getByText(/Технический анализ|Вход|Тейк|Technical analysis|Entry/i).first().waitFor({ timeout: 90000 });
    await sleep(2500);
    return await page.screenshot({ fullPage: false });
  } finally { await ctx.close(); await browser.close(); }
}

async function submitDraft(d) {
  const r = await fetch(`${BACKEND}/api/threads-bot/draft`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-agent-secret": AGENT_SECRET },
    body: JSON.stringify(d),
  });
  const j = await r.json();
  if (!j.ok) throw new Error("draft submit failed: " + JSON.stringify(j).slice(0, 300));
}

(async () => {
  for (const [k, v] of Object.entries({ DEMO_EMAIL, DEMO_PASSWORD, GEMINI_KEY }))
    if (!v) throw new Error(`Missing env: ${k}`);
  await wakeBackend();

  // За запуск — 1 угол (RU+KZ = 2 поста). Слоты 09/11/13 UTC (14/16/18 Астаны).
  // Угол ротируется по дню + слоту, чтобы 3 слота в день были разными.
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 0)) / 86400000);
  const slot = Math.max(0, Math.round((now.getUTCHours() - 9) / 2)); // 9,11,13 UTC -> 0,1,2
  const idx = (dayOfYear * 3 + slot) % ANGLES.length;

  const asset = pick(ASSETS);
  const imageB64 = (await capture(asset)).toString("base64");
  for (const lang of ["ru", "kz"]) {
    const caption = await buildCaption(idx, lang);
    await submitDraft({ asset, imageB64, caption, angle: idx, lang });
  }
  console.log(`✅ ${ANGLES[idx].name}: 2 поста (RU+KZ), актив ${asset} — проверь Telegram`);
})().catch(e => { console.error("AGENT ERROR:", e.message); process.exit(1); });
