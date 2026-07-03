const persist = require("./persist");

// Уведомления в Telegram о новых оплатах.
// Нужны env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const CHAT = process.env.TELEGRAM_CHAT_ID || "";

// Идемпотентность уведомлений — ключ "notified": { ids: [...] }
const read = () => persist.getJSON("notified", { ids: [] });
const write = (d) => persist.setJSON("notified", d);

async function send(text) {
  if (!TOKEN || !CHAT) return false;
  try {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    return true;
  } catch (e) { console.warn("tg notify:", e.message); return false; }
}

// Уведомление об оплате — один раз на счёт (идемпотентно по invoiceId)
async function paymentPaid({ invoiceId, plan, amount, email, promo }) {
  const id = String(invoiceId || "");
  if (id) {
    const d = read();
    if (d.ids.includes(id)) return;        // уже уведомляли
    d.ids.push(id);
    if (d.ids.length > 500) d.ids = d.ids.slice(-500);
    write(d);
  }
  const lines = [
    "💸 <b>Новая оплата</b>",
    plan ? `Тариф: <b>${plan}</b>` : null,
    amount ? `Сумма: <b>${Number(amount).toLocaleString("ru-RU")} ₸</b>` : null,
    email ? `Клиент: ${email}` : null,
    promo ? `Промокод: <code>${promo}</code>` : null,
    `🕒 ${new Date().toLocaleString("ru-RU")}`,
  ].filter(Boolean);
  await send(lines.join("\n"));
}

module.exports = { send, paymentPaid };
