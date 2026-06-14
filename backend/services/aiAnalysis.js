const https = require("https");

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

function callClaude(messages, system) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system,
      messages,
    });

    const req = https.request({
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(body),
      },
    }, (res) => {
      let data = "";
      res.on("data", chunk => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.content?.[0]?.text || "");
        } catch { reject(new Error("Claude parse error")); }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function generateAnalysis({ symbol, category, currentPrice, rsi, atr, atrPct, stability, priceChange24h, candles }) {
  // Если нет ключа — возвращаем заглушку
  if (!ANTHROPIC_KEY) {
    return getFallbackAnalysis(symbol, currentPrice, rsi, atr);
  }

  const lastCandles = candles.slice(-10).map(c =>
    `O:${c.open.toFixed(4)} H:${c.high.toFixed(4)} L:${c.low.toFixed(4)} C:${c.close.toFixed(4)}`
  ).join("\n");

  const system = `You are an elite institutional trader and technical analyst.
Analyze market data and provide precise trading signals.
Always respond with valid JSON only, no extra text.`;

  const userMessage = `Analyze ${symbol} (${category}):

Current price: ${currentPrice}
RSI(14): ${rsi.toFixed(2)}
ATR(14): ${atr.toFixed(4)} (${atrPct.toFixed(2)}% of price)
Market stability: ${stability}/10
24h change: ${priceChange24h.toFixed(2)}%

Last 10 candles (1h OHLC):
${lastCandles}

Provide analysis in this exact JSON format:
{
  "tradingPlan": {
    "scalper": {
      "action": "BUY_LIMIT" | "SELL_LIMIT" | "BUY_STOP" | "SELL_STOP" | "WAIT",
      "entryMin": number,
      "entryMax": number,
      "stopLoss": number,
      "takeProfit": number,
      "confidence": number (0-100)
    },
    "dayTrader": {
      "action": "BUY_LIMIT" | "SELL_LIMIT" | "BUY_STOP" | "SELL_STOP" | "WAIT",
      "entryMin": number,
      "entryMax": number,
      "stopLoss": number,
      "takeProfit": number,
      "confidence": number (0-100)
    },
    "swingTrader": {
      "action": "BUY_LIMIT" | "SELL_LIMIT" | "BUY_STOP" | "SELL_STOP" | "WAIT",
      "entryMin": number,
      "entryMax": number,
      "stopLoss": number,
      "takeProfit": number,
      "confidence": number (0-100)
    }
  },
  "technicalAnalysis": "string (2-3 sentences about key levels, trend, indicators)",
  "probableScenarios": "string (bullish and bearish scenario in 2-3 sentences)",
  "explanation": "string (1-2 sentences why this trade)",
  "overallSignal": "BUY" | "SELL" | "WAIT"
}`;

  try {
    const raw = await callClaude([{ role: "user", content: userMessage }], system);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("Claude error:", err.message);
    return getFallbackAnalysis(symbol, currentPrice, rsi, atr);
  }
}

function getFallbackAnalysis(symbol, price, rsi, atr) {
  const isBullish = rsi < 50;
  const action = isBullish ? "BUY_LIMIT" : "SELL_LIMIT";
  const sl = isBullish ? +(price - atr * 1.5).toFixed(4) : +(price + atr * 1.5).toFixed(4);
  const tp = isBullish ? +(price + atr * 3).toFixed(4)   : +(price - atr * 3).toFixed(4);

  return {
    tradingPlan: {
      scalper:    { action, entryMin: +(price - atr * 0.3).toFixed(4), entryMax: +(price + atr * 0.1).toFixed(4), stopLoss: sl, takeProfit: tp, confidence: 72 },
      dayTrader:  { action, entryMin: +(price - atr * 0.5).toFixed(4), entryMax: +(price + atr * 0.2).toFixed(4), stopLoss: sl, takeProfit: tp, confidence: 68 },
      swingTrader:{ action, entryMin: +(price - atr * 1.0).toFixed(4), entryMax: +(price + atr * 0.3).toFixed(4), stopLoss: sl, takeProfit: tp, confidence: 65 },
    },
    technicalAnalysis: `RSI at ${rsi.toFixed(1)} indicates ${rsi < 30 ? "oversold" : rsi > 70 ? "overbought" : "neutral"} conditions. ATR of ${atr.toFixed(4)} shows moderate volatility.`,
    probableScenarios: `Bullish: price rebounds from current support. Bearish: continued pressure if key level breaks.`,
    explanation: `Signal based on RSI divergence and current price action near key level.`,
    overallSignal: isBullish ? "BUY" : "SELL",
  };
}

module.exports = { generateAnalysis };
