const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// ─── Маппинг символов в Yahoo Finance тикеры ─────────────────────────────────
const SYMBOL_MAP = {
  // Форекс + металлы
  XAUUSD: "GC=F",      // Gold Futures (точнее чем XAUUSD=X)
  XAGUSD: "SI=F",      // Silver Futures
  EURUSD: "EURUSD=X",
  GBPUSD: "GBPUSD=X",
  USDJPY: "JPY=X",
  AUDUSD: "AUDUSD=X",
  USDCHF: "CHF=X",
  NZDUSD: "NZDUSD=X",
  USDCAD: "CAD=X",
  AUDJPY: "AUDJPY=X",
  // Крипто
  BTCUSDT:  "BTC-USD",
  ETHUSDT:  "ETH-USD",
  BNBUSDT:  "BNB-USD",
  SOLUSDT:  "SOL-USD",
  XRPUSDT:  "XRP-USD",
  ADAUSDT:  "ADA-USD",
  DOGEUSDT: "DOGE-USD",
  AVAXUSDT: "AVAX-USD",
  DOTUSDT:  "DOT-USD",
  LINKUSDT: "LINK-USD",
  // Акции
  AAPL: "AAPL", TSLA: "TSLA", NVDA: "NVDA",
  MSFT: "MSFT", AMZN: "AMZN", GOOGL: "GOOGL",
  META: "META", AMD: "AMD",   NFLX: "NFLX", COIN: "COIN",
};

function getYahooSymbol(symbol) {
  return SYMBOL_MAP[symbol] || symbol;
}

// ─── Получаем исторические свечи (daily) ─────────────────────────────────────
async function getMarketData(symbol) {
  const ticker = getYahooSymbol(symbol);
  const endDate   = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 365); // год назад

  const result = await yahooFinance.chart(ticker, {
    period1: startDate,
    period2: endDate,
    interval: "1d",
  });

  const quotes = result.quotes || [];
  return quotes
    .filter(q => q.open && q.high && q.low && q.close)
    .map(q => ({
      time:   new Date(q.date).getTime(),
      open:   q.open,
      high:   q.high,
      low:    q.low,
      close:  q.close,
      volume: q.volume || 0,
    }));
}

// ─── Текущая цена + метаданные ────────────────────────────────────────────────
async function getQuote(symbol) {
  const ticker = getYahooSymbol(symbol);
  const quote  = await yahooFinance.quote(ticker);
  return {
    currentPrice:    quote.regularMarketPrice,
    priceChange24h:  quote.regularMarketChangePercent,
    vol24h:          (quote.regularMarketVolume || 0) * (quote.regularMarketPrice || 0),
    marketCap:       quote.marketCap || 0,
    high52w:         quote.fiftyTwoWeekHigh,
    low52w:          quote.fiftyTwoWeekLow,
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

module.exports = { getMarketData, getQuote, calcRSI, calcATR, calcVolumes, getYahooSymbol };
