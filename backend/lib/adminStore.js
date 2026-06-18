const fs = require("fs");
const path = require("path");

// Чтение админ-стора (промокоды и т.д.) из backend/data/store.json
const FILE = path.join(__dirname, "..", "data", "store.json");

function readPromos() {
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, "utf8"));
    const promos = parsed?.state?.promos;
    return Array.isArray(promos) ? promos : [];
  } catch { return []; }
}

module.exports = { readPromos };
