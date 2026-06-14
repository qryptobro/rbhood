const https = require("https");

const CHART_IMG_KEY = process.env.CHART_IMG_KEY;

const TV_SYMBOL_MAP = {
  XAUUSD: "TVC:GOLD",   XAGUSD: "TVC:SILVER",
  EURUSD: "FX:EURUSD",  GBPUSD: "FX:GBPUSD",
  USDJPY: "FX:USDJPY",  AUDUSD: "FX:AUDUSD",
  USDCHF: "FX:USDCHF",  NZDUSD: "FX:NZDUSD",
  USDCAD: "FX:USDCAD",  AUDJPY: "FX:AUDJPY",
  BTCUSDT:  "BINANCE:BTCUSDT",  ETHUSDT:  "BINANCE:ETHUSDT",
  BNBUSDT:  "BINANCE:BNBUSDT",  SOLUSDT:  "BINANCE:SOLUSDT",
  XRPUSDT:  "BINANCE:XRPUSDT",  ADAUSDT:  "BINANCE:ADAUSDT",
  DOGEUSDT: "BINANCE:DOGEUSDT", AVAXUSDT: "BINANCE:AVAXUSDT",
  DOTUSDT:  "BINANCE:DOTUSDT",  LINKUSDT: "BINANCE:LINKUSDT",
  AAPL: "NASDAQ:AAPL", TSLA: "NASDAQ:TSLA", NVDA: "NASDAQ:NVDA",
  MSFT: "NASDAQ:MSFT", AMZN: "NASDAQ:AMZN", GOOGL: "NASDAQ:GOOGL",
  META: "NASDAQ:META", AMD:  "NASDAQ:AMD",  NFLX: "NASDAQ:NFLX",
  COIN: "NASDAQ:COIN",
};

function getChartBase64(symbol, interval = "1D") {
  return new Promise((resolve, reject) => {
    const tvSymbol = TV_SYMBOL_MAP[symbol] || symbol;
    const params = new URLSearchParams({
      key:      CHART_IMG_KEY,
      symbol:   tvSymbol,
      interval: interval,
      theme:    "dark",
      width:    "800",
      height:   "500",
      studies:  JSON.stringify(["RSI@tv-basicstudies", "MACD@tv-basicstudies", "BB@tv-basicstudies"]),
    });

    const url = `https://api.chart-img.com/v1/tradingview/advanced-chart?${params}`;

    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        let err = "";
        res.on("data", d => (err += d));
        res.on("end", () => reject(new Error(`Chart IMG ${res.statusCode}: ${err}`)));
        return;
      }
      const chunks = [];
      res.on("data", chunk => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
    }).on("error", reject);
  });
}

module.exports = { getChartBase64 };
