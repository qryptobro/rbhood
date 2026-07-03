const router = require("express").Router();
const persist = require("../lib/persist");

// Серверное хранилище админ-стора (инструменты, иконки, брокеры, отзывы, промокоды и т.д.)
// Ключ "store" в persist (Postgres в проде / файл локально).

// GET /api/state — отдать сохранённый стор
router.get("/", (req, res) => {
  res.json({ value: persist.getRaw("store") });
});

// POST /api/state — сохранить стор (body: { value: "<json string>" })
router.post("/", (req, res) => {
  const value = req.body && req.body.value;
  if (typeof value !== "string") {
    return res.status(400).json({ error: "value (string) required" });
  }
  try {
    persist.setRaw("store", value);
    res.json({ ok: true });
  } catch (e) {
    console.error("state write:", e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
