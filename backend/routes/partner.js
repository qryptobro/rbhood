const router = require("express").Router();
const auth = require("../middleware/auth");
const { readPromos } = require("../lib/adminStore");
const referrals = require("../lib/referrals");
const withdrawals = require("../lib/withdrawals");
const partnerCodes = require("../lib/partnerCodes");

const MIN_WITHDRAW = Number(process.env.MIN_WITHDRAW_KZT || 5000);

// Промокоды этого пользователя: привязанные админом (по email) + созданные им самим
const myPromos = (email) => {
  const e = String(email || "").toLowerCase();
  const admin = readPromos().filter(p => p.partnerEmail && String(p.partnerEmail).toLowerCase() === e);
  const own = partnerCodes.forEmail(e);
  const seen = new Set(admin.map(p => String(p.code).toUpperCase()));
  return [...admin, ...own.filter(p => !seen.has(String(p.code).toUpperCase()))];
};

// Собрать сводку партнёра
const buildSummary = (user) => {
  const promos = myPromos(user.email);
  const codes = promos.map(p => String(p.code).toUpperCase());
  const stats = referrals.forCodes(codes);
  const earned = stats.reduce((s, x) => s + x.commission, 0);
  const { paid, pending } = withdrawals.sums(user.id);
  const available = Math.max(0, earned - paid - pending);
  const cfg = partnerCodes.config();
  return {
    isPartner: promos.length > 0,
    minWithdraw: MIN_WITHDRAW,
    codeConfig: { ...cfg, canCreate: partnerCodes.countForEmail(user.email) < cfg.maxPerUser },
    codes: promos.map(p => ({
      code: String(p.code).toUpperCase(),
      discount: p.type === "percent" ? `${p.value}%` : `${p.value} ₸`,
      commission: Number(p.commission) || 0,
    })),
    stats,
    earned, paid, pending, available,
    withdrawals: withdrawals.listForUser(user.id),
  };
};

// GET /api/partner/me — кабинет партнёра
router.get("/me", auth, (req, res) => {
  res.json(buildSummary(req.user));
});

// POST /api/partner/code — партнёр создаёт свой промокод (условия фиксированы)
router.post("/code", auth, (req, res) => {
  const raw = String(req.body.code || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{3,20}$/.test(raw)) {
    return res.status(400).json({ error: "Код: 3–20 символов, латиница и цифры" });
  }
  // не занят ли (в админ-кодах или партнёрских)
  const inAdmin = readPromos().some(p => String(p.code).toUpperCase() === raw);
  if (inAdmin || partnerCodes.findByCode(raw)) {
    return res.status(409).json({ error: "Такой код уже занят" });
  }
  const cfg = partnerCodes.config();
  if (partnerCodes.countForEmail(req.user.email) >= cfg.maxPerUser) {
    return res.status(400).json({ error: `Лимит кодов: ${cfg.maxPerUser}` });
  }
  partnerCodes.add({ code: raw, email: req.user.email, name: req.user.name });
  res.status(201).json(buildSummary(req.user));
});

// POST /api/partner/withdraw — запрос на вывод { amount, card }
router.post("/withdraw", auth, (req, res) => {
  const s = buildSummary(req.user);
  if (!s.isPartner) return res.status(403).json({ error: "Вы не партнёр" });

  const amount = Math.floor(Number(req.body.amount) || 0);
  const card = String(req.body.card || "").trim();
  if (amount < MIN_WITHDRAW) return res.status(400).json({ error: `Минимальная сумма вывода — ${MIN_WITHDRAW} ₸` });
  if (amount > s.available) return res.status(400).json({ error: "Сумма больше доступного баланса" });
  if (card.replace(/\D/g, "").length < 12) return res.status(400).json({ error: "Введите корректный номер карты" });

  const item = withdrawals.create({ userId: req.user.id, email: req.user.email, name: req.user.name, amount, card });
  res.status(201).json({ ok: true, item });
});

module.exports = router;
