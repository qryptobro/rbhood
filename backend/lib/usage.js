const persist = require("./persist");

// Учёт запросов анализа по дням и пользователям (ключ "usage"):
// { "YYYY-MM-DD": { "<userId>": count } }
// (старый плоский формат { "<userId>": count } тоже поддерживается как «без даты»)
function readUsage() {
  return persist.getJSON("usage", {});
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
  persist.setJSON("usage", data);
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
