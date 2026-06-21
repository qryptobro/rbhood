const router = require("express").Router();
const auth = require("../middleware/auth");
const signals = require("../lib/signals");
const scheduler = require("../services/signalScheduler");

const adminOnly = (req, res, next) => {
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
  next();
};

// GET /api/signals — журнал + статистика + настройки (только админ)
router.get("/", auth, adminOnly, (req, res) => {
  res.json({ stats: signals.stats(), config: scheduler.getConfig(), items: signals.list().slice(0, 500) });
});

// POST /api/signals/config — изменить порог винрейта/выборки
router.post("/config", auth, adminOnly, (req, res) => {
  res.json(scheduler.setConfig(req.body || {}));
});

module.exports = router;
