const router = require("express").Router();
const fs = require("fs");
const path = require("path");

// Серверное хранилище админ-стора (инструменты, иконки, брокеры, отзывы и т.д.)
// Лежит в backend/data/store.json — переживает перезагрузки и виден всем.
const DATA_DIR = path.join(__dirname, "..", "data");
const FILE = path.join(DATA_DIR, "store.json");
try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch { /* ignore */ }

// GET /api/state — отдать сохранённый стор
router.get("/", (req, res) => {
  try {
    if (fs.existsSync(FILE)) {
      return res.json({ value: fs.readFileSync(FILE, "utf8") });
    }
  } catch (e) {
    console.warn("state read:", e.message);
  }
  res.json({ value: null });
});

// POST /api/state — сохранить стор (body: { value: "<json string>" })
router.post("/", (req, res) => {
  const value = req.body && req.body.value;
  if (typeof value !== "string") {
    return res.status(400).json({ error: "value (string) required" });
  }
  try {
    fs.writeFileSync(FILE, value, "utf8");
    res.json({ ok: true });
  } catch (e) {
    console.error("state write:", e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
