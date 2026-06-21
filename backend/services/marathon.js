// marathon.js — виртуальный марафон $100 → $1000 по форекс-сигналам.
// Отдельный Telegram-бот шлёт сигналы в группу, рискует 10% депозита на сделку,
// отслеживает исход по свечам MT5 и обновляет депозит. Сделки идут по одной (компаундинг).
const fs = require("fs");
const path = require("path");
const { getCandles } = require("./marketData");
const { buildPendingOrder } = require("./strategy");

const TOKEN = process.env.MARATHON_BOT_TOKEN || "";
const CHAT = process.env.MARATHON_CHAT_ID || "";
const TF = process.env.MARATHON_TF || "15m";
const RISK = Number(process.env.MARATHON_RISK_PCT || 10) / 100;
const START = Number(process.env.MARATHON_START || 100);
const TARGET = Number(process.env.MARATHON_TARGET || 1000);
const MIN_WR = Number(process.env.MARATHON_MIN_WINRATE || 60);
const MIN_TR = Number(process.env.MARATHON_MIN_TRADES || 15);
const LOOP_MS = Number(process.env.MARATHON_LOOP_MIN || 10) * 60e3;

const DIR = path.join(__dirname, "..", "data");
const FILE = path.join(DIR, "marathon.json");
try { fs.mkdirSync(DIR, { recursive: true }); } catch { /* ignore */ }

const FOREX = ["XAUUSD","XAGUSD","EURUSD","GBPUSD","USDJPY","AUDUSD","USDCHF","NZDUSD","USDCAD","AUDJPY"];

