// ─── Источник данных: MT5 мост (FxPro) ───────────────────────────────────────
// Python-сервис mt5-bridge/server.py отдаёт OHLCV из терминала FxPro MT5.
const BRIDGE_URL = process.env.MT5_BRIDGE_URL || "http://127.0.0.1:5001";

// ─── Получаем свечи нужного таймфрейма ───────────────────────────────────────
// tf: "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w"
async function getCandles(symbol, tf = "1d", n = 300) {
  const url = `${BRIDGE_URL}/candles?symbol=${encodeURIComponent(symbol)}&tf=${tf}&n=${n}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`MT5 bridge ${res.status}: ${err.error || "no data"} (${symbol})`);
  }
  const data = await res.json();
  return data.candles || [];
}

// Совместимость со старым API: дневные свечи
async function getMarketData(symbol, tf = "1d") {
  return getCandles(symbol, tf, 300);
}

// ─── Текущая цена + изменение из свечей ───────────────────────────────────────
async function getQuote(symbol) {
  const candles = await getCandles(symbol, "1d", 30);
  const last = candles[candles.length - 1] || {};
  const prev = candles[candles.length - 2] || {};
  const change = prev.close ? ((last.close - prev.close) / prev.close) * 100 : 0;
  return {
    currentPrice:   last.close,
    priceChange24h: change,
    vol24h:         (last.volume || 0) * (last.close || 0),
    marketCap:      0,
    high52w:        Math.max(...candles.map(c => c.high)),
    low52w:         Math.min(...candles.map(c => c.low)),
  };
}

// ─── Индикаторы ───────────────────────────────────────────────────────────────
function calcRSI(candles, period = 14) {
  const closes = candles.map(c => c.close);
  if (closes.length < period + 1) return 50;

  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function calcATR(candles, period = 14) {
  if (candles.length < period + 1) return 0;
  const trs = candles.slice(1).map((c, i) => {
    const prev = candles[i].close;
    return Math.max(c.high - c.low, Math.abs(c.high - prev), Math.abs(c.low - prev));
  });
  const recent = trs.slice(-period);
  return recent.reduce((a, b) => a + b, 0) / period;
}

function calcVolumes(candles, currentPrice) {
  // Daily свечи: 1 день = 1 свеча
  const d1  = candles.slice(-1);
  const d7  = candles.slice(-7);
  const d30 = candles.slice(-30);

  const sum = arr => arr.reduce((a, c) => a + (c.volume * c.close || 0), 0);

  return {
    vol24h: sum(d1),
    vol7d:  sum(d7),
    vol1m:  sum(d30),
  };
}

module.exports = { getMarketData, getCandles, getQuote, calcRSI, calcATR, calcVolumes };
