// strategy.js — движок отложенных ордеров (BUY LIMIT / SELL LIMIT) из свечей MT5.
// Логика адаптивная по режиму рынка (тренд / флэт), всё считается из OHLCV.
// Плюс честный мини-бэктест: прогоняет это же правило по истории и считает винрейт.

const { EMA, ATR, ADX, BollingerBands, RSI } = require("technicalindicators");

// окно актуальности сигнала + горизонты бэктеста по таймфрейму.
// fillBars — сколько баров ждём активации лимита (≈ validity), holdBars — держим после входа.
const TF_CFG = {
  "5m":  { validityHours: 6,  fillBars: 72, holdBars: 96 },
  "15m": { validityHours: 18, fillBars: 72, holdBars: 96 },
  "4h":  { validityHours: 72, fillBars: 18, holdBars: 30 },
};

// Трение на сделку: спред + проскальзывание, ~10% одного ATR на круг.
// На винрейт не влияет, но честно снижает матожидание (средний R).
const SPREAD_FRAC = 0.10;

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

// Симуляция одного ордера. Возвращает { res, exit }:
//  res = "win" | "loss" | "nofill" (лимит не активировался) | "open" (не разрешился в окне)
//  exit = индекс свечи, на которой всё закончилось (для перехода к следующей сделке без перекрытия)
function simulate(candles, order, i, fillBars, holdBars) {
  const N = candles.length;
  const buy = order.type === "BUY_LIMIT";
  const hitSL = (c) => buy ? c.low <= order.stopLoss : c.high >= order.stopLoss;
  const hitTP = (c) => buy ? c.high >= order.takeProfit : c.low <= order.takeProfit;

  // ── фаза 1: ждём активацию лимита (не дольше fillBars) ──
  const fillEnd = Math.min(N - 1, i + fillBars);
  let filledAt = -1;
  for (let j = i + 1; j <= fillEnd; j++) {
    const c = candles[j];
    const hit = buy ? c.low <= order.entry : c.high >= order.entry;
    if (!hit) continue;
    filledAt = j;
    if (hitSL(c)) return { res: "loss", exit: j }; // на свече входа — только SL (продолжение движения)
    break;
  }
  if (filledAt < 0) return { res: "nofill", exit: fillEnd };

  // ── фаза 2: держим до TP/SL (не дольше holdBars) ──
  const holdEnd = Math.min(N - 1, filledAt + holdBars);
  for (let k = filledAt + 1; k <= holdEnd; k++) {
    const c = candles[k];
    if (hitSL(c)) return { res: "loss", exit: k }; // при неоднозначности — SL раньше TP (консервативно)
    if (hitTP(c)) return { res: "win", exit: k };
  }
  return { res: "open", exit: holdEnd };
}

// Честный бэктест: НЕ перекрывающиеся сделки (одна позиция за раз, как на реальном депозите).
// Считаем винрейт по решённым сделкам + матожидание в R после издержек.
function backtest(candles, S, cfg) {
  let wins = 0, losses = 0, sumR = 0;
  let i = 60; // прогрев индикаторов
  while (i < candles.length - 1) {
    const o = buildOrderAt(candles, S, i);
    if (!o) { i++; continue; }
    const sim = simulate(candles, o, i, cfg.fillBars, cfg.holdBars);
    if (sim.res === "nofill") { i = Math.max(i + 1, sim.exit); continue; } // не вошли — ищем дальше
    if (sim.res === "open")   { i = sim.exit + 1; continue; }              // не разрешилось — не считаем
    // решённая независимая сделка
    const risk = Math.abs(o.entry - o.stopLoss) || 1e-9;
    const rr = Math.abs(o.takeProfit - o.entry) / risk;
    const costR = (SPREAD_FRAC * o.atr) / risk; // издержки в долях R
    if (sim.res === "win") { wins++;  sumR += rr - costR; }
    else                   { losses++; sumR += -1 - costR; }
    i = sim.exit + 1; // СЛЕДУЮЩУЮ сделку ищем только после закрытия текущей — без перекрытия
  }
  const trades = wins + losses;
  const winrate = trades ? Math.round((wins / trades) * 100) : null;
  const expectancy = trades ? +(sumR / trades).toFixed(2) : null; // средний результат сделки в R (после издержек)
  return { winrate, trades, expectancy };
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
  const cfg = TF_CFG[tf] || { validityHours: 12, fillBars: 60, holdBars: 80 };
  const S = buildSeries(candles);
  const o = buildOrderAt(candles, S, candles.length - 1);
  const bt = backtest(candles, S, cfg);

  if (!o) {
    return { action: "WAIT", entry: null, stopLoss: null, takeProfit: null, rr: null, validityHours: cfg.validityHours, winrate: bt.winrate, trades: bt.trades, expectancy: bt.expectancy, reason: "Нет чёткого сетапа" };
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
    winrate: bt.winrate,            // винрейт по независимым сделкам
    trades: bt.trades,              // число независимых сделок в выборке
    expectancy: bt.expectancy,      // средний результат сделки в R после издержек
    reason: REGIME_RU[o.regime] || "",
  };
}

module.exports = { buildPendingOrder };