function read() {
  try { if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { /* ignore */ }
  return { deposit: START, status: "running", active: null, trades: [], startedAt: Date.now() };
}
function write(s) { try { fs.writeFileSync(FILE, JSON.stringify(s), "utf8"); } catch { /* ignore */ } }

// Форекс открыт: вс 22:00 UTC – пт 21:00 UTC
function forexOpen() {
  const d = new Date(); const day = d.getUTCDay(); const m = d.getUTCHours() * 60 + d.getUTCMinutes();
  if (day === 6) return false;
  if (day === 0 && m < 22 * 60) return false;
  if (day === 5 && m >= 21 * 60) return false;
  return true;
}

async function send(text) {
  if (!TOKEN || !CHAT) return;
  try {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
  } catch (e) { console.warn("marathon tg:", e.message); }
}

// Ориентировочный лот из риска ($) и расстояния до стопа
function lotFor(symbol, entry, sl, riskUsd) {
  const dist = Math.abs(entry - sl);
  if (!dist) return 0.01;
  let valuePerLot; // $ риска на 1.0 лот при этом расстоянии
  if (symbol === "XAUUSD") valuePerLot = dist * 100;          // золото: 100 oz
  else if (symbol === "XAGUSD") valuePerLot = dist * 5000;    // серебро: 5000 oz
  else if (/USD$/.test(symbol)) valuePerLot = dist * 100000;  // XXXUSD (котировка в USD)
  else valuePerLot = dist * 100000 / entry;                   // USDXXX / кроссы — приблизительно
  const lot = riskUsd / valuePerLot;
  return Math.max(0.01, Math.round(lot * 100) / 100);
}

async function generate(state) {
  let best = null;
  for (const sym of FOREX) {
    try {
      const c = await getCandles(sym, TF, 200);
      if (!c || c.length < 60) continue;
      const p = buildPendingOrder(c, TF);
      if (p.action === "WAIT" || p.winrate == null || p.winrate < MIN_WR || p.trades < MIN_TR) continue;
      if (!best || p.winrate > best.p.winrate) best = { sym, p, lastTime: c[c.length - 1].time };
    } catch { /* skip */ }
  }
  if (!best) return false;

  const riskUsd = +(state.deposit * RISK).toFixed(2);
  const lot = lotFor(best.sym, best.p.entry, best.p.stopLoss, riskUsd);
  state.active = {
    symbol: best.sym, tf: TF, action: best.p.action, entry: best.p.entry, sl: best.p.stopLoss, tp: best.p.takeProfit,
    rr: best.p.rr, winrate: best.p.winrate, lot, riskUsd, depositAtOpen: state.deposit,
    createdCandleTime: best.lastTime, filled: false, filledAt: null, openedAt: Date.now(), validityHours: best.p.validityHours,
  };
  write(state);

  const a = state.active;
  await send(
    `📊 <b>${a.symbol}</b> · ${a.action.replace("_", " ")}\n` +
    `Вход: <b>${a.entry}</b>\nSL: ${a.sl} · TP: ${a.tp} (RR 1:${a.rr})\n` +
    `Лот: ~<b>${a.lot}</b> · риск $${a.riskUsd} (${RISK * 100}%)\n` +
    `Винрейт (бэктест): ${a.winrate}%\n` +
    `💰 Депозит: $${state.deposit.toFixed(2)} → цель $${TARGET}\n` +
    `<i>Сигнал, не финансовая рекомендация.</i>`
  );
  return true;
}

async function resolveActive(state) {
  const a = state.active;
  let candles; try { candles = await getCandles(a.symbol, a.tf, 300); } catch { return; }
  if (!candles) return;
  const after = candles.filter(c => c.time > a.createdCandleTime);
  const validMs = (a.validityHours || 24) * 3600e3;
  let filled = a.filled, filledAt = a.filledAt, status = "open";
  for (const c of after) {
    if (!filled) {
      if (c.time - a.createdCandleTime > validMs) { status = "expired"; break; }
      const hit = a.action === "BUY_LIMIT" ? c.low <= a.entry : c.high >= a.entry;
      if (hit) { filled = true; filledAt = c.time; }
      continue; // свеча входа — TP/SL не проверяем
    }
    if (a.action === "BUY_LIMIT") {
      if (c.low <= a.sl) { status = "loss"; break; }
      if (c.high >= a.tp) { status = "win"; break; }
    } else {
      if (c.high >= a.sl) { status = "loss"; break; }
      if (c.low <= a.tp) { status = "win"; break; }
    }
  }

  if (status === "open") {
    if (filled !== a.filled) {
      a.filled = filled; a.filledAt = filledAt; write(state);
      await send(`▶️ <b>${a.symbol}</b> ордер сработал (вход ${a.entry}). Ждём TP/SL…`);
    }
    return;
  }

  let pnl = 0, emoji = "⏳", label = "не активировался";
  if (status === "win") { pnl = +(a.riskUsd * (a.rr || 2)).toFixed(2); emoji = "✅"; label = "TP"; }
  else if (status === "loss") { pnl = -a.riskUsd; emoji = "❌"; label = "SL"; }

  state.deposit = +(state.deposit + pnl).toFixed(2);
  state.trades.push({ ...a, status, pnl, closedAt: Date.now() });
  state.active = null;
  write(state);

  const pct = (((state.deposit - START) / START) * 100).toFixed(0);
  await send(`${emoji} <b>${a.symbol}</b> ${label}! ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}\n💰 Депозит: <b>$${state.deposit.toFixed(2)}</b> (${pct}% от старта)`);

  if (state.deposit >= TARGET) {
    state.status = "done"; write(state);
    await send(`🎉 <b>Цель достигнута!</b> Депозит $${state.deposit.toFixed(2)} ≥ $${TARGET}. Марафон завершён.`);
  }
}

let busy = false;
async function tick() {
  if (!TOKEN || !CHAT || busy) return;
  busy = true;
  try {
    const state = read();
    if (state.status !== "running") return;
    if (state.active) { await resolveActive(state); return; }
    if (state.deposit >= TARGET) { state.status = "done"; write(state); await send(`🎉 Цель $${TARGET} достигнута!`); return; }
    if (!forexOpen()) return;
    await generate(state);
  } finally { busy = false; }
}

function start() {
  if (!TOKEN || !CHAT) { console.log("Marathon: off (no MARATHON_BOT_TOKEN/CHAT)"); return; }
  setTimeout(() => tick().catch(() => {}), 30e3);
  setInterval(() => tick().catch(() => {}), LOOP_MS);
  console.log(`Marathon: on (${START}->${TARGET}, risk ${RISK*100}%, tf ${TF}, every ${LOOP_MS/60e3}m)`);
}

// Управление из админки
function getState() { return read(); }
function reset() { const s = { deposit: START, status: "running", active: null, trades: [], startedAt: Date.now() }; write(s); return s; }
function setStatus(st) { const s = read(); s.status = st; write(s); return s; }

module.exports = { start, tick, getState, reset, setStatus, START, TARGET };
