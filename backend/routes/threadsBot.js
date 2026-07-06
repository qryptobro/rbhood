// Threads-агент: приём черновика от GitHub-агента + обработка кнопок (Одобрить/Отклонить/Подправить) через Telegram webhook.
const router = require("express").Router();
const persist = require("../lib/persist");

const TG = process.env.TELEGRAM_BOT_TOKEN || "";
const CHAT = process.env.THREADS_DRAFTS_CHAT_ID || process.env.TELEGRAM_CHAT_ID || "";
const AGENT_SECRET = process.env.AGENT_SECRET || "";
const WH_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || "";
const GEMINI = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const TH_USER = process.env.THREADS_USER_ID || "";
const TH_TOKEN = process.env.THREADS_ACCESS_TOKEN || "";
const IMGBB_KEY = process.env.IMGBB_KEY || "1a1a33a6331c3c20d7500f317ca93905";

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

// 6 углов (синхронизировано с agent/post.js). «Подправить» генерит в том же угле и языке.
const ANGLES = [
  { prompt: "Раскрой 5 повторяющихся ФОРМУЛ вирусных хуков в нише трейдинга (только формулы-шаблоны, без примеров)." },
  { prompt: "Разбей убеждение трейдеров «я пробовал — не сработало» на 3 логические ошибки." },
  { prompt: "Опиши не проблему, а МОМЕНТ, когда трейдер понимает, что застрял." },
  { prompt: "Сформулируй жёсткую, разделяющую аудиторию, но логически защитимую позицию по трейдингу." },
  { prompt: "Перепиши личный результат в трейдинге так, будто автор не герой, а хладнокровный оператор системы." },
  { prompt: "Скажи, что в трейдинге делать НЕ нужно, даже если все так советуют." },
];

// Формулы вирусных хуков (синхронизировано с agent/post.js) — паттерны залетевших постов.
const HOOK_RULES = ` ГЛАВНОЕ: первая строка — ХУК, который останавливает скролл. Возьми ОДНУ из формул залетевших постов:
• Резкое противоречие: «Все учат X. Именно это и сливает депозит.»
• Конкретика/цифра: «3 сделки в неделю. Не больше. Вот почему.»
• Разрыв шаблона / незакрытая петля: «Год терял деньги, пока не понял одну вещь.»
• Вызов идентичности: «Если ты всё ещё торгуешь по индикаторам — ты не трейдер, ты игрок.»
• Польза за 1 строку: «Сохрани, чтобы не слить депо.»
Правила: первая строка самая сильная; короткие рубленые фразы и переносы строк; без штампов и канцелярита; пиши как живой трейдер, а не бренд.`;

function fmt(text) {
  const tags = (text.match(/#[\p{L}\p{N}_]+/gu) || []);
  const body = text.replace(/#[\p{L}\p{N}_]+/gu, "").replace(/[ \t]+\n/g, "\n").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return tags.length ? `${body}\n\n${[...new Set(tags)].join(" ")}` : body;
}

// Рекомендацию платформы и хэштеги добавляем сами (LLM пишет только текст) — держим лимит Threads.
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
const rndRec = (l) => (REC[l] || REC.ru)[Math.floor(Math.random() * REC[l].length)];
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

// сгенерировать новый вариант поста (для «Подправить») в том же угле и языке
async function buildCaption(idx, lang) {
  const angle = ANGLES[idx] || ANGLES[1];
  let content = "";
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: angle.prompt + HOOK_RULES + toneInstr(lang) }] },
        contents: [{ role: "user", parts: [{ text: "Другой вариант поста." }] }],
        generationConfig: { maxOutputTokens: 300, temperature: 1.2, thinkingConfig: { thinkingBudget: 0 } },
      }),
    });
    const j = await r.json();
    content = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("").trim();
  } catch { /* ignore */ }
  content = trimTo(stripTags(content), 320) || (lang === "kz" ? "Трейдинг — жүйе, болжам емес." : "Трейдинг — это система, а не угадайка.");
  return `${content}\n\n${rndRec(lang)}\n\n${TAGS[lang]}`;
}

// залить base64-картинку -> публичный URL (Threads API не принимает base64, только image_url).
// imgbb принимает base64 напрямую; фоллбэк — catbox (multipart-файл). Возвращает "" при неудаче.
async function hostImage(b64) {
  if (!b64) return "";
  try {
    const form = new URLSearchParams(); form.append("image", b64);
    const j = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: "POST", body: form }).then(r => r.json());
    if (j?.data?.url) return j.data.url;
  } catch { /* ignore */ }
  try {
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", new Blob([Buffer.from(b64, "base64")], { type: "image/png" }), "post.png");
    const t = (await fetch("https://catbox.moe/user/api.php", { method: "POST", body: form }).then(r => r.text())).trim();
    if (/^https?:\/\//.test(t)) return t;
  } catch { /* ignore */ }
  return "";
}

