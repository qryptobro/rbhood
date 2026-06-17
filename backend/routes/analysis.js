const router = require("express").Router();
const jwt = require("jsonwebtoken");
const { incr } = require("../lib/usage");
const { getMarketData, getCandles, calcRSI, calcVolumes } = require("../services/marketData");
const { computeIndicators } = require("../services/indicators");
const { getEconomicCalendar } = require("../services/calendar");
const { getNews } = require("../services/news");
const { generateAnalysis } = require("../services/aiAnalysis");

// Таймфрейм каждого плана
const PLAN_TF = { scalper: "5m", dayTrader: "15m", swingTrader: "4h" };

// Из детерминированных ATR-уровней + направления собираем план
function buildPlan(action, levels, confidence) {
  const isLong = action.includes("BUY");
  if (action === "WAIT") {
    return { action, entryMin: levels.entry_min, entryMax: levels.entry_max, stopLoss: null, takeProfit: null, confidence };
  }
  return {
    action,
    entryMin: levels.entry_min,
    entryMax: levels.entry_max,
    stopLoss:  isLong ? levels.stop_loss_long  : levels.stop_loss_short,
    takeProfit: isLong ? levels.take_profit_long : levels.take_profit_short,
    confidence,
  };
}

// POST /api/analysis
// body: { symbol, category, lang }
router.post("/", async (req, res) => {
  const { symbol, category, lang } = req.body;
  if (!symbol || !category) {
    return res.status(400).json({ error: "symbol and category required" });
  }

  // Учёт расхода: считаем запрос за пользователем (если есть токен)
  try {
    const h = req.headers.authorization;
    if (h?.startsWith("Bearer ") && process.env.JWT_SECRET) {
      const payload = jwt.verify(h.slice(7), process.env.JWT_SECRET);
      incr(payload.userId);
    }
  } catch { /* токен невалиден/отсутствует — просто не считаем */ }

  try {
    // 1. Дневные свечи — для заголовочных метрик (RSI, стабильность, объёмы, спарклайны)
    const daily = await getMarketData(symbol, "1d");
    if (!daily || daily.length < 50) {
      return res.status(502).json({ error: "Недостаточно дневных данных (нужно ≥50 свечей)" });
    }
    const dailyInd = computeIndicators(daily);
    const currentPrice = dailyInd.last_close;
    const rsi = dailyInd.indicators.rsi_14;
    const atrPct = (dailyInd.indicators.atr_14 / currentPrice) * 100;
    const stability = +Math.max(0, Math.min(10, 10 - atrPct * 2)).toFixed(1);
    const { vol24h, vol7d, vol1m } = calcVolumes(daily);
    const priceChange24h = dailyInd.pct_change_last_candle;
    const economicContext = rsi > 55 ? "Bullish" : rsi < 45 ? "Bearish" : "Neutral";

    // 2. Свечи + индикаторы по 3 торговым таймфреймам (5m/15m/4h)
    const tfData = {};      // индикаторы
    const candlesByTf = {}; // сырые свечи для отрисовки графика на фронте
    for (const [plan, tf] of Object.entries(PLAN_TF)) {
      try {
        const candles = await getCandles(symbol, tf, 200);
        tfData[plan] = computeIndicators(candles);
        // lightweight-charts: время в секундах
        candlesByTf[plan] = candles.map(c => ({
          time: Math.floor(c.time / 1000),
          open: c.open, high: c.high, low: c.low, close: c.close,
        }));
      } catch (e) {
        console.warn(`Indicators ${plan}(${tf}) failed:`, e.message);
        tfData[plan] = null;
        candlesByTf[plan] = null;
      }
    }

    // 3. Календарь + новости
    const calendar = await getEconomicCalendar(symbol);
    const news = await getNews(symbol, category);

    // 4. AI: получает ГОТОВЫЕ числа по каждому ТФ, решает направление + уверенность + объяснение
    const ai = await generateAnalysis({
      symbol, category, lang: lang || "ru",
      daily: dailyInd, tfData,
    });

    // 6. Собираем торговый план: направление от Claude + ATR-уровни из расчёта (не выдуманные)
    const tradingPlan = {};
    for (const plan of Object.keys(PLAN_TF)) {
      const ind = tfData[plan];
      const aiPlan = ai.plans?.[plan] || {};
      if (!ind) {
        tradingPlan[plan] = buildPlan("WAIT", { entry_min: null, entry_max: null }, 0);
        continue;
      }
      // если Claude не дал действие — берём детерминированный bias из согласия индикаторов
      const action = aiPlan.action || (ind.consensus.bias === "BUY" ? "BUY_LIMIT" : ind.consensus.bias === "SELL" ? "SELL_LIMIT" : "WAIT");
      const confidence = aiPlan.confidence != null ? aiPlan.confidence : ind.consensus.agreement_pct;
      tradingPlan[plan] = buildPlan(action, ind.levels, confidence);
    }

    res.json({
      symbol,
      category,
      currentPrice,
      priceChange24h: +priceChange24h.toFixed(2),

      stability,
      rsi: +rsi.toFixed(2),
      economicContext,
      overallSignal: ai.overallSignal,

      vol24h, vol7d, vol1m,

      rsiHistory: daily.slice(-50).map((c, i, arr) => {
        const slice = arr.slice(0, i + 1);
        return slice.length >= 14 ? +calcRSI(slice, 14).toFixed(2) : null;
      }).filter(Boolean),
      priceHistory: daily.slice(-50).map(c => c.close),
      volumeHistory: daily.slice(-40).map(c => c.volume),

      tradingPlan,
      technicalAnalysis: ai.technicalAnalysis,
      probableScenarios: ai.probableScenarios,
      explanation: ai.explanation,

      // сырые индикаторы по ТФ — фронт может показать
      indicatorsByTf: {
        scalper: tfData.scalper?.indicators ?? null,
        dayTrader: tfData.dayTrader?.indicators ?? null,
        swingTrader: tfData.swingTrader?.indicators ?? null,
      },

      calendar,
      news,
      candlesByTf,   // свечи 5m/15m/4h для графика

      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Analysis error:", err.message);
    res.status(500).json({ error: "Analysis failed", details: err.message });
  }
});

module.exports = router;
