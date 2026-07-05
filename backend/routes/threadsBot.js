// Threads-агент: приём черновика от GitHub-агента + обработка кнопок (Одобрить/Отклонить/Подправить) через Telegram webhook.
const router = require("express").Router();
const persist = require("../lib/persist");

const TG = process.env.TELEGRAM_BOT_TOKEN || "";
const CHAT = process.env.THREADS_DRAFTS_CHAT_ID || process.env.TELEGRAM_CHAT_ID || "";
const AGENT_SECRET = process.env.AGENT_SECRET || "";
const WH_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || "";
const GROQ = process.env.GROQ_API_KEY || "";
const TH_USER = process.env.THREADS_USER_ID || "";
const TH_TOKEN = process.env.THREADS_ACCESS_TOKEN || "";

const tg = (m, body) => fetch(`https://api.telegram.org/bot${TG}/${m}`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
}).then(r => r.json());

const KEY = "threads-drafts";
const load = () => persist.getJSON(KEY, {});
const save = (d) => persist.setJSON(KEY, d);
const keyboard = (id) => ({ inline_keyboard: [[
  { text: "✅ Одобрить", callback_data: `ap:${id}` },
  { text: "❌ Отклонить", callback_data: `rj:${id}` },
  { text: "✏️ Подправить", callback_data: `ed:${id}` },
]]});

// сгенерировать новый вариант подписи (для «Подправить»)
const CAPTION_SYS = `Ты — трейдер, который искренне хочет помочь людям и устал смотреть, как новичков разводят на дорогие курсы по трейдингу. Пиши пост для Threads от первого лица, по-человечески, без рекламных штампов.

ВСЕГДА начинай с эмоционального триггера про курсы по трейдингу — каждый раз формулируй ПО-НОВОМУ. Тон (не копируй дословно):
— «Мне искренне жалко людей, которые отдают сотни тысяч за курсы по трейдингу и всё равно сливают…»
— «Знаю столько людей, что купили курс по трейдингу, а в плюс так и не вышли…»
— «Хватит платить за курсы, которые ничему не учат…»

Затем мягко подведи к решению: есть БЕСПЛАТНАЯ платформа rbhood ai — ИИ анализирует любой график (форекс, крипто, акции) за 7 секунд и подсказывает, что делать. Платить не нужно. Ссылка: ai.rbhood.kz

Тон живой и искренний, будто советуешь другу. 3-5 коротких строк. В конце 2-4 хэштега. Без воды.`;

async function groqCaption(asset) {
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ}` },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", max_tokens: 320, temperature: 1.15, messages: [{ role: "system", content: CAPTION_SYS }, { role: "user", content: `На скриншоте — пример анализа ${asset}. Другой вариант поста.` }] }),
    });
    const j = await r.json(); const t = (j.choices?.[0]?.message?.content || "").trim(); if (t) return t;
  } catch { /* ignore */ }
  return `Жалко людей, которые платят за курсы по трейдингу и всё равно в минусе.\nЕсть rbhood ai — ИИ разбирает график за 7 секунд. Бесплатно: ai.rbhood.kz\n#трейдинг #крипто`;
}

// публикация в Threads (image_url + text). Возвращает {ok, reason?}
async function publishThreads(imageUrl, text) {
  if (!TH_USER || !TH_TOKEN) return { ok: false, reason: "not_configured" };
  const base = `https://graph.threads.net/v1.0/${TH_USER}`;
  const c = await fetch(`${base}/threads?media_type=IMAGE&image_url=${encodeURIComponent(imageUrl)}&text=${encodeURIComponent(text)}&access_token=${TH_TOKEN}`, { method: "POST" }).then(r => r.json());
  if (!c?.id) return { ok: false, reason: JSON.stringify(c).slice(0, 200) };
  await new Promise(r => setTimeout(r, 5000));
  const p = await fetch(`${base}/threads_publish?creation_id=${c.id}&access_token=${TH_TOKEN}`, { method: "POST" }).then(r => r.json());
  return p?.id ? { ok: true, id: p.id } : { ok: false, reason: JSON.stringify(p).slice(0, 200) };
}

// POST /api/threads-bot/draft — агент присылает готовый черновик, бэкенд шлёт его с кнопками
router.post("/draft", async (req, res) => {
  if (AGENT_SECRET && req.headers["x-agent-secret"] !== AGENT_SECRET) return res.status(403).json({ error: "forbidden" });
  if (!TG || !CHAT) return res.status(503).json({ error: "telegram not configured" });
  const { asset, imageUrl, caption } = req.body || {};
  if (!imageUrl || !caption) return res.status(400).json({ error: "imageUrl & caption required" });

  const id = String(Date.now()).slice(-9);
  const sent = await tg("sendPhoto", { chat_id: CHAT, photo: imageUrl, caption: `🆕 Черновик поста для Threads:\n\n${caption}`.slice(0, 1024), reply_markup: keyboard(id) });
  const messageId = sent?.result?.message_id;
  if (!messageId) return res.status(502).json({ error: "telegram send failed", tg: sent });

  const drafts = load();
  drafts[id] = { asset: asset || "", imageUrl, caption, chatId: CHAT, messageId, status: "pending", createdAt: Date.now() };
  const ids = Object.keys(drafts).sort();
  while (ids.length > 50) delete drafts[ids.shift()]; // храним последние 50
  save(drafts);
  res.json({ ok: true, id });
});

// POST /api/threads-bot/webhook — Telegram шлёт сюда нажатия кнопок
router.post("/webhook", async (req, res) => {
  if (WH_SECRET && req.headers["x-telegram-bot-api-secret-token"] !== WH_SECRET) return res.sendStatus(403);
  res.sendStatus(200); // отвечаем Telegram сразу
  try {
    const cq = req.body?.callback_query;
    if (!cq) return;
    const [act, id] = String(cq.data || "").split(":");
    const drafts = load(); const d = drafts[id];
    const answer = (text) => tg("answerCallbackQuery", { callback_query_id: cq.id, text });
    if (!d) { await answer("Черновик не найден (устарел)"); return; }
    const editCap = (cap, markup) => tg("editMessageCaption", { chat_id: d.chatId, message_id: d.messageId, caption: cap.slice(0, 1024), ...(markup ? { reply_markup: markup } : {}) });

    if (act === "ap") {
      const r = await publishThreads(d.imageUrl, d.caption);
      d.status = r.ok ? "published" : "approved"; save(drafts);
      await editCap(r.ok ? `✅ Опубликовано в Threads\n\n${d.caption}` : `✅ Одобрено (Threads пока не настроен — настрой Meta app)\n\n${d.caption}`);
      await answer(r.ok ? "Опубликовано!" : r.reason === "not_configured" ? "Одобрено (Threads не настроен)" : "Ошибка Threads: " + r.reason);
    } else if (act === "rj") {
      d.status = "rejected"; save(drafts);
      await editCap(`❌ Отклонено\n\n${d.caption}`);
      await answer("Отклонено");
    } else if (act === "ed") {
      const nc = await groqCaption(d.asset || "актив");
      d.caption = nc; save(drafts);
      await editCap(`🆕 Черновик (обновлён):\n\n${nc}`, keyboard(id));
      await answer("Сгенерировал новый вариант");
    }
  } catch (e) { console.error("threads webhook:", e.message); }
});

module.exports = router;
