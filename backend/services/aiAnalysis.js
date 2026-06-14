const https = require("https");

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

function callClaude(messages, system) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
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
        } catch { reject(new Error("Claude parse error: " + data)); }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function generateAnalysis({ symbol, category, currentPrice, rsi, atr, atrPct, stability, priceChange24h, chartBase64 }) {
  if (!ANTHROPIC_KEY) {
    return getFallbackAnalysis(symbol, currentPrice, rsi, atr);
  }

  const system = `You are an elite institutional trader and technical analyst with 20 years experience.
You analyze TradingView charts visually and provide precise trading signals.
Always respond with valid JSON only — no markdown, no extra text, just the JSON object.`;

  const userContent = [
    {
      type: "text",
      text: `Analyze this ${symbol} (${category}) TradingView chart.

Market context:
- Current price: ${currentPrice}
- RSI(14): ${rsi.toFixed(2)}
- ATR(14): ${atr.toFixed(5)} (${atrPct.toFixed(2)}% volatility)
- Market stability: ${stability}/10
- 24h change: ${priceChange24h > 0 ? "+" : ""}${priceChange24h.toFixed(2)}%

Look at the chart carefully: price action, RSI levels, MACD signals, Bollinger Bands, support/resistance levels, trend direction.

Provide your analysis in this exact JSON format:
{
  "overallSignal": "BUY" | "SELL" | "WAIT",
  "tradingPlan": {
    "scalper": {
      "action": "BUY_LIMIT" | "SELL_LIMIT" | "BUY_STOP" | "SELL_STOP" | "WAIT",
      "entryMin": number,
      "entryMax": number,
      "stopLoss": number,
      "takeProfit": number,
      "confidence": number
    },
    "dayTrader": {
      "action": "BUY_LIMIT" | "SELL_LIMIT" | "BUY_STOP" | "SELL_STOP" | "WAIT",
      "entryMin": number,
      "entryMax": number,
      "stopLoss": number,
      "takeProfit": number,
      "confidence": number
    },
    "swingTrader": {
      "action": "BUY_LIMIT" | "SELL_LIMIT" | "BUY_STOP" | "SELL_STOP" | "WAIT",
      "entryMin": number,
      "entryMax": number,
      "stopLoss": number,
      "takeProfit": number,
      "confidence": number
    }
  },
  "technicalAnalysis": "2-3 sentences about key levels, trend, indicators you see on the chart",
  "probableScenarios": "Bullish scenario: ... Bearish scenario: ...",
  "explanation": "1-2 sentences explaining the main reason for this signal"
}`,
    },
  ];

  // Добавляем картинку если есть
  if (chartBase64) {
    userContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/png",
        data: chartBase64,
      },
    });
  }

  try {
    const raw = await callClaude([{ role: "user", content: userContent }], system);
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
  const sl = isBullish ? +(price - atr * 1.5).toFixed(5) : +(price + atr * 1.5).toFixed(5);
  const tp = isBullish ? +(price + atr * 3).toFixed(5)   : +(price - atr * 3).toFixed(5);

  return {
    overallSignal: isBullish ? "BUY" : "SELL",
    tradingPlan: {
      scalper:     { action, entryMin: +(price - atr * 0.3).toFixed(5), entryMax: +(price + atr * 0.1).toFixed(5), stopLoss: sl, takeProfit: tp, confidence: 72 },
      dayTrader:   { action, entryMin: +(price - atr * 0.5).toFixed(5), entryMax: +(price + atr * 0.2).toFixed(5), stopLoss: sl, takeProfit: tp, confidence: 68 },
      swingTrader: { action, entryMin: +(price - atr * 1.0).toFixed(5), entryMax: +(price + atr * 0.3).toFixed(5), stopLoss: sl, takeProfit: tp, confidence: 65 },
    },
    technicalAnalysis: `RSI at ${rsi.toFixed(1)} indicates ${rsi < 30 ? "oversold" : rsi > 70 ? "overbought" : "neutral"} conditions. ATR of ${atr.toFixed(5)} shows moderate volatility.`,
    probableScenarios: "Bullish: price rebounds from current support. Bearish: continued pressure if key level breaks.",
    explanation: `Signal based on RSI at ${rsi.toFixed(1)} and current price action.`,
  };
}

module.exports = { generateAnalysis };
