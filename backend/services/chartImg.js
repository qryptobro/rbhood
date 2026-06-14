const https = require("https");

const CHART_IMG_KEY = process.env.CHART_IMG_KEY;

// Кэш на 5 минут — экономим запросы
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}
function cacheSet(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

const TV_SYMBOL_MAP = {
  XAUUSD: "FXPRO:XAUUSD", XAGUSD: "FXPRO:XAGUSD",
  EURUSD: "FXPRO:EURUSD", GBPUSD: "FXPRO:GBPUSD",
  USDJPY: "FXPRO:USDJPY", AUDUSD: "FXPRO:AUDUSD",
  USDCHF: "FXPRO:USDCHF", NZDUSD: "FXPRO:NZDUSD",
  USDCAD: "FXPRO:USDCAD", AUDJPY: "FXPRO:AUDJPY",
  BTCUSDT:  "FXPRO:BTCUSD",  ETHUSDT:  "FXPRO:ETHUSD",
  BNBUSDT:  "FXPRO:BNBUSD",  SOLUSDT:  "FXPRO:SOLUSD",
  XRPUSDT:  "FXPRO:XRPUSD",  ADAUSDT:  "FXPRO:ADAUSD",
  DOGEUSDT: "FXPRO:DOGEUSD", AVAXUSDT: "FXPRO:AVAXUSD",
  DOTUSDT:  "FXPRO:DOTUSD",  LINKUSDT: "FXPRO:LINKUSD",
  AAPL: "NASDAQ:AAPL", TSLA: "NASDAQ:TSLA", NVDA: "NASDAQ:NVDA",
  MSFT: "NASDAQ:MSFT", AMZN: "NASDAQ:AMZN", GOOGL: "NASDAQ:GOOGL",
  META: "NASDAQ:META", AMD:  "NASDAQ:AMD",  NFLX: "NASDAQ:NFLX",
  COIN: "NASDAQ:COIN",
};

const STUDIES = [
  { name: "Relative Strength Index", input: { length: 14 } },
  { name: "MACD" },
  { name: "Bollinger Bands" },
];

function getChartBase64(symbol, interval = "1D") {
  const cacheKey = `${symbol}:${interval}`;
  const cached = cacheGet(cacheKey);
  if (cached) { console.log(`Chart IMG cache hit: ${cacheKey}`); return Promise.resolve(cached); }

  return new Promise((resolve, reject) => {
    const tvSymbol = TV_SYMBOL_MAP[symbol] || symbol;
    const body = JSON.stringify({
      symbol:   tvSymbol,
      interval: interval,
      theme:    "dark",
      width:    800,
      height:   500,
      studies:  STUDIES,
    });

    const req = https.request({
      hostname: "api.chart-img.com",
      path:     `/v2/tradingview/advanced-chart?key=${CHART_IMG_KEY}`,
      method:   "POST",
      headers: {
        "Content-Type":   "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    }, (res) => {
      if (res.statusCode !== 200) {
        let err = "";
        res.on("data", d => (err += d));
        res.on("end", () => reject(new Error(`Chart IMG ${res.statusCode}: ${err}`)));
        return;
      }
      const chunks = [];
      res.on("data", chunk => chunks.push(chunk));
      res.on("end", () => {
        const b64 = Buffer.concat(chunks).toString("base64");
        cacheSet(cacheKey, b64);
        resolve(b64);
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchWithRetry(symbol, interval, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await getChartBase64(symbol, interval);
    } catch (e) {
      if (e.message.includes("429") && i < retries) {
        console.log(`Chart IMG rate limit on ${interval}, retry in 3s...`);
        await sleep(3000);
      } else {
        console.warn(`Chart IMG ${interval} failed:`, e.message);
        return null;
      }
    }
  }
  return null;
}

async function getThreeCharts(symbol) {
  const scalper     = await fetchWithRetry(symbol, "1m");
  await sleep(2000);
  const dayTrader   = await fetchWithRetry(symbol, "5m");
  await sleep(2000);
  const swingTrader = await fetchWithRetry(symbol, "1h");
  return { scalper, dayTrader, swingTrader };
}

module.exports = { getChartBase64, getThreeCharts };
