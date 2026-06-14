const router = require("express").Router();
const { getMarketData, calcRSI, calcATR, calcVolumes } = require("../services/marketData");
const { getEconomicCalendar } = require("../services/calendar");
const { getNews } = require("../services/news");
const { generateAnalysis } = require("../services/aiAnalysis");

// POST /api/analysis
// body: { symbol: "XAUUSD", category: "forex" | "crypto" | "stocks" }
router.post("/", async (req, res) => {
  const { symbol, category } = req.body;
  if (!symbol || !category) {
    return res.status(400).json({ error: "symbol and category required" });
  }

  try {
    // 1. Получаем рыночные данные (свечи OHLCV)
    const candles = await getMarketData(symbol, category);
    if (!candles || candles.length < 20) {
      return res.status(502).json({ error: "Not enough market data" });
    }

    // 2. Считаем индикаторы
    const rsi    = calcRSI(candles, 14);
    const atr    = calcATR(candles, 14);
    const currentPrice = candles[candles.length - 1].close;
    const { vol24h, vol7d, vol1m } = calcVolumes(candles);

    // Market stability = обратное от ATR%
    const atrPct  = (atr / currentPrice) * 100;
    const stability = Math.max(0, Math.min(10, 10 - atrPct * 2)).toFixed(1);

    // Economic context (Bullish / Bearish / Neutral)
    const priceChange24h = ((currentPrice - candles[candles.length - 24]?.close) / candles[candles.length - 24]?.close * 100) || 0;
    const economicContext = rsi > 55 ? "Bullish" : rsi < 45 ? "Bearish" : "Neutral";

    // 3. Экономический календарь
    const calendar = await getEconomicCalendar(symbol);

    // 4. Новости
    const news = await getNews(symbol, category);

    // 5. AI анализ (BUY/SELL, SL, TP, объяснение)
    const aiResult = await generateAnalysis({
      symbol,
      category,
      currentPrice,
      rsi,
      atr,
      atrPct,
      stability,
      priceChange24h,
      candles: candles.slice(-50), // последние 50 свечей
    });

    res.json({
      symbol,
      category,
      currentPrice,
      priceChange24h: +priceChange24h.toFixed(2),

      // Key figures
      stability: +stability,
      rsi: +rsi.toFixed(2),
      economicContext,

      // Volumes
      vol24h,
      vol7d,
      vol1m,

      // RSI history для мини-графика (последние 50 точек)
      rsiHistory: candles.slice(-50).map((c, i, arr) => {
        const slice = arr.slice(0, i + 1);
        return slice.length >= 14 ? +calcRSI(slice, 14).toFixed(2) : null;
      }).filter(Boolean),

      priceHistory: candles.slice(-50).map(c => c.close),

      // AI торговый план
      tradingPlan: aiResult.tradingPlan,   // { scalper, dayTrader, swingTrader }
      technicalAnalysis: aiResult.technicalAnalysis,
      probableScenarios: aiResult.probableScenarios,
      explanation: aiResult.explanation,

      // Доп.данные
      calendar,
      news,

      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Analysis error:", err.message);
    res.status(500).json({ error: "Analysis failed", details: err.message });
  }
});

module.exports = router;
