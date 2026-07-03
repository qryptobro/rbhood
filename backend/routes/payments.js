const router = require("express").Router();
const crypto = require("crypto");
const auth = require("../middleware/auth");
const prisma = require("../lib/prisma");
const persist = require("../lib/persist");
const referrals = require("../lib/referrals");
const partnerCodes = require("../lib/partnerCodes");
const notify = require("../lib/notify");

// Промокоды лежат в админ-сторе (ключ "store", поле state.promos)
const readPromos = () => {
  const parsed = persist.getJSON("store", null);
  const promos = parsed?.state?.promos;
  return Array.isArray(promos) ? promos : [];
};

// Найти активный промокод по коду (админ-стор + коды, созданные партнёрами)
const findPromo = (code) => {
  const c = String(code || "").trim().toUpperCase();
  if (!c) return null;
  const admin = readPromos().find((p) => p.active && String(p.code).toUpperCase() === c);
  if (admin) return admin;
  return partnerCodes.findByCode(c); // партнёрские коды с фикс. условиями
};

// Применить скидку к сумме (тенге, целое)
const applyDiscount = (amount, promo) => {
  if (!promo) return amount;
  let result = promo.type === "percent"
    ? Math.round(amount * (1 - Number(promo.value) / 100))
    : amount - Number(promo.value);
  return Math.max(0, Math.round(result));
};

// apipay.kz (Kaspi) — настройки берём из окружения
const API_BASE = process.env.APIPAY_BASE_URL || "https://bpapi.bazarbay.site/api/v1";
const API_KEY = process.env.APIPAY_API_KEY || "";
const WEBHOOK_SECRET = process.env.APIPAY_WEBHOOK_SECRET || "";

// Цены тарифов в тенге (Kaspi работает в KZT). Меняй под себя через env.
const PLAN_PRICES = {
  MONTHLY: Number(process.env.PRICE_MONTHLY_KZT || 20000),
  LIFETIME: Number(process.env.PRICE_LIFETIME_KZT || 90000),
};
const PLAN_LABEL = { MONTHLY: "Подписка rbhood ai (месяц)", LIFETIME: "Подписка rbhood ai (навсегда)" };

const normalizePlan = (p) => {
  const v = String(p || "").toUpperCase();
  return v === "MONTHLY" || v === "LIFETIME" ? v : null;
};

// Телефон в формат 8XXXXXXXXXX
const normalizePhone = (raw) => {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("7")) return "8" + d.slice(1); // 7XXXXXXXXXX
  if (d.length === 11 && d.startsWith("8")) return d;                // 8XXXXXXXXXX
  if (d.length === 10) return "8" + d;                               // XXXXXXXXXX
  return null;
};

const apipay = async (path, { method = "GET", body } = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
};

// Выдать тариф пользователю (идемпотентно)
const grantPlan = async (userId, plan) => {
  await prisma.user.update({ where: { id: userId }, data: { plan } });
};

// GET /api/payments/notify-test — отправить тестовое уведомление в Telegram (только админ)
router.get("/notify-test", auth, async (req, res) => {
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
  const ok = await notify.send("✅ Тест уведомлений rbhood ai — бот работает!");
  res.json({ ok, configured: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) });
});

// GET /api/payments/promo?code=WELCOME20&plan=MONTHLY — проверить промокод
router.get("/promo", auth, (req, res) => {
  const plan = normalizePlan(req.query.plan);
  if (!plan) return res.status(400).json({ error: "Некорректный тариф" });

  const promo = findPromo(req.query.code);
  if (!promo) return res.status(404).json({ valid: false, error: "Промокод не найден" });

  const original = PLAN_PRICES[plan];
  const amount = applyDiscount(original, promo);
  res.json({
    valid: true,
    code: String(promo.code).toUpperCase(),
    type: promo.type,
    value: promo.value,
    original,
    amount,
    discount: original - amount,
  });
});

