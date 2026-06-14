const https = require("https");

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "anthropic/claude-3-haiku";

function callOpenRouter(messages, systemPrompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    });

    const req = https.request({
      hostname: "openrouter.ai",
      path: "/api/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "HTTP-Referer": "https://rbhood.ai",
        "X-Title": "RBHood AI Trading",
        "Content-Length": Buffer.byteLength(body),
      },
    }, (res) => {
      let data = "";
      res.on("data", chunk => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message || JSON.stringify(parsed.error)));
          resolve(parsed.choices?.[0]?.message?.content || "");
        } catch {
          reject(new Error("OpenRouter parse error: " + data));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function generateAnalysis({ symbol, category, currentPrice, rsi, atr, atrPct, stability, priceChange24h, charts, lang }) {
  if (!OPENROUTER_KEY) {
    return getFallbackAnalysis(symbol, currentPrice, rsi, atr);
  }
  const chartBase64 = charts?.scalper || charts?.dayTrader || charts?.swingTrader || null;

  const langInstruction =
    lang === "ru" ? "Respond in Russian language. All text fields must be in Russian." :
    lang === "kz" ? "Respond in Kazakh language. All text fields must be in Kazakh." :
    "Respond in English.";

  const system = `You are an elite institutional trader and technical analyst with 20 years of experience.
You analyze TradingView charts visually and provide precise, actionable trading signals.
${langInstruction}
Always respond with valid JSON only — no markdown fences, no extra text, just the raw JSON object.`;

  const userContent = [];

  // 3 графика: 1m → scalper, 5m → dayTrader, 1h → swingTrader
  if (charts?.scalper) {
    userContent.push({ type: "image_url", image_url: { url: `data:image/png;base64,${charts.scalper}` } });
  }
  if (charts?.dayTrader) {
    userContent.push({ type: "image_url", image_url: { url: `data:image/png;base64,${charts.dayTrader}` } });
  }
  if (charts?.swingTrader) {
    userContent.push({ type: "image_url", image_url: { url: `data:image/png;base64,${charts.swingTrader}` } });
  }

  const hasCharts = charts?.scalper || charts?.dayTrader || charts?.swingTrader;

  userContent.push({
    type: "text",
    text: `Analyze ${symbol} (${category}) using ${hasCharts ? "the 3 FxPro TradingView charts provided (image 1 = 1m scalper, image 2 = 5m day trader, image 3 = 1h swing trader)" : "market data below"}.

Market context:
- Current price: ${currentPrice}
- RSI(14): ${rsi.toFixed(2)}
- ATR(14): ${atr.toFixed(5)} (${atrPct.toFixed(2)}% volatility)
- Market stability: ${stability}/10
- 24h change: ${priceChange24h >= 0 ? "+" : ""}${priceChange24h.toFixed(2)}%

${hasCharts ? "Analyze each timeframe separately:\n- 1m chart → scalper signals (entry/SL/TP tight)\n- 5m chart → day trader signals (medium range)\n- 1h chart → swing trader signals (wider SL/TP)" : "Use the market data above for analysis."}

Return ONLY this JSON object:
{
  "overallSignal": "BUY",
  "tradingPlan": {
    "scalper": {
      "action": "BUY_LIMIT",
      "entryMin": 0,
      "entryMax": 0,
      "stopLoss": 0,
      "takeProfit": 0,
      "confidence": 75
    },
    "dayTrader": {
      "action": "BUY_LIMIT",
      "entryMin": 0,
      "entryMax": 0,
      "stopLoss": 0,
      "takeProfit": 0,
      "confidence": 70
    },
    "swingTrader": {
      "action": "BUY_LIMIT",
      "entryMin": 0,
      "entryMax": 0,
      "stopLoss": 0,
      "takeProfit": 0,
      "confidence": 65
    }
  },
  "technicalAnalysis": "...",
  "probableScenarios": "Bullish: ... Bearish: ...",
  "explanation": "..."
}

Rules:
- action must be one of: BUY_LIMIT, SELL_LIMIT, BUY_STOP, SELL_STOP, WAIT
- overallSignal must be one of: BUY, SELL, WAIT
- All prices must be real numbers (not strings), close to current price of ${currentPrice}
- confidence is 0-100 integer`,
  });

  try {
    const raw = await callOpenRouter(
      [{ role: "user", content: userContent }],
      system
    );

    // Убираем возможные markdown блоки если вдруг появились
    const cleaned = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response: " + raw.slice(0, 200));
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("OpenRouter error:", err.message);
    return getFallbackAnalysis(symbol, currentPrice, rsi, atr);
  }
}

function getFallbackAnalysis(symbol, price, rsi, atr) {
  const isBullish = rsi < 50;
  const action = isBullish ? "BUY_LIMIT" : "SELL_LIMIT";
  const sl = isBullish ? +(price - atr * 1.5).toFixed(5) : +(price + atr * 1.5).toFixed(5);
  const tp = isBullish ? +(price + atr * 3).toFixed(5)   : +(price - atr * 3).toFixed(5);
  const entry = [+(price - atr * 0.3).toFixed(5), +(price + atr * 0.1).toFixed(5)];

  return {
    overallSignal: isBullish ? "BUY" : "SELL",
    tradingPlan: {
      scalper:     { action, entryMin: entry[0], entryMax: entry[1], stopLoss: sl, takeProfit: tp, confidence: 72 },
      dayTrader:   { action, entryMin: +(price - atr * 0.5).toFixed(5), entryMax: +(price + atr * 0.2).toFixed(5), stopLoss: sl, takeProfit: tp, confidence: 68 },
      swingTrader: { action, entryMin: +(price - atr * 1.0).toFixed(5), entryMax: +(price + atr * 0.3).toFixed(5), stopLoss: sl, takeProfit: tp, confidence: 65 },
    },
    technicalAnalysis: `RSI at ${rsi.toFixed(1)} indicates ${rsi < 30 ? "oversold" : rsi > 70 ? "overbought" : "neutral"} conditions. ATR ${atr.toFixed(5)} — ${atrPct > 3 ? "high" : "moderate"} volatility.`,
    probableScenarios: "Bullish: price rebounds from current support. Bearish: continued pressure if key level breaks.",
    explanation: `Signal based on RSI at ${rsi.toFixed(1)} and current price momentum.`,
  };
}

module.exports = { generateAnalysis };
