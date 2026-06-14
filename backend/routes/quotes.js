const router = require("express").Router();
const { getCandles } = require("../services/marketData");

// Кэш котировок на 60 секунд — чтобы не дёргать мост на каждый рендер
const cache = new Map();
const TTL = 60 * 1000;

async function getQuote(symbol) {
  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;

  const candles = await getCandles(symbol, "1d", 3);
  if (!candles || candles.length < 2) throw new Error("no data");
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const change = prev.close ? ((last.close - prev.close) / prev.close) * 100 : 0;
  const data = { price: last.close, change: +change.toFixed(2), up: change >= 0 };
  cache.set(symbol, { data, ts: Date.now() });
  return data;
}

// POST /api/quotes  body: { symbols: ["EURUSD", "BTCUSDT", ...] }
router.post("/", async (req, res) => {
  const symbols = Array.isArray(req.body?.symbols) ? req.body.symbols : [];
  if (!symbols.length) return res.status(400).json({ error: "symbols[] required" });

  const quotes = {};
  await Promise.all(symbols.map(async (sym) => {
    try {
      quotes[sym] = await getQuote(sym);
    } catch (e) {
      quotes[sym] = null; // символ недоступен — фронт покажет прочерк
    }
  }));

  res.json({ quotes });
});

module.exports = router;
