const fs = require("fs");
const path = require("path");

// Учёт запросов анализа по дням и пользователям:
// backend/data/usage.json -> { "YYYY-MM-DD": { "<userId>": count } }
// (старый плоский формат { "<userId>": count } тоже поддерживается как «без даты»)
const DIR = path.join(__dirname, "..", "data");
const FILE = path.join(DIR, "usage.json");
try { fs.mkdirSync(DIR, { recursive: true }); } catch { /* ignore */ }

function readUsage() {
  try {
    if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, "utf8")) || {};
  } catch { /* ignore */ }
  return {};
}

// Локальная дата сервера в формате YYYY-MM-DD
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function incr(userId) {
  if (!userId) return;
  const data = readUsage();
  const day = today();
  if (typeof data[day] !== "object" || data[day] === null) data[day] = {};
  data[day][userId] = (data[day][userId] || 0) + 1;
  try { fs.writeFileSync(FILE, JSON.stringify(data), "utf8"); } catch { /* ignore */ }
}

// Суммировать запросы по пользователям за период [from, to] (включительно, YYYY-MM-DD).
// from/to не заданы → за всё время. Возвращает { "<userId>": count }.
function aggregate(from, to) {
  const data = readUsage();
  const out = {};
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === "number") {
      // старый плоский формат (без даты) — учитываем только когда период не задан
      if (!from && !to) out[key] = (out[key] || 0) + val;
      continue;
    }
    if (from && key < from) continue;
    if (to && key > to) continue;
    for (const [uid, c] of Object.entries(val)) out[uid] = (out[uid] || 0) + (c || 0);
  }
  return out;
}

module.exports = { readUsage, incr, aggregate };