// POST /api/payments/create — создать счёт Kaspi по номеру телефона
router.post("/create", auth, async (req, res) => {
  if (!API_KEY) return res.status(503).json({ error: "Оплата не настроена" });

  const plan = normalizePlan(req.body.plan);
  if (!plan) return res.status(400).json({ error: "Некорректный тариф" });

  const phone = normalizePhone(req.body.phone);
  if (!phone) return res.status(400).json({ error: "Введите корректный номер Kaspi" });

  // Применяем промокод, если передан и валиден
  const promo = req.body.promo ? findPromo(req.body.promo) : null;
  const amount = applyDiscount(PLAN_PRICES[plan], promo);
  if (amount < 1) return res.status(400).json({ error: "Сумма к оплате слишком мала" });
  // external_order_id кодирует пользователя и тариф — пригодится в вебхуке
  const external_order_id = `rbhood_u${req.user.id}_${plan}_${Date.now()}`;

  try {
    const r = await apipay("/invoices", {
      method: "POST",
      body: { phone_number: phone, amount, description: PLAN_LABEL[plan], external_order_id },
    });
    if (!r.ok) {
      console.error("apipay create:", r.status, r.data);
      return res.status(502).json({ error: r.data?.message || r.data?.error || "Не удалось создать счёт" });
    }
    // если использован партнёрский промокод — запоминаем для начисления комиссии при оплате
    if (promo) {
      referrals.setPending(r.data.id, {
        promo: String(promo.code).toUpperCase(),
        partner: promo.partner || "",
        commissionPct: Number(promo.commission) || 0,
        amount,
      });
    }
    res.status(201).json({
      id: r.data.id,
      amount,
      plan,
      phone,
      status: r.data.status || "pending",
    });
  } catch (e) {
    console.error("apipay create exception:", e.message);
    res.status(502).json({ error: "Платёжный сервис недоступен" });
  }
});

// GET /api/payments/:id/status?plan=MONTHLY — проверить статус (polling)
router.get("/:id/status", auth, async (req, res) => {
  if (!API_KEY) return res.status(503).json({ error: "Оплата не настроена" });
  const plan = normalizePlan(req.query.plan);

  try {
    const r = await apipay(`/invoices/${encodeURIComponent(req.params.id)}`);
    if (!r.ok) return res.status(502).json({ error: "Не удалось получить статус" });

    const status = r.data.status; // pending | paid | cancelled | expired | error
    if (status === "paid" && plan) {
      await grantPlan(req.user.id, plan); // выдаём тариф залогиненному пользователю
      try { referrals.credit(req.params.id); } catch { /* учёт не должен ломать оплату */ }
      try { notify.paymentPaid({ invoiceId: req.params.id, plan, amount: r.data.amount, email: req.user.email }); } catch { /* ignore */ }
    }
    res.json({ status });
  } catch (e) {
    console.error("apipay status:", e.message);
    res.status(502).json({ error: "Платёжный сервис недоступен" });
  }
});

// POST /api/payments/webhook — уведомления apipay (на случай если клиент закрыл вкладку).
// Сырой Buffer приходит из express.raw, смонтированного в index.js до express.json.
router.post("/webhook", async (req, res) => {
  try {
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
    if (WEBHOOK_SECRET) {
      const sig = req.headers["x-webhook-signature"] || "";
      const expected = "sha256=" + crypto.createHmac("sha256", WEBHOOK_SECRET).update(raw).digest("hex");
      if (sig !== expected) return res.status(401).json({ error: "bad signature" });
    }
    const payload = JSON.parse(raw.toString("utf8"));
    const inv = payload.invoice || payload.data || payload;
    const status = inv.status || payload.status;
    const ext = inv.external_order_id || payload.external_order_id || "";

    if (status === "paid") {
      const m = /^rbhood_u(\d+)_(MONTHLY|LIFETIME)_/.exec(ext);
      if (m) await grantPlan(Number(m[1]), m[2]);
      try { referrals.credit(inv.id || payload.id); } catch { /* ignore */ }
      try {
        let email;
        if (m) { const u = await prisma.user.findUnique({ where: { id: Number(m[1]) } }); email = u?.email; }
        notify.paymentPaid({ invoiceId: inv.id || payload.id, plan: m ? m[2] : undefined, amount: inv.amount, email });
      } catch { /* ignore */ }
    }
    res.json({ ok: true });
  } catch (e) {
    console.error("apipay webhook:", e.message);
    res.status(200).json({ ok: true }); // не просим ретраи на нашей ошибке парсинга
  }
});

module.exports = router;
