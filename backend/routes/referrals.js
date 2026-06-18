const router = require("express").Router();
const auth = require("../middleware/auth");
const referrals = require("../lib/referrals");
const partnerCodes = require("../lib/partnerCodes");

const adminOnly = (req, res, next) => {
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
  next();
};

// GET /api/referrals — сводка по партнёрским кодам (комиссии)
router.get("/", auth, adminOnly, (req, res) => {
  const rows = referrals.summary();
  const totals = rows.reduce((s, r) => ({
    sales: s.sales + r.sales,
    revenue: s.revenue + r.revenue,
    commission: s.commission + r.commission,
    owed: s.owed + r.owed,
  }), { sales: 0, revenue: 0, commission: 0, owed: 0 });
  res.json({ rows, totals });
});

// GET /api/referrals/partners — список партнёров, создавших промокоды
router.get("/partners", auth, adminOnly, (req, res) => {
  const items = partnerCodes.listAll().map(it => {
    const code = String(it.code).toUpperCase();
    const stat = referrals.forCodes([code])[0] || { sales: 0, revenue: 0, commission: 0 };
    return { code, name: it.name || "", email: it.email || "", createdAt: it.createdAt, sales: stat.sales, commission: stat.commission };
  });
  res.json({ items });
});

// POST /api/referrals/:code/payout — отметить комиссию по коду выплаченной
router.post("/:code/payout", auth, adminOnly, (req, res) => {
  const ok = referrals.payout(req.params.code);
  if (!ok) return res.status(404).json({ error: "Код не найден" });
  res.json({ ok: true });
});

module.exports = router;
