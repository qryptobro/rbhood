// strategy.js — движок отложенных ордеров (BUY LIMIT / SELL LIMIT) из свечей MT5.
// Логика адаптивная по режиму рынка (тренд / флэт), всё считается из OHLCV.
// Плюс честный мини-бэктест: прогоняет это же правило по истории и считает винрейт.

const { EMA, ATR, ADX, BollingerBands, RSI } = require("technicalindicators");

// окно актуальности сигнала и горизонт бэктеста по таймфрейму
const TF_CFG = {
  "5m":  { validityHours: 6,  fwd: 60 },   // ~5 часов вперёд на проверку
  "15m": { validityHours: 18, fwd: 60 },
  "4h":  { validityHours: 72, fwd: 40 },
};

const round = (n, d = 6) => (n == null || Number.isNaN(n) ? null : Math.round(n * 10 ** d) / 10 ** d);
const padFront = (arr, len) => Array(Math.max(0, len - arr.length)).fill(null).concat(arr);

function buildSeries(candles) {
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const N = candles.length;
  return {
    closes, highs, lows, N,
    ema20: padFront(EMA.calculate({ period: 20, values: closes }), N),
    ema50: padFront(EMA.calculate({ period: 50, values: closes }), N),
    ema200: N >= 200 ? padFront(EMA.calculate({ period: 200, values: closes }), N) : Array(N).fill(null),
    atr: padFront(ATR.calculate({ high: highs, low: lows, close: closes, period: 14 }), N),
    adx: padFront(ADX.calculate({ high: highs, low: lows, close: closes, period: 14 }), N).map(x => (x ? x.adx : null)),
    bb: padFront(BollingerBands.calculate({ period: 20, values: closes, stdDev: 2 }), N),
    rsi: padFront(RSI.calculate({ period: 14, values: closes }), N),
  };
}

// Поддержка/сопротивление по последним 60 барам до индекса i (включительно)
function levels(candles, i, look = 60) {
  const from = Math.max(0, i - look + 1);
  let hi = -Infinity, lo = Infinity;
  for (let k = from; k <= i; k++) { if (candles[k].high > hi) hi = candles[k].high; if (candles[k].low < lo) lo = candles[k].low; }
  return { support: lo, resistance: hi };
}

// Построить отложенный ордер на индексе i (причинно: используются данные до i включительно)
function buildOrderAt(candles, S, i) {
  const price = S.closes[i];
  const ema20 = S.ema20[i], ema50 = S.ema50[i], ema200 = S.ema200[i];
  const atr = S.atr[i], adx = S.adx[i], rsi = S.rsi[i], bb = S.bb[i];
  if (price == null || atr == null || ema50 == null || bb == null) return null;

  const { support, resistance } = levels(candles, i);
  const trending = adx != null && adx >= 20;
  const up = price > ema50 && (ema200 == null || ema50 > ema200);
  const down = price < ema50 && (ema200 == null || ema50 < ema200);

  let type = null, entry = null, regime = "range";

  if (trending && up) {
    regime = "trend_up";
    // BUY LIMIT на откате (ema20/поддержка ниже цены)
    const cand = [ema20, support].filter(v => v != null && v < price);
    entry = cand.length ? Math.max(...cand) : price - 0.6 * atr;
    if (entry >= price) entry = price - 0.5 * atr;
    type = "BUY_LIMIT";
  } else if (trending && down) {
    regime = "trend_down";
    const cand = [ema20, resistance].filter(v => v != null && v > price);
    entry = cand.length ? Math.min(...cand) : price + 0.6 * atr;
    if (entry <= price) entry = price + 0.5 * atr;
    type = "SELL_LIMIT";
  } else {
    // флэт: возврат к среднему от края канала
    if (price <= bb.middle) {
      regime = "range";
      entry = Math.min(bb.lower, support);
      if (entry >= price) entry = price - 0.5 * atr;
      type = "BUY_LIMIT";
    } else {
      regime = "range";
      entry = Math.max(bb.upper, resistance);
      if (entry <= price) entry = price + 0.5 * atr;
      type = "SELL_LIMIT";
    }
  }

  const slDist = 1.3 * atr;
  const tpDist = 2.6 * atr; // RR ~1:2
  let stopLoss, takeProfit;
  if (type === "BUY_LIMIT") { stopLoss = entry - slDist; takeProfit = entry + tpDist; }
  else { stopLoss = entry + slDist; takeProfit = entry - tpDist; }

  return { type, regime, entry, stopLoss, takeProfit, atr, rsi, adx, support, resistance, price };
}

