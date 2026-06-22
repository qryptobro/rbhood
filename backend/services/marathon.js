// marathon.js — виртуальный марафон по сигналам с управлением из админки.
// До N сделок одновременно (компаундинг), отдельный Telegram-бот шлёт в группу,
// отслеживает исходы по свечам MT5 и обновляет депозит.
const fs = require("fs");
const path = require("path");
const { getCandles } = require("./marketData");
const { buildPendingOrder } = require("./strategy");

const TOKEN = process.env.MARATHON_BOT_TOKEN || "";
const CHAT = process.env.MARATHON_CHAT_ID || "";
const LOOP_MS = Number(process.env.MARATHON_LOOP_MIN || 15) * 60e3;      // поиск новых сигналов — раз в 15 мин
const RESOLVE_MS = Number(process.env.MARATHON_RESOLVE_SEC || 5) * 1000; // проверка цены — каждые 5 сек (секундные тики)

const DIR = path.join(__dirname, "..", "data");
const FILE = path.join(DIR, "marathon.json");
try { fs.mkdirSync(DIR, { recursive: true }); } catch { /* ignore */ }

const FOREX = ["XAUUSD","XAGUSD","EURUSD","GBPUSD","USDJPY","AUDUSD","USDCHF","NZDUSD","USDCAD","AUDJPY"];
const CRYPTO = ["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT","ADAUSDT","DOGEUSDT","AVAXUSDT","DOTUSDT","LINKUSDT"];

function defaultConfig() {
  return {
    minWinrate: Number(process.env.MARATHON_MIN_WINRATE || 50),
    minTrades: Number(process.env.MARATHON_MIN_TRADES || 15),
    riskPct: Number(process.env.MARATHON_RISK_PCT || 10),
    maxConcurrent: Number(process.env.MARATHON_MAX_CONCURRENT || 3),
    start: Number(process.env.MARATHON_START || 100),
    target: Number(process.env.MARATHON_TARGET || 1000),
    market: process.env.MARATHON_MARKET || "crypto",
    tfs: ["5m", "15m"],
  };
}

