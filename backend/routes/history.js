const router = require("express").Router();
const fs = require("fs");
const path = require("path");
const auth = require("../middleware/auth");

// История анализов хранится по пользователю: backend/data/history/<userId>.json
const DIR = path.join(__dirname, "..", "data", "history");
try { fs.mkdirSync(DIR, { recursive: true }); } catch { /* ignore */ }

const fileFor = (userId) => path.join(DIR, `${userId}.json`);

// GET /api/history — история текущего пользователя
router.get("/", auth, (req, res) => {
  try {
    const f = fileFor(req.user.id);
    if (fs.existsSync(f)) return res.json(JSON.parse(fs.readFileSync(f, "utf8")));
  } catch (e) { console.warn("history read:", e.message); }
  res.json([]);
});

// PUT /api/history — заменить историю (массив до 20 элементов)
router.put("/", auth, (req, res) => {
  const list = Array.isArray(req.body?.history) ? req.body.history.slice(0, 20) : null;
  if (!list) return res.status(400).json({ error: "history (array) required" });
  try {
    fs.writeFileSync(fileFor(req.user.id), JSON.stringify(list), "utf8");
    res.json({ ok: true });
  } catch (e) {
    console.error("history write:", e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
