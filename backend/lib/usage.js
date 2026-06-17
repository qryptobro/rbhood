const fs = require("fs");
const path = require("path");

// Счётчики запросов анализа по пользователям: backend/data/usage.json -> { "<userId>": count }
const DIR = path.join(__dirname, "..", "data");
const FILE = path.join(DIR, "usage.json");
try { fs.mkdirSync(DIR, { recursive: true }); } catch { /* ignore */ }

function readUsage() {
  try {
    if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, "utf8")) || {};
  } catch { /* ignore */ }
  return {};
}

function incr(userId) {
  if (!userId) return;
  const data = readUsage();
  data[userId] = (data[userId] || 0) + 1;
  try { fs.writeFileSync(FILE, JSON.stringify(data), "utf8"); } catch { /* ignore */ }
}

module.exports = { readUsage, incr };
