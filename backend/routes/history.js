const router = require("express").Router();
const auth = require("../middleware/auth");
const persist = require("../lib/persist");

// История анализов по пользователю: ключ "history:<userId>" в persist.
const keyFor = (userId) => `history:${userId}`;

// GET /api/history — история текущего пользователя
router.get("/", auth, (req, res) => {
  res.json(persist.getJSON(keyFor(req.user.id), []));
});

// PUT /api/history — заменить историю (массив до 20 элементов)
router.put("/", auth, (req, res) => {
  const list = Array.isArray(req.body?.history) ? req.body.history.slice(0, 20) : null;
  if (!list) return res.status(400).json({ error: "history (array) required" });
  try {
    persist.setJSON(keyFor(req.user.id), list);
    res.json({ ok: true });
  } catch (e) {
    console.error("history write:", e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