// публикация в Threads. С image_url — картиночный пост, без — текстовый (страховка). Возвращает {ok, reason?}
async function publishThreads(imageUrl, text) {
  if (!TH_USER || !TH_TOKEN) return { ok: false, reason: "not_configured" };
  const base = `https://graph.threads.net/v1.0/${TH_USER}`;
  const createUrl = imageUrl
    ? `${base}/threads?media_type=IMAGE&image_url=${encodeURIComponent(imageUrl)}&text=${encodeURIComponent(text)}&access_token=${TH_TOKEN}`
    : `${base}/threads?media_type=TEXT&text=${encodeURIComponent(text)}&access_token=${TH_TOKEN}`;
  const c = await fetch(createUrl, { method: "POST" }).then(r => r.json());
  if (!c?.id) return { ok: false, reason: JSON.stringify(c).slice(0, 200) };
  await new Promise(r => setTimeout(r, 5000));
  const p = await fetch(`${base}/threads_publish?creation_id=${c.id}&access_token=${TH_TOKEN}`, { method: "POST" }).then(r => r.json());
  return p?.id ? { ok: true, id: p.id } : { ok: false, reason: JSON.stringify(p).slice(0, 200) };
}

const langTag = (lang) => lang === "kz" ? "🇰🇿 KZ" : lang === "manual" ? "✍️ Ручной" : "🇷🇺 RU";

// отправить фото (буфер) в Telegram с кнопками
async function sendPhotoBuffer(buffer, caption, kb) {
  const form = new FormData();
  form.append("chat_id", CHAT);
  form.append("caption", caption.slice(0, 1024));
  if (kb) form.append("reply_markup", JSON.stringify(kb));
  form.append("photo", new Blob([buffer], { type: "image/png" }), "post.png");
  return fetch(`https://api.telegram.org/bot${TG}/sendPhoto`, { method: "POST", body: form }).then(r => r.json());
}

// создать черновик: отправить в Telegram с кнопками + сохранить
async function createDraft({ imageB64, imageUrl, caption, angle, lang }) {
  const id = String(Date.now()).slice(-9) + Math.floor(Math.random() * 100);
  const capText = `🆕 Черновик (${langTag(lang)}):\n\n${caption}`;
  let sent;
  if (imageB64) sent = await sendPhotoBuffer(Buffer.from(imageB64, "base64"), capText, keyboard(id));
  else sent = await tg("sendPhoto", { chat_id: CHAT, photo: imageUrl, caption: capText.slice(0, 1024), reply_markup: keyboard(id) });
  const messageId = sent?.result?.message_id;
  if (!messageId) return { ok: false, sent };
  const drafts = load();
  drafts[id] = { imageB64: imageB64 || "", imageUrl: imageUrl || "", caption, angle: angle ?? 1, lang: lang || "ru", chatId: CHAT, messageId, status: "pending", createdAt: Date.now() };
  const ids = Object.keys(drafts).sort();
  while (ids.length > 40) delete drafts[ids.shift()];
  save(drafts);
  return { ok: true, id };
}

// скачать фото из Telegram -> base64
async function downloadPhoto(fileId) {
  const f = await tg("getFile", { file_id: fileId });
  const path = f?.result?.file_path;
  if (!path) return null;
  const r = await fetch(`https://api.telegram.org/file/bot${TG}/${path}`);
  return Buffer.from(await r.arrayBuffer()).toString("base64");
}

// переписать пост по инструкции пользователя (Gemini)
async function reviseCaption(current, instruction, lang) {
  const sys = `Отредактируй пост для Threads по инструкции пользователя. Верни ТОЛЬКО итоговый текст поста, без пояснений. Сохрани язык (${lang === "kz" ? "казахский" : "русский"}), живой человеческий тон, ссылку ai.rbhood.kz и хэштеги. Коротко.`;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: sys }] },
        contents: [{ role: "user", parts: [{ text: `Текущий пост:\n${current}\n\nИнструкция: ${instruction}` }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.8, thinkingConfig: { thinkingBudget: 0 } },
      }),
    });
    const j = await r.json();
    const t = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("").trim();
    if (t) return trimTo(t, 900);
  } catch { /* ignore */ }
  return current;
}

// POST /api/threads-bot/draft — агент присылает готовый черновик
router.post("/draft", async (req, res) => {
  if (AGENT_SECRET && req.headers["x-agent-secret"] !== AGENT_SECRET) return res.status(403).json({ error: "forbidden" });
  if (!TG || !CHAT) return res.status(503).json({ error: "telegram not configured" });
  const { imageB64, imageUrl, caption, angle, lang } = req.body || {};
  if ((!imageB64 && !imageUrl) || !caption) return res.status(400).json({ error: "image & caption required" });
  const r = await createDraft({ imageB64, imageUrl, caption, angle, lang });
  if (!r.ok) return res.status(502).json({ error: "telegram send failed", tg: r.sent });
  res.json({ ok: true, id: r.id });
});

