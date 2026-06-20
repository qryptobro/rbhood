const router = require("express").Router();
const auth = require("../middleware/auth");
const signals = require("../lib/signals");

const adminOnly = (req, res, next) => {
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
  next();
};

// GET /api/signals — журнал сигналов + статистика (только админ)
router.get("/", auth, adminOnly, (req, res) => {
  res.json({ stats: signals.stats(), items: signals.list().slice(0, 500) });
});

module.exports = router;