function read() {
  let s = null;
  try { if (fs.existsSync(FILE)) s = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { /* ignore */ }
  if (!s) s = { deposit: defaultConfig().start, status: "running", actives: [], trades: [], startedAt: Date.now() };
  if (!s.config) s.config = defaultConfig();
  if (s.config.maxConcurrent == null) s.config.maxConcurrent = 3;
  if (!Array.isArray(s.actives)) s.actives = s.active ? [s.active] : []; // миграция со старого single
  delete s.active;
  return s;
}
function write(s) { try { fs.writeFileSync(FILE, JSON.stringify(s), "utf8"); } catch { /* ignore */ } }

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

function lotFor(symbol, entry, sl, riskUsd) {
  const dist = Math.abs(entry - sl);
  if (!dist) return 0.01;
  let v;
  if (symbol.endsWith("USDT")) v = dist;
  else if (symbol === "XAUUSD") v = dist * 100;
  else if (symbol === "XAGUSD") v = dist * 5000;
  else if (/USD$/.test(symbol)) v = dist * 100000;
  else v = dist * 100000 / entry;
  return Math.max(0.01, Math.round((riskUsd / v) * 100) / 100);
}

function universe(market) {
  if (market === "forex") return FOREX.map(s => [s, "forex"]);
  if (market === "both") return [...CRYPTO.map(s => [s, "crypto"]), ...FOREX.map(s => [s, "forex"])];
  return CRYPTO.map(s => [s, "crypto"]);
}

async function generate(state) {
  const cfg = state.config;
  if (state.actives.length >= cfg.maxConcurrent) return;
  const fxOpen = forexOpen();
  // не более ОДНОЙ сделки на пару (независимо от ТФ)
  const activeSyms = new Set(state.actives.map(a => a.symbol));

  const cands = [];
  for (const [sym, cat] of universe(cfg.market)) {
    if (cat === "forex" && !fxOpen) continue;
    if (activeSyms.has(sym)) continue; // по этой паре уже есть сделка
    for (const tf of cfg.tfs) {
      try {
        const c = await getCandles(sym, tf, 200);
        if (!c || c.length < 60) continue;
        const p = buildPendingOrder(c, tf);
        if (p.action === "WAIT" || p.winrate == null || p.winrate < cfg.minWinrate || p.trades < cfg.minTrades) continue;
        cands.push({ sym, tf, p, lastTime: c[c.length - 1].time });
      } catch { /* skip */ }
    }
  }
  // лучший по винрейту; на одну пару — только один кандидат (берётся лучший ТФ)
  cands.sort((a, b) => b.p.winrate - a.p.winrate);

  for (const best of cands) {
    if (state.actives.length >= cfg.maxConcurrent) break;
    if (state.actives.some(a => a.symbol === best.sym)) continue; // пара уже занята
    const riskUsd = +(state.deposit * cfg.riskPct / 100).toFixed(2);
    const lot = lotFor(best.sym, best.p.entry, best.p.stopLoss, riskUsd);
    const a = {
      symbol: best.sym, tf: best.tf, action: best.p.action, entry: best.p.entry, sl: best.p.stopLoss, tp: best.p.takeProfit,
      rr: best.p.rr, winrate: best.p.winrate, trades: best.p.trades, regime: best.p.regime, reason: best.p.reason,
      lot, riskUsd, depositAtOpen: state.deposit,
      createdCandleTime: best.lastTime, filled: false, filledAt: null, fillPrice: null, openedAt: Date.now(), validityHours: best.p.validityHours,
    };
    state.actives.push(a); write(state);
    await send(
      `📊 <b>${a.symbol}</b> · ${a.action.replace("_", " ")} · ${a.tf}\n` +
      `Вход: <b>${a.entry}</b>\nSL: ${a.sl} · TP: ${a.tp} (RR 1:${a.rr})\n` +
      `Лот: ~<b>${a.lot}</b> · риск $${a.riskUsd} (${cfg.riskPct}%)\n` +
      `📈 Бэктест: винрейт <b>${a.winrate}%</b> на ${a.trades} сделках${a.reason ? `\nРежим: ${a.reason}` : ""}\n` +
      `💰 Депозит: $${state.deposit.toFixed(2)} · сделок в работе: ${state.actives.length}/${cfg.maxConcurrent}\n` +
      `<i>Сигнал, не финансовая рекомендация.</i>`
    );
  }
}

// Текущая рыночная цена = close формирующейся свечи (последний реальный тик).
// Берём НЕ High/Low (это «края» свечи, куда мог сходить лишь фитиль), а именно
// цену, по которой рынок торгуется прямо сейчас — её ни с чем не спутать.
async function livePrice(symbol, tf) {
  const c = await getCandles(symbol, tf, 3);
  if (!c || !c.length) return null;
  const last = c[c.length - 1];
  return last && last.close != null ? last.close : null;
}

// Отслеживание сделок по ТЕКУЩЕЙ цене (секундные тики). Никаких High/Low —
// фиксируем вход/TP/SL только когда реальная цена пересекла уровень.
async function resolveAll(state) {
  for (const a of [...state.actives]) {
    let price; try { price = await livePrice(a.symbol, a.tf); } catch { continue; }
    if (price == null) continue;

    const validMs = (a.validityHours || 24) * 3600e3;

    // ── ещё не вошли: ждём, пока цена дойдёт до входа ──
    if (!a.filled) {
      if (Date.now() - a.openedAt > validMs) { // срок ордера истёк, не активировался
        state.trades.push({ ...a, status: "expired", pnl: 0, closedAt: Date.now() });
        state.actives = state.actives.filter(x => x !== a); write(state);
        await send(`⏳ <b>${a.symbol}</b> ордер не активировался (истёк срок ${a.validityHours}ч). Депозит без изменений.`);
        continue;
      }
      const reached = a.action === "BUY_LIMIT" ? price <= a.entry : price >= a.entry;
      if (!reached) continue;
      a.filled = true; a.filledAt = Date.now(); a.fillPrice = price; write(state);
      await send(`▶️ <b>${a.symbol}</b> вход сработал по <b>${price}</b>. Ждём TP/SL…`);
      continue; // на тике входа TP/SL не проверяем
    }

    // ── в сделке: смотрим, куда пришла текущая цена ──
    const hitSL = a.action === "BUY_LIMIT" ? price <= a.sl : price >= a.sl;
    const hitTP = a.action === "BUY_LIMIT" ? price >= a.tp : price <= a.tp;
    let status = null;
    if (hitSL) status = "loss";       // SL приоритетнее (консервативно)
    else if (hitTP) status = "win";
    if (!status) continue;

    let pnl, emoji, label;
    if (status === "win") { pnl = +(a.riskUsd * (a.rr || 2)).toFixed(2); emoji = "✅"; label = "TP"; }
    else { pnl = -a.riskUsd; emoji = "❌"; label = "SL"; }

    state.deposit = +(state.deposit + pnl).toFixed(2);
    state.trades.push({ ...a, status, pnl, closedAt: Date.now(), closePrice: price });
    state.actives = state.actives.filter(x => x !== a); write(state);

    const pct = (((state.deposit - state.config.start) / state.config.start) * 100).toFixed(0);
    await send(`${emoji} <b>${a.symbol}</b> ${label} по <b>${price}</b>! ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}\n💰 Депозит: <b>$${state.deposit.toFixed(2)}</b> (${pct}% от старта)`);

    if (state.deposit >= state.config.target) {
      state.status = "done"; write(state);
      await send(`🎉 <b>Цель достигнута!</b> Депозит $${state.deposit.toFixed(2)} ≥ $${state.config.target}. Марафон завершён.`);
      return;
    }
    if (state.deposit <= 0) {
      state.status = "done"; write(state);
      await send(`💀 Депозит обнулён ($${state.deposit.toFixed(2)}). Марафон остановлен.`);
      return;
    }
  }
}

let busy = false;
// Полный тик: проверка открытых сделок + поиск новых сигналов (раз в 15 мин)
async function tick() {
  if (!TOKEN || !CHAT || busy) return;
  busy = true;
  try {
    const state = read();
    if (state.status !== "running") return;
    await resolveAll(state);
    if (state.status !== "running") return;
    if (state.deposit <= 0) { state.status = "done"; write(state); await send(`💀 Депозит обнулён ($${state.deposit.toFixed(2)}). Марафон остановлен.`); return; }
    if (state.deposit >= state.config.target) { state.status = "done"; write(state); await send(`🎉 Цель $${state.config.target} достигнута!`); return; }
    await generate(state);
  } finally { busy = false; }
}

// Быстрый тик: проверка открытых сделок по текущей цене (секундные тики)
async function resolveTick() {
  if (!TOKEN || !CHAT || busy) return;
  const state = read();
  if (state.status !== "running" || !state.actives.length) return;
  busy = true;
  try { await resolveAll(state); } finally { busy = false; }
}

function start() {
  if (!TOKEN || !CHAT) { console.log("Marathon: off (no MARATHON_BOT_TOKEN/CHAT)"); return; }
  setTimeout(() => tick().catch(() => {}), 30e3);
  setInterval(() => tick().catch(() => {}), LOOP_MS);          // новые сигналы — 15 мин
  setInterval(() => resolveTick().catch(() => {}), RESOLVE_MS); // проверка цены — каждые 5 сек
  console.log(`Marathon: on (analysis every ${LOOP_MS/60e3}m, price-track every ${RESOLVE_MS/1000}s)`);
}

function getState() { return read(); }
function reset() { const s = read(); s.deposit = s.config.start; s.status = "running"; s.actives = []; s.trades = []; s.startedAt = Date.now(); write(s); return s; }
function setStatus(st) { const s = read(); s.status = st; write(s); return s; }
function setConfig(patch) {
  const s = read(); const c = s.config;
  if (patch.minWinrate != null) c.minWinrate = Math.max(0, Math.min(100, Number(patch.minWinrate)));
  if (patch.minTrades != null) c.minTrades = Math.max(1, Number(patch.minTrades));
  if (patch.riskPct != null) c.riskPct = Math.max(0.1, Math.min(100, Number(patch.riskPct)));
  if (patch.maxConcurrent != null) c.maxConcurrent = Math.max(1, Math.min(10, Number(patch.maxConcurrent)));
  if (patch.start != null) c.start = Math.max(1, Number(patch.start));
  if (patch.target != null) c.target = Math.max(1, Number(patch.target));
  if (patch.market && ["crypto", "forex", "both"].includes(patch.market)) c.market = patch.market;
  if (Array.isArray(patch.tfs) && patch.tfs.length) c.tfs = patch.tfs.filter(t => ["5m", "15m", "4h"].includes(t));
  write(s); return s;
}
const configured = () => !!(TOKEN && CHAT);

module.exports = { start, tick, getState, reset, setStatus, setConfig, configured };
