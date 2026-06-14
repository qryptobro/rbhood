const https = require("https");

const AV_KEY = process.env.ALPHA_VANTAGE_KEY;

// ─── HTTP helper ──────────────────────────────────────────────────────────────
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", chunk => (data += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error("JSON parse error")); }
      });
    }).on("error", reject);
  });
}

// ─── Binance (крипто) ─────────────────────────────────────────────────────────
async function getBinanceCandles(symbol) {
  // symbol: BTCUSDT, ETHUSDT, etc.
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=200`;
  const data = await fetchJson(url);
  return data.map(k => ({
    time:   k[0],
    open:   parseFloat(k[1]),
    high:   parseFloat(k[2]),
    low:    parseFloat(k[3]),
    close:  parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

// ─── Alpha Vantage (форекс + металлы) — FX_DAILY (бесплатно) ────────────────
async function getForexCandles(symbol) {
  const from = symbol.slice(0, 3); // EUR, GBP, XAU, XAG...
  const to   = symbol.slice(3, 6); // USD, JPY...
  const url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${from}&to_symbol=${to}&outputsize=full&apikey=${AV_KEY}`;
  const data = await fetchJson(url);
  const series = data["Time Series FX (Daily)"];
  if (!series) throw new Error(`Alpha Vantage forex error: ${JSON.stringify(data).slice(0, 200)}`);

  return Object.entries(series)
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .slice(-200)
    .map(([time, v]) => ({
      time:   new Date(time).getTime(),
      open:   parseFloat(v["1. open"]),
      high:   parseFloat(v["2. high"]),
      low:    parseFloat(v["3. low"]),
      close:  parseFloat(v["4. close"]),
      volume: 0,
    }));
}

// ─── Alpha Vantage (акции) — TIME_SERIES_DAILY (бесплатно) ───────────────────
async function getStockCandles(symbol) {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full&apikey=${AV_KEY}`;
  const data = await fetchJson(url);
  const series = data["Time Series (Daily)"];
  if (!series) throw new Error(`Alpha Vantage stocks error: ${JSON.stringify(data).slice(0, 200)}`);

  return Object.entries(series)
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .slice(-200)
    .map(([time, v]) => ({
      time:   new Date(time).getTime(),
      open:   parseFloat(v["1. open"]),
      high:   parseFloat(v["2. high"]),
      low:    parseFloat(v["3. low"]),
      close:  parseFloat(v["4. close"]),
      volume: parseFloat(v["5. volume"]),
    }));
}

// Металлы (XAUUSD, XAGUSD) используют тот же FX_DAILY
const getCommodityCandles = getForexCandles;

// ─── Router ───────────────────────────────────────────────────────────────────
async function getMarketData(symbol, category) {
  if (category === "crypto") {
    return getBinanceCandles(symbol); // symbol уже BTCUSDT
  }
  if (category === "forex") {
    const commodities = ["XAUUSD", "XAGUSD"];
    if (commodities.includes(symbol)) return getCommodityCandles(symbol);
    return getForexCandles(symbol);
  }
  if (category === "stocks") {
    return getStockCandles(symbol);
  }
  throw new Error("Unknown category: " + category);
}

// ─── Indicators ───────────────────────────────────────────────────────────────
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
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
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

function calcVolumes(candles) {
  const now = candles[candles.length - 1];
  const h24 = candles.slice(-24);
  const d7  = candles.slice(-168);
  const d30 = candles.slice(-720);

  const sum = arr => arr.reduce((a, c) => a + c.volume * c.close, 0);

  return {
    vol24h: sum(h24),
    vol7d:  sum(d7),
    vol1m:  sum(d30),
  };
}

module.exports = { getMarketData, calcRSI, calcATR, calcVolumes };
