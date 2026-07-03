// persist.js — единое key-value хранилище с СИНХРОННЫМ API.
//   Режим "db" (KV_STORE=db + DATABASE_URL): значения в памяти, персист в Postgres (таблица KV).
//     Чтения — из памяти (мгновенно), записи — в память + async-upsert в БД.
//     При старте всё грузится из БД + одноразово импортируется из старых файлов backend/data.
//   Режим "file" (по умолчанию): работает точно как раньше — читает/пишет backend/data/*.json.
// Синхронный API нарочно сохранён, чтобы не переписывать роуты/либы на async.
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const USE_DB = process.env.KV_STORE === "db" && !!process.env.DATABASE_URL;

let prisma = null;
if (USE_DB) { try { prisma = require("./prisma"); } catch (e) { console.error("persist: prisma unavailable —", e.message); } }

const mem = new Map(); // key -> raw JSON string

// Путь файла для ключа (file-режим и импорт). history:<id> -> data/history/<id>.json
function filePath(key) {
  if (key.startsWith("history:")) return path.join(DATA_DIR, "history", key.slice(8) + ".json");
  return path.join(DATA_DIR, key + ".json");
}

// ── старт: загрузка из БД + импорт старых файлов ──
async function init() {
  if (!USE_DB || !prisma) { console.log("persist: file mode"); return; }
  try {
    const rows = await prisma.kV.findMany();
    for (const r of rows) mem.set(r.key, r.value);
    await seedFromFiles();
    console.log(`persist: db mode, ${mem.size} keys loaded`);
  } catch (e) {
    console.error("persist init failed:", e.message);
  }
}

// Одноразовый импорт существующих backend/data/*.json в БД (если ключа ещё нет)
async function seedFromFiles() {
  const flat = ["store", "usage", "referrals", "pay-pending", "withdrawals", "partner-codes", "devices", "notified"];
  for (const key of flat) {
    if (mem.has(key)) continue;
    try {
      const p = filePath(key);
      if (fs.existsSync(p)) { const v = fs.readFileSync(p, "utf8"); mem.set(key, v); await upsert(key, v); }
    } catch { /* ignore */ }
  }
  try {
    const hdir = path.join(DATA_DIR, "history");
    if (fs.existsSync(hdir)) for (const f of fs.readdirSync(hdir)) {
      if (!f.endsWith(".json")) continue;
      const key = "history:" + f.replace(/\.json$/, "");
      if (mem.has(key)) continue;
      const v = fs.readFileSync(path.join(hdir, f), "utf8");
      mem.set(key, v); await upsert(key, v);
    }
  } catch { /* ignore */ }
}

async function upsert(key, value) {
  if (!prisma) return;
  try { await prisma.kV.upsert({ where: { key }, update: { value }, create: { key, value } }); }
  catch (e) { console.error("persist upsert", key, e.message); }
}

// ── синхронный API ──
function getRaw(key) {
  if (USE_DB) return mem.has(key) ? mem.get(key) : null;
  try { const p = filePath(key); if (fs.existsSync(p)) return fs.readFileSync(p, "utf8"); } catch { /* ignore */ }
  return null;
}

function setRaw(key, value) {
  if (USE_DB) { mem.set(key, value); upsert(key, value); return; } // async fire-and-forget
  try { const p = filePath(key); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, value, "utf8"); }
  catch (e) { console.error("persist write", key, e.message); }
}

function getJSON(key, def) { const s = getRaw(key); if (s == null) return def; try { return JSON.parse(s); } catch { return def; } }
function setJSON(key, obj) { setRaw(key, JSON.stringify(obj)); }

module.exports = { init, getRaw, setRaw, getJSON, setJSON };
