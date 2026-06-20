const fs = require("fs");
const path = require("path");

// Журнал выданных сигналов + их реальные исходы: backend/data/signals.json
// Сигнал: { id, time, symbol, category, tf, action, entry, sl, tp, rr, winrate, trades,
//           validityHours, createdCandleTime, status:"open"|"win"|"loss"|"expired",
//           filledAt, resolvedAt, resultR }
const DIR = path.join(__dirname, "..", "data");
const FILE = path.join(DIR, "signals.json");
try { fs.mkdirSync(DIR, { recursive: true }); } catch { /* ignore */ }

const read = () => { try { if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, "utf8")) || { items: [] }; } catch { /* ignore */ } return { items: [] }; };
const write = (d) => { try { fs.writeFileSync(FILE, JSON.stringify(d), "utf8"); } catch { /* ignore */ } };

function list() { return read().items.slice().sort((a, b) => b.time - a.time); }
function openSignals() { return read().items.filter(s => s.status === "open"); }
function hasOpen(symbol, tf) { return read().items.some(s => s.status === "open" && s.symbol === symbol && s.tf === tf); }

function add(sig) {
  const data = read();
  data.items.push({ id: Date.now() + Math.floor(Math.random() * 1000), time: Date.now(), status: "open", filledAt: null, resolvedAt: null, resultR: null, ...sig });
  if (data.items.length > 5000) data.items = data.items.slice(-5000);
  write(data);
}

function update(id, patch) {
  const data = read();
  const s = data.items.find(x => x.id === id);
  if (s) { Object.assign(s, patch); write(data); }
}

function stats() {
  const items = read().items;
  const resolved = items.filter(s => s.status === "win" || s.status === "loss");
  const wins = resolved.filter(s => s.status === "win").length;
  const losses = resolved.filter(s => s.status === "loss").length;
  const winrate = resolved.length ? Math.round((wins / resolved.length) * 100) : null;
  const totalR = items.reduce((s2, s) => s2 + (s.resultR || 0), 0);
  return {
    total: items.length,
    open: items.filter(s => s.status === "open").length,
    expired: items.filter(s => s.status === "expired").length,
    wins, losses, winrate,
    totalR: +totalR.toFixed(2),
  };
}

module.exports = { list, openSignals, hasOpen, add, update, stats };
