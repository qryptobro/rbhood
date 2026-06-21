// signalScheduler.js — фоновая генерация и разрешение торговых сигналов.
// Логируем только качественные сигналы (винрейт бэктеста >= порога), затем
// сверяем их с реальными свечами MT5 и считаем фактический исход (TP/SL/expired).
const { getCandles } = require("./marketData");
const { buildPendingOrder } = require("./strategy");
const signals = require("../lib/signals");

const MIN_WINRATE = Number(process.env.SIGNAL_MIN_WINRATE || 60);
const MIN_TRADES = Number(process.env.SIGNAL_MIN_TRADES || 15);
const GEN_MS = Number(process.env.SIGNAL_GEN_MIN || 30) * 60e3;   // генерация раз в 30 мин
const RES_MS = Number(process.env.SIGNAL_RES_MIN || 10) * 60e3;   // проверка исходов раз в 10 мин

const TFS = ["5m", "15m", "4h"];
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
  for (const [symbol, category] of ASSETS) {
    if (category === "forex" && !fxOpen) continue; // выходные — форекс не торгуется
    for (const tf of TFS) {
      if (signals.hasOpen(symbol, tf)) continue; // не дублируем открытый сигнал
      try {
        const candles = await getCandles(symbol, tf, 200);
        if (!candles || candles.length < 60) continue;
        const p = buildPendingOrder(candles, tf);
        if (p.action === "WAIT") continue;
        if (p.winrate == null || p.winrate < MIN_WINRATE) continue;
        if (p.trades < MIN_TRADES) continue;
        signals.add({
          symbol, category, tf,
          action: p.action, entry: p.entry, sl: p.stopLoss, tp: p.takeProfit,
          rr: p.rr, winrate: p.winrate, trades: p.trades, validityHours: p.validityHours,
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
    if (!candles) continue;

    for (const s of byKey[key]) {
      const after = candles.filter(c => c.time > s.createdCandleTime);
      const validMs = (s.validityHours || 24) * 3600e3;
      let filled = !!s.filledAt, filledAt = s.filledAt, status = "open";
      for (const c of after) {
        if (!filled) {
          if (c.time - s.createdCandleTime > validMs) { status = "expired"; break; }
          const hit = s.action === "BUY_LIMIT" ? c.low <= s.entry : c.high >= s.entry;
          if (hit) { filled = true; filledAt = c.time; }
          continue; // на свече входа TP/SL не проверяем (порядок внутри свечи неизвестен)
        }
        // TP/SL — только на свечах ПОСЛЕ входа. SL проверяем первым (консервативно).
        if (s.action === "BUY_LIMIT") {
          if (c.low <= s.sl) { status = "loss"; break; }
          if (c.high >= s.tp) { status = "win"; break; }
        } else {
          if (c.high >= s.sl) { status = "loss"; break; }
          if (c.low <= s.tp) { status = "win"; break; }
        }
      }
      if (status === "open" && filled !== !!s.filledAt) {
        signals.update(s.id, { filledAt }); // зафиксировали факт входа
      } else if (status !== "open") {
        const resultR = status === "win" ? s.rr : status === "loss" ? -1 : 0;
        signals.update(s.id, { status, filledAt, resolvedAt: Date.now(), resultR });
      }
    }
  }
}

function start() {
  setTimeout(() => generate().catch(() => {}), 20e3);  // первый прогон через 20с после старта
  setTimeout(() => resolve().catch(() => {}), 40e3);
  setInterval(() => generate().catch(() => {}), GEN_MS);
  setInterval(() => resolve().catch(() => {}), RES_MS);
  console.log(`Signal scheduler: gen every ${GEN_MS/60e3}m, resolve every ${RES_MS/60e3}m, min winrate ${MIN_WINRATE}%`);
}

module.exports = { start, generate, resolve };
