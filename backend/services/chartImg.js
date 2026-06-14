const https = require("https");

const CHART_IMG_KEY = process.env.CHART_IMG_KEY;

// Маппинг наших символов в TradingView символы для Chart IMG
const TV_SYMBOL_MAP = {
  // Форекс + металлы
  XAUUSD: "TVC:GOLD",   XAGUSD: "TVC:SILVER",
  EURUSD: "FX:EURUSD",  GBPUSD: "FX:GBPUSD",
  USDJPY: "FX:USDJPY",  AUDUSD: "FX:AUDUSD",
  USDCHF: "FX:USDCHF",  NZDUSD: "FX:NZDUSD",
  USDCAD: "FX:USDCAD",  AUDJPY: "FX:AUDJPY",
  // Крипто
  BTCUSDT:  "BINANCE:BTCUSDT",  ETHUSDT:  "BINANCE:ETHUSDT",
  BNBUSDT:  "BINANCE:BNBUSDT",  SOLUSDT:  "BINANCE:SOLUSDT",
  XRPUSDT:  "BINANCE:XRPUSDT",  ADAUSDT:  "BINANCE:ADAUSDT",
  DOGEUSDT: "BINANCE:DOGEUSDT", AVAXUSDT: "BINANCE:AVAXUSDT",
  DOTUSDT:  "BINANCE:DOTUSDT",  LINKUSDT: "BINANCE:LINKUSDT",
  // Акции
  AAPL: "NASDAQ:AAPL", TSLA: "NASDAQ:TSLA", NVDA: "NASDAQ:NVDA",
  MSFT: "NASDAQ:MSFT", AMZN: "NASDAQ:AMZN", GOOGL: "NASDAQ:GOOGL",
  META: "NASDAQ:META", AMD:  "NASDAQ:AMD",  NFLX: "NASDAQ:NFLX",
  COIN: "NASDAQ:COIN",
};

function getTVSymbol(symbol) {
  return TV_SYMBOL_MAP[symbol] || symbol;
}

// Получаем chart как base64 для передачи в Claude Vision
function getChartBase64(symbol, interval = "D") {
  return new Promise((resolve, reject) => {
    const tvSymbol = getTVSymbol(symbol);

    // Строим URL с индикаторами: RSI + MACD + Volume
    const studies = encodeURIComponent(JSON.stringify([
      { name: "RSI", input: { length: 14 } },
      { name: "MACD" },
      { name: "BB" }, // Bollinger Bands
    ]));

    const params = new URLSearchParams({
      symbol:   tvSymbol,
      interval: interval,
      theme:    "dark",
      width:    "800",
      height:   "500",
      studies:  JSON.stringify([
        { name: "RSI@tv-basicstudies", input: { length: 14 } },
        { name: "MACD@tv-basicstudies" },
        { name: "BB@tv-basicstudies" },
      ]),
    });

    const url = `https://api.chart-img.com/v2/tradingview/advanced-chart?key=${CHART_IMG_KEY}&${params}`;

    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        let err = "";
        res.on("data", d => (err += d));
        res.on("end", () => reject(new Error(`Chart IMG error ${res.statusCode}: ${err}`)));
        return;
      }

      const chunks = [];
      res.on("data", chunk => chunks.push(chunk));
      res.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer.toString("base64"));
      });
    }).on("error", reject);
  });
}

module.exports = { getChartBase64, getTVSymbol };
