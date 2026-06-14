// indicators.js
// Расчёт технических индикаторов из реальных OHLCV-свечей.
// Библиотека technicalindicators даёт каноничные значения, далее — детерминированная интерпретация.
// Идея: считаем числа в коде, Claude их только ИНТЕРПРЕТИРУЕТ (не выдумывает).

const {
  RSI, MACD, BollingerBands, EMA, SMA, ATR, Stochastic, ADX,
} = require("technicalindicators");

function round(n, decimals = 6) {
  if (n == null || Number.isNaN(n)) return null;
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

/**
 * @param {Array<{time,open,high,low,close,volume}>} candles
 * @returns полный набор индикаторов + интерпретация + ATR-уровни
 */
function computeIndicators(candles) {
  if (!Array.isArray(candles) || candles.length < 50) {
    throw new Error(`Нужно минимум 50 свечей, получено ${candles?.length ?? 0}`);
  }

  const closes = candles.map(c => c.close);
  const highs  = candles.map(c => c.high);
  const lows   = candles.map(c => c.low);
  const vols   = candles.map(c => c.volume ?? 0);
  const lastClose = closes[closes.length - 1];
  const prevClose = closes[closes.length - 2];

  // RSI(14)
  const rsiSeries = RSI.calculate({ period: 14, values: closes });
  const rsi = rsiSeries[rsiSeries.length - 1];

  // MACD(12,26,9)
  const macdSeries = MACD.calculate({
    values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9,
    SimpleMAOscillator: false, SimpleMASignal: false,
  });
  const macd = macdSeries[macdSeries.length - 1] || {};
  const macdPrev = macdSeries[macdSeries.length - 2] || {};

  // Bollinger Bands(20,2)
  const bbSeries = BollingerBands.calculate({ period: 20, values: closes, stdDev: 2 });
  const bb = bbSeries[bbSeries.length - 1] || {};

  // EMA 20/50/200
  const ema20 = last(EMA.calculate({ period: 20, values: closes }));
  const ema50 = last(EMA.calculate({ period: 50, values: closes }));
  const ema200 = closes.length >= 200 ? last(EMA.calculate({ period: 200, values: closes })) : null;

  // ATR(14)
  const atr = last(ATR.calculate({ high: highs, low: lows, close: closes, period: 14 }));

  // Stochastic(14,3)
  const stoch = last(Stochastic.calculate({ high: highs, low: lows, close: closes, period: 14, signalPeriod: 3 })) || {};

  // ADX(14)
  const adx = last(ADX.calculate({ high: highs, low: lows, close: closes, period: 14 })) || {};

  // Поддержка/сопротивление по последним 60 свечам
  const lookback = Math.min(60, candles.length);
  const recent = candles.slice(-lookback);
  const resistance = Math.max(...recent.map(c => c.high));
  const support = Math.min(...recent.map(c => c.low));

  // Объём: текущий vs средний за 20
  const volAvg = last(SMA.calculate({ period: 20, values: vols })) || 0;
  const lastVol = vols[vols.length - 1] || 0;
  const volRatio = volAvg > 0 ? lastVol / volAvg : 0;

  const pctChange = prevClose ? ((lastClose - prevClose) / prevClose) * 100 : 0;

  // ─── Детерминированные интерпретации ───────────────────────────────────────
  const rsiSignal = rsi == null ? "n/a" : rsi >= 70 ? "перекуплен" : rsi <= 30 ? "перепродан" : "нейтрально";

  const macdSignal = macd.MACD == null ? "n/a"
    : macd.MACD > macd.signal && macdPrev.MACD <= macdPrev.signal ? "бычье пересечение (свежее)"
    : macd.MACD < macd.signal && macdPrev.MACD >= macdPrev.signal ? "медвежье пересечение (свежее)"
    : macd.MACD > macd.signal ? "бычий" : "медвежий";

  const bbPosition = bb.upper == null ? "n/a"
    : lastClose >= bb.upper ? "у верхней полосы / выше"
    : lastClose <= bb.lower ? "у нижней полосы / ниже"
    : lastClose > bb.middle ? "между средней и верхней" : "между средней и нижней";

  let trendByEma = "не определён";
  if (ema20 && ema50) {
    if (lastClose > ema20 && ema20 > ema50) trendByEma = "восходящий (цена>EMA20>EMA50)";
    else if (lastClose < ema20 && ema20 < ema50) trendByEma = "нисходящий (цена<EMA20<EMA50)";
    else trendByEma = "боковой / смешанный";
  }

  const adxStrength = adx.adx == null ? "n/a"
    : adx.adx < 20 ? "слабый тренд / флэт"
    : adx.adx < 25 ? "зарождающийся тренд"
    : adx.adx < 50 ? "чёткий тренд" : "очень сильный тренд";

  const stochSignal = stoch.k == null ? "n/a"
    : stoch.k >= 80 ? "перекуплен" : stoch.k <= 20 ? "перепродан" : "нейтрально";

  const volumeSignal = volRatio === 0 ? "n/a"
    : volRatio >= 1.5 ? "высокий объём (>1.5x)" : volRatio <= 0.5 ? "низкий объём (<0.5x)" : "обычный объём";

  // ─── Подсчёт согласия индикаторов (для честной уверенности) ─────────────────
  let bull = 0, bear = 0;
  if (rsi != null) { if (rsi < 45) bull++; else if (rsi > 55) bear++; }
  if (macd.MACD != null) { if (macd.MACD > macd.signal) bull++; else bear++; }
  if (ema20 && ema50) { if (trendByEma.startsWith("восходящий")) bull++; else if (trendByEma.startsWith("нисходящий")) bear++; }
  if (stoch.k != null) { if (stoch.k < 20) bull++; else if (stoch.k > 80) bear++; }
  if (bb.middle != null) { if (lastClose > bb.middle) bull++; else bear++; }
  const total = bull + bear;
  const bias = bull > bear ? "BUY" : bear > bull ? "SELL" : "WAIT";
  const agreement = total ? Math.round((Math.max(bull, bear) / total) * 100) : 50;

  return {
    last_close: round(lastClose),
    pct_change_last_candle: round(pctChange, 2),
    indicators: {
      rsi_14: round(rsi, 2),
      rsi_signal: rsiSignal,
      macd: { macd: round(macd.MACD), signal: round(macd.signal), histogram: round(macd.histogram), interpretation: macdSignal },
      bollinger: { upper: round(bb.upper), middle: round(bb.middle), lower: round(bb.lower), position: bbPosition },
      ema_20: round(ema20), ema_50: round(ema50), ema_200: round(ema200),
      trend_by_ema: trendByEma,
      atr_14: round(atr),
      stochastic: { k: round(stoch.k, 2), d: round(stoch.d, 2), interpretation: stochSignal },
      adx_14: round(adx.adx, 2), adx_strength: adxStrength,
      volume_ratio_vs_20avg: round(volRatio, 2), volume_signal: volumeSignal,
    },
    consensus: { bull, bear, bias, agreement_pct: agreement },
    levels: {
      support_60: round(support),
      resistance_60: round(resistance),
      // ATR-управление риском 1:2
      stop_loss_long:  round(lastClose - 1.5 * atr),
      take_profit_long: round(lastClose + 3 * atr),
      stop_loss_short: round(lastClose + 1.5 * atr),
      take_profit_short: round(lastClose - 3 * atr),
      entry_min: round(lastClose - 0.3 * atr),
      entry_max: round(lastClose + 0.3 * atr),
      risk_reward: "1:2 (1.5xATR риск / 3xATR цель)",
    },
  };
}

function last(arr) { return arr && arr.length ? arr[arr.length - 1] : null; }

module.exports = { computeIndicators };
