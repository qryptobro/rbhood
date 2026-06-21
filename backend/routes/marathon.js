const router = require("express").Router();
const auth = require("../middleware/auth");
const marathon = require("../services/marathon");

const adminOnly = (req, res, next) => {
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
  next();
};

// GET /api/marathon — состояние марафона
router.get("/", auth, adminOnly, (req, res) => {
  const s = marathon.getState();
  res.json({ ...s, start: marathon.START, target: marathon.TARGET });
});

// POST /api/marathon/reset — начать заново ($100)
router.post("/reset", auth, adminOnly, (req, res) => res.json(marathon.reset()));
// POST /api/marathon/stop|start — пауза / продолжить
router.post("/stop", auth, adminOnly, (req, res) => res.json(marathon.setStatus("stopped")));
router.post("/start", auth, adminOnly, (req, res) => res.json(marathon.setStatus("running")));

module.exports = router;
