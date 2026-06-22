// signalScheduler.js — фоновая генерация и разрешение торговых сигналов.
// Логируем только качественные сигналы (винрейт бэктеста >= порога), затем
// сверяем их с реальными свечами MT5 и считаем фактический исход (TP/SL/expired).
const fs = require("fs");
const path = require("path");
const { getCandles } = require("./marketData");
const { buildPendingOrder } = require("./strategy");
const signals = require("../lib/signals");

const GEN_MS = Number(process.env.SIGNAL_GEN_MIN || 30) * 60e3;   // генерация раз в 30 мин
const RES_MS = Number(process.env.SIGNAL_RES_MIN || 10) * 60e3;   // проверка исходов раз в 10 мин

// Порог винрейта/выборки — настраивается из админки (хранится в файле)
const CFG_FILE = path.join(__dirname, "..", "data", "signal-config.json");
function getConfig() {
  let c = {};
  try { if (fs.existsSync(CFG_FILE)) c = JSON.parse(fs.readFileSync(CFG_FILE, "utf8")) || {}; } catch { /* ignore */ }
  return {
    minWinrate: c.minWinrate != null ? c.minWinrate : Number(process.env.SIGNAL_MIN_WINRATE || 60),
    minTrades: c.minTrades != null ? c.minTrades : Number(process.env.SIGNAL_MIN_TRADES || 8),
  };
}
function setConfig(patch) {
  const c = getConfig();
  if (patch.minWinrate != null) c.minWinrate = Math.max(0, Math.min(100, Number(patch.minWinrate)));
  if (patch.minTrades != null) c.minTrades = Math.max(1, Number(patch.minTrades));
  try { fs.writeFileSync(CFG_FILE, JSON.stringify(c), "utf8"); } catch { /* ignore */ }
  return c;
}

const TFS = ["5m", "15m"]; // только скальп и дей-трейдер (свинг 4h не считаем)
const ASSETS = [
  // Форекс/металлы
  ["XAUUSD","forex"],["XAGUSD","forex"],["EURUSD","forex"],["GBPUSD","forex"],["USDJPY","forex"],
  ["AUDUSD","forex"],["USDCHF","forex"],["NZDUSD","forex"],["USDCAD","forex"],["AUDJPY","forex"],
  // Крипто (24/7)
  ["BTCUSDT","crypto"],["ETHUSDT","crypto"],["SOLUSDT","crypto"],["BNBUSDT","crypto"],["XRPUSDT","crypto"],
  ["ADAUSDT","crypto"],["DOGEUSDT","crypto"],["AVAXUSDT","crypto"],["DOTUSDT","crypto"],["LINKUSDT","crypto"],
];

// Форекс открыт: вс 22:00 UTC – пт 21:00 UTC. В выходные сигналы по форексу не генерим.
function forexOpen() {
  const now = new Date();
  const day = now.getUTCDay();            // 0=вс, 6=сб
  const tmin = now.getUTCHours() * 60 + now.getUTCMinutes();
  if (day === 6) return false;            // суббота
  if (day === 0 && tmin < 22 * 60) return false; // вс до 22:00 UTC
  if (day === 5 && tmin >= 21 * 60) return false; // пт после 21:00 UTC
  return true;
}

// Сгенерировать новые сигналы (только winrate >= порога)
async function generate() {
  const fxOpen = forexOpen();
  const cfg = getConfig();
  for (const [symbol, category] of ASSETS) {
    if (category === "forex" && !fxOpen) continue; // выходные — форекс не торгуется
    for (const tf of TFS) {
      if (signals.hasOpen(symbol, tf)) continue; // не дублируем открытый сигнал
      try {
        const candles = await getCandles(symbol, tf, 600); // больше истории → больше независимых сделок
        if (!candles || candles.length < 60) continue;
        const p = buildPendingOrder(candles, tf);
        if (p.action === "WAIT") continue;
        if (p.winrate == null || p.winrate < cfg.minWinrate) continue;
        if (p.trades < cfg.minTrades) continue;
        signals.add({
          symbol, category, tf,
          action: p.action, entry: p.entry, sl: p.stopLoss, tp: p.takeProfit,
          rr: p.rr, winrate: p.winrate, trades: p.trades, expectancy: p.expectancy, validityHours: p.validityHours,
          reason: p.reason,
          createdCandleTime: candles[candles.length - 1].time,
        });
      } catch { /* пропускаем актив при ошибке */ }
    }
  }
}

// Проверить открытые сигналы по свежим свечам
async function resolve() {
  const open = signals.openSignals();
  const byKey = {};
  for (const s of open) (byKey[`${s.symbol}|${s.tf}`] ||= []).push(s);

  for (const key of Object.keys(byKey)) {
    const [symbol, tf] = key.split("|");
    let candles;
    try { candles = await getCandles(symbol, tf, 300); } catch { continue; }
    if (!candles || candles.length < 2) continue;
    const closed = candles.slice(0, -1); // только ЗАКРЫТЫЕ свечи (формирующуюся исключаем)

    for (const s of byKey[key]) {
      const after = closed.filter(c => c.time > s.createdCandleTime);
      const validMs = (s.validityHours || 24) * 3600e3;
      let filled = !!s.filledAt, filledAt = s.filledAt, status = "open";
      let fillCT = s.filledCandleTime != null ? s.filledCandleTime : s.filledAt;
      const hitSL = (c) => s.action === "BUY_LIMIT" ? c.low <= s.sl : c.high >= s.sl;
      const hitTP = (c) => s.action === "BUY_LIMIT" ? c.high >= s.tp : c.low <= s.tp;
      for (const c of after) {
        if (!filled) {
          if (c.time - s.createdCandleTime > validMs) { status = "expired"; break; }
          const hit = s.action === "BUY_LIMIT" ? c.low <= s.entry : c.high >= s.entry;
          if (!hit) continue;
          filled = true; filledAt = c.time; fillCT = c.time;
          if (hitSL(c)) { status = "loss"; break; } // свеча входа — только SL
          continue;
        }
        if (c.time === fillCT) { if (hitSL(c)) { status = "loss"; break; } continue; }
        if (hitSL(c)) { status = "loss"; break; }
        if (hitTP(c)) { status = "win"; break; }
      }
      if (status === "open" && filled !== !!s.filledAt) {
        signals.update(s.id, { filledAt, filledCandleTime: fillCT }); // зафиксировали факт входа
      } else if (status !== "open") {
        const resultR = status === "win" ? s.rr : status === "loss" ? -1 : 0;
        signals.update(s.id, { status, filledAt, filledCandleTime: fillCT, resolvedAt: Date.now(), resultR });
      }
    }
  }
}

// Общий лок: generate и resolve не должны пересекаться (оба пишут signals.json)
let busy = false;
async function runGen() { if (busy) return; busy = true; try { await generate(); } catch { /* ignore */ } finally { busy = false; } }
async function runRes() { if (busy) return; busy = true; try { await resolve(); } catch { /* ignore */ } finally { busy = false; } }

function start() {
  setTimeout(runGen, 20e3);  // первый прогон через 20с после старта
  setTimeout(runRes, 40e3);
  setInterval(runGen, GEN_MS);
  setInterval(runRes, RES_MS);
  console.log(`Signal scheduler: gen every ${GEN_MS/60e3}m, resolve every ${RES_MS/60e3}m, min winrate ${getConfig().minWinrate}%`);
}

module.exports = { start, generate, resolve, getConfig, setConfig };
