const router = require("express").Router();
const auth = require("../middleware/auth");
const withdrawals = require("../lib/withdrawals");

const adminOnly = (req, res, next) => {
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
  next();
};

// GET /api/withdrawals — все запросы на вывод (админ)
router.get("/", auth, adminOnly, (req, res) => {
  res.json({ items: withdrawals.list() });
});

// POST /api/withdrawals/:id/paid — отметить выплаченным (админ)
router.post("/:id/paid", auth, adminOnly, (req, res) => {
  const ok = withdrawals.markPaid(req.params.id);
  if (!ok) return res.status(404).json({ error: "Запрос не найден" });
  res.json({ ok: true });
});

module.exports = router;
