const fs = require("fs");
const path = require("path");

// Лог устройств/IP по пользователю: backend/data/devices.json
// { "<userId>": { "<ip>": { ua, count, first, last } } }
const DIR = path.join(__dirname, "..", "data");
const FILE = path.join(DIR, "devices.json");
try { fs.mkdirSync(DIR, { recursive: true }); } catch { /* ignore */ }

const MAX_IPS = 50;            // максимум хранимых IP на пользователя
const THROTTLE_MS = 10 * 60e3; // не чаще раза в 10 мин на тот же IP

function read() {
  try { if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, "utf8")) || {}; } catch { /* ignore */ }
  return {};
}
function write(data) {
  try { fs.writeFileSync(FILE, JSON.stringify(data), "utf8"); } catch { /* ignore */ }
}

const ipFrom = (req) =>
  (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
  req.socket?.remoteAddress || "unknown";

// Записать визит (с троттлингом, чтобы не писать на каждый запрос)
function record(userId, req) {
  if (!userId) return;
  const ip = ipFrom(req);
  const ua = (req.headers["user-agent"] || "").slice(0, 200);
  const now = Date.now();
  const data = read();
  const u = data[userId] || (data[userId] = {});
  const prev = u[ip];
  if (prev && now - prev.last < THROTTLE_MS) return; // недавно уже писали — пропускаем
  u[ip] = { ua, count: (prev?.count || 0) + 1, first: prev?.first || now, last: now };

  // ограничиваем число IP (удаляем самые старые)
  const ips = Object.keys(u);
  if (ips.length > MAX_IPS) {
    ips.sort((a, b) => u[a].last - u[b].last).slice(0, ips.length - MAX_IPS).forEach(k => delete u[k]);
  }
  write(data);
}

// Сводка по пользователю: сколько уникальных IP и список
function summary(userId) {
  const u = read()[userId] || {};
  const list = Object.entries(u).map(([ip, v]) => ({ ip, ...v })).sort((a, b) => b.last - a.last);
  return { ipCount: list.length, list };
}

// Краткая сводка по всем: { userId: ipCount }
function counts() {
  const data = read();
  const out = {};
  for (const [uid, u] of Object.entries(data)) out[uid] = Object.keys(u).length;
  return out;
}

module.exports = { record, summary, counts };
