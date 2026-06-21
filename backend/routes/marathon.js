const router = require("express").Router();
const auth = require("../middleware/auth");
const marathon = require("../services/marathon");

const adminOnly = (req, res, next) => {
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
  next();
};

// GET /api/marathon — состояние + настройки
router.get("/", auth, adminOnly, (req, res) => {
  res.json({ ...marathon.getState(), configured: marathon.configured() });
});

router.post("/config", auth, adminOnly, (req, res) => res.json(marathon.setConfig(req.body || {})));
router.post("/reset", auth, adminOnly, (req, res) => res.json(marathon.reset()));
router.post("/stop", auth, adminOnly, (req, res) => res.json(marathon.setStatus("stopped")));
router.post("/start", auth, adminOnly, (req, res) => res.json(marathon.setStatus("running")));

module.exports = router;