// Симуляция одного ордера вперёд: заполнился ли лимит и что сработало раньше — TP или SL
function simulate(candles, order, i, fwd) {
  const end = Math.min(candles.length - 1, i + fwd);
  let filled = false;
  for (let j = i + 1; j <= end; j++) {
    const c = candles[j];
    if (!filled) {
      if (order.type === "BUY_LIMIT" && c.low <= order.entry) filled = true;
      else if (order.type === "SELL_LIMIT" && c.high >= order.entry) filled = true;
      if (!filled) continue;
    }
    // после заполнения проверяем TP/SL
    if (order.type === "BUY_LIMIT") {
      if (c.low <= order.stopLoss) return "loss";
      if (c.high >= order.takeProfit) return "win";
    } else {
      if (c.high >= order.stopLoss) return "loss";
      if (c.low <= order.takeProfit) return "win";
    }
  }
  return null; // не заполнился или не разрешился в окне — не учитываем
}

// Мини-бэктест: прогон правила по истории, винрейт
function backtest(candles, S, fwd) {
  let wins = 0, losses = 0;
  const start = 60; // прогрев индикаторов
  for (let i = start; i < candles.length - 1; i++) {
    const o = buildOrderAt(candles, S, i);
    if (!o) continue;
    const r = simulate(candles, o, i, fwd);
    if (r === "win") wins++;
    else if (r === "loss") losses++;
  }
  const trades = wins + losses;
  const winrate = trades ? Math.round((wins / trades) * 100) : null;
  return { winrate, trades };
}

const REGIME_RU = {
  trend_up: "восходящий тренд — ждём откат для покупки",
  trend_down: "нисходящий тренд — ждём откат для продажи",
  range: "флэт — отбой от границы диапазона",
};

/**
 * Главная функция: строит отложенный ордер по последнему бару + бэктест винрейта.
 * @param {Array<{time,open,high,low,close,volume}>} candles
 * @param {string} tf "5m" | "15m" | "4h"
 */
function buildPendingOrder(candles, tf) {
  if (!Array.isArray(candles) || candles.length < 60) {
    return { action: "WAIT", entry: null, stopLoss: null, takeProfit: null, rr: null, validityHours: null, winrate: null, trades: 0, reason: "Недостаточно данных" };
  }
  const cfg = TF_CFG[tf] || { validityHours: 12, fwd: 50 };
  const S = buildSeries(candles);
  const o = buildOrderAt(candles, S, candles.length - 1);
  const bt = backtest(candles, S, cfg.fwd);

  if (!o) {
    return { action: "WAIT", entry: null, stopLoss: null, takeProfit: null, rr: null, validityHours: cfg.validityHours, winrate: bt.winrate, trades: bt.trades, reason: "Нет чёткого сетапа" };
  }

  const risk = Math.abs(o.entry - o.stopLoss);
  const reward = Math.abs(o.takeProfit - o.entry);
  const rr = risk ? +(reward / risk).toFixed(1) : null;

  return {
    action: o.type,                 // BUY_LIMIT | SELL_LIMIT
    regime: o.regime,
    entry: round(o.entry),
    stopLoss: round(o.stopLoss),
    takeProfit: round(o.takeProfit),
    rr,
    validityHours: cfg.validityHours,
    winrate: bt.winrate,            // исторический винрейт правила
    trades: bt.trades,              // размер выборки бэктеста
    reason: REGIME_RU[o.regime] || "",
  };
}

module.exports = { buildPendingOrder };
