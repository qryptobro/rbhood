const router = require("express").Router();
const auth = require("../middleware/auth");
const { readPromos } = require("../lib/adminStore");
const referrals = require("../lib/referrals");
const withdrawals = require("../lib/withdrawals");

const MIN_WITHDRAW = Number(process.env.MIN_WITHDRAW_KZT || 5000);

// Промокоды этого пользователя (привязанные по email)
const myPromos = (email) => {
  const e = String(email || "").toLowerCase();
  return readPromos().filter(p => String(p.partnerEmail || "").toLowerCase() === e && p.partnerEmail);
};

// Собрать сводку партнёра
const buildSummary = (user) => {
  const promos = myPromos(user.email);
  const codes = promos.map(p => String(p.code).toUpperCase());
  const stats = referrals.forCodes(codes);
  const earned = stats.reduce((s, x) => s + x.commission, 0);
  const { paid, pending } = withdrawals.sums(user.id);
  const available = Math.max(0, earned - paid - pending);
  return {
    isPartner: promos.length > 0,
    minWithdraw: MIN_WITHDRAW,
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
