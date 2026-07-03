// ─── Бесплатные источники котировок ───────────────────────────────────────────
//   крипта (…USDT) → Binance;  форекс/металлы/акции → Yahoo Finance.
//   MT5-мост используется ТОЛЬКО как резерв, если задан MT5_BRIDGE_URL.
const BRIDGE_URL = process.env.MT5_BRIDGE_URL || ""; // пусто = MT5 не используется

const isCrypto = (s) => /USDT$/i.test(s);

// Металлы Yahoo отдаёт как фьючерсы; форекс — как PAIR=X; акции — тикер как есть.
const METAL_MAP = { XAUUSD: "GC=F", XAGUSD: "SI=F", XPTUSD: "PL=F", XPDUSD: "PA=F" };
function yahooSymbol(sym) {
  if (METAL_MAP[sym]) return METAL_MAP[sym];
  if (/^[A-Z]{6}$/.test(sym)) return `${sym}=X`; // форекс-пара
  return sym;                                     // акция
}

const BINANCE_TF = { "1m": "1m", "5m": "5m", "15m": "15m", "1h": "1h", "4h": "4h", "1d": "1d", "1w": "1w" };
const YAHOO_TF   = { "1m": "1m", "5m": "5m", "15m": "15m", "1h": "60m", "1d": "1d", "1w": "1wk" }; // без нативного 4h
const yahooRange = (int) =>
  int === "5m" ? "5d" : int === "15m" ? "1mo" : int === "60m" ? "6mo" : int === "1d" ? "2y" : int === "1wk" ? "5y" : "1mo";

// Кэш (TTL 60с), чтобы не бить внешние API на каждый повтор
const _cache = new Map();
const CACHE_TTL = 60e3;

async function fromBinance(symbol, tf, n) {
  const int = BINANCE_TF[tf] || "15m";
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${int}&limit=${Math.min(1000, Math.max(1, n))}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Binance ${r.status} (${symbol})`);
  return (await r.json()).map(k => ({ time: k[0], open: +k[1], high: +k[2], low: +k[3], close: +k[4], volume: +k[5] }));
}

// Свести N свечей в одну (для 4h из 60m у Yahoo)
function aggregate(candles, group) {
  const out = [];
  for (let i = 0; i < candles.length; i += group) {
    const s = candles.slice(i, i + group);
    if (!s.length) continue;
    out.push({
      time: s[0].time, open: s[0].open,
      high: Math.max(...s.map(c => c.high)), low: Math.min(...s.map(c => c.low)),
      close: s[s.length - 1].close, volume: s.reduce((a, c) => a + (c.volume || 0), 0),
    });
  }
  return out;
}

async function fromYahoo(symbol, tf, n) {
  const agg4h = tf === "4h";
  const interval = agg4h ? "60m" : (YAHOO_TF[tf] || "1d");
  const ys = yahooSymbol(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ys)}?interval=${interval}&range=${yahooRange(interval)}`;
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error(`Yahoo ${r.status} (${ys})`);
  const res = (await r.json())?.chart?.result?.[0];
  if (!res || !res.timestamp) throw new Error(`Yahoo no data (${ys})`);
  const q = res.indicators.quote[0];
  let candles = res.timestamp.map((t, i) => ({
    time: t * 1000, open: q.open[i], high: q.high[i], low: q.low[i], close: q.close[i], volume: q.volume[i] || 0,
  })).filter(c => c.open != null && c.high != null && c.low != null && c.close != null);
  if (agg4h) candles = aggregate(candles, 4);
  return candles.slice(-n);
}

async function fromBridge(symbol, tf, n) {
  const r = await fetch(`${BRIDGE_URL}/candles?symbol=${encodeURIComponent(symbol)}&tf=${tf}&n=${n}`);
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(`MT5 ${r.status}: ${e.error || "no data"}`); }
  return (await r.json()).candles || [];
}

// ─── Получаем свечи нужного таймфрейма ───────────────────────────────────────
// tf: "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w"
async function getCandles(symbol, tf = "1d", n = 300) {
  const key = `${symbol}|${tf}|${n}`;
  const hit = _cache.get(key);
  if (hit && Date.now() - hit.t < CACHE_TTL) return hit.d;

  let data;
  try {
    data = isCrypto(symbol) ? await fromBinance(symbol, tf, n) : await fromYahoo(symbol, tf, n);
  } catch (e) {
    if (BRIDGE_URL) data = await fromBridge(symbol, tf, n); // резерв MT5, если настроен
    else throw e;
  }
  _cache.set(key, { t: Date.now(), d: data });
  if (_cache.size > 500) _cache.clear();
  return data;
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