// POST /api/threads-bot/webhook — Telegram шлёт сюда нажатия кнопок
router.post("/webhook", async (req, res) => {
  if (WH_SECRET && req.headers["x-telegram-bot-api-secret-token"] !== WH_SECRET) return res.sendStatus(403);
  res.sendStatus(200); // отвечаем Telegram сразу
  try {
    const upd = req.body || {};

    // ── входящее сообщение: правка по инструкции / своя картинка / ручной пост ──
    const msg = upd.message;
    if (msg && String(msg.chat?.id) === String(CHAT) && !msg.from?.is_bot) {
      const drafts = load();
      const reply = msg.reply_to_message;
      const entry = reply ? Object.entries(drafts).find(([, d]) => String(d.messageId) === String(reply.message_id)) : null;
      const dId = entry?.[0]; const d = entry?.[1];

      if (msg.photo && msg.photo.length) {
        const b64 = await downloadPhoto(msg.photo[msg.photo.length - 1].file_id);
        if (!b64) return;
        if (d) { // ответ фото на черновик -> заменить картинку
          await createDraft({ imageB64: b64, caption: msg.caption || d.caption, angle: d.angle, lang: d.lang });
          await tg("sendMessage", { chat_id: CHAT, text: "🖼 Картинка заменена — новый черновик выше." });
        } else if (msg.caption) { // своё фото + подпись -> ручной пост
          await createDraft({ imageB64: b64, caption: msg.caption, angle: -1, lang: "manual" });
          await tg("sendMessage", { chat_id: CHAT, text: "✍️ Твой пост готов — проверь и жми ✅ Одобрить." });
        } else {
          await tg("sendMessage", { chat_id: CHAT, text: "Добавь подпись к фото — сделаю из этого пост." });
        }
        return;
      }
      if (msg.text) {
        if (d && dId) { // текст-инструкция в ответ на черновик -> правка
          const nc = await reviseCaption(d.caption, msg.text, d.lang);
          d.caption = nc; save(drafts);
          await tg("editMessageCaption", { chat_id: d.chatId, message_id: d.messageId, caption: `🆕 Черновик (${langTag(d.lang)}, правка):\n\n${nc}`.slice(0, 1024), reply_markup: keyboard(dId) });
          await tg("sendMessage", { chat_id: CHAT, text: "✏️ Поправил по инструкции ☝️" });
        } else if (!reply && !/^\//.test(msg.text.trim())) {
          await tg("sendMessage", { chat_id: CHAT, text: "Чтобы поправить пост — ответь (Reply) на него текстом-инструкцией.\nЧтобы сделать свой пост — пришли фото с подписью." });
        }
        return;
      }
      return;
    }

    // ── нажатие кнопки ──
    const cq = upd.callback_query;
    if (!cq) return;
    const [act, id] = String(cq.data || "").split(":");
    const drafts = load(); const d = drafts[id];
    const answer = (text) => tg("answerCallbackQuery", { callback_query_id: cq.id, text });
    if (!d) { await answer("Черновик не найден (устарел)"); return; }
    const editCap = (cap, markup) => tg("editMessageCaption", { chat_id: d.chatId, message_id: d.messageId, caption: cap.slice(0, 1024), ...(markup ? { reply_markup: markup } : {}) });

    if (act === "ap") {
      await answer("Публикую в Threads…");
      let imageUrl = d.imageUrl;
      if (!imageUrl && d.imageB64) imageUrl = await hostImage(d.imageB64); // залить скрин -> публичный URL
      const r = await publishThreads(imageUrl, d.caption);
      d.status = r.ok ? "published" : "approved"; save(drafts);
      await editCap(r.ok ? `✅ Опубликовано в Threads\n\n${d.caption}` : `✅ Одобрено (Threads пока не настроен — настрой Meta app)\n\n${d.caption}`);
      await answer(r.ok ? "Опубликовано!" : r.reason === "not_configured" ? "Одобрено (Threads не настроен)" : "Ошибка Threads: " + r.reason);
    } else if (act === "rj") {
      d.status = "rejected"; save(drafts);
      await editCap(`❌ Отклонено\n\n${d.caption}`);
      await answer("Отклонено");
    } else if (act === "ed") {
      const nc = await buildCaption(d.angle ?? 1, d.lang || "ru");
      d.caption = nc; save(drafts);
      const tag = d.lang === "kz" ? "🇰🇿 KZ" : "🇷🇺 RU";
      await editCap(`🆕 Черновик (${tag}, обновлён):\n\n${nc}`, keyboard(id));
      await answer("Сгенерировал новый вариант");
    }
  } catch (e) { console.error("threads webhook:", e.message); }
});

module.exports = router;
