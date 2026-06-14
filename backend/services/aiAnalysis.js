const https = require("https");

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "anthropic/claude-3-haiku";

function callOpenRouter(messages, systemPrompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      max_tokens: 1800,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
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
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        const data = Buffer.concat(chunks).toString("utf8");
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message || JSON.stringify(parsed.error)));
          resolve(parsed.choices?.[0]?.message?.content || "");
        } catch { reject(new Error("OpenRouter parse error: " + data)); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// Компактный снимок индикаторов одного ТФ для промпта
function tfSnapshot(ind) {
  if (!ind) return null;
  const i = ind.indicators;
  return {
    price: ind.last_close,
    rsi: i.rsi_14, rsi_signal: i.rsi_signal,
    macd: i.macd.interpretation,
    bollinger: i.bollinger.position,
    trend_ema: i.trend_by_ema,
    adx: i.adx_14, adx_strength: i.adx_strength,
    stoch: i.stochastic.interpretation,
    volume: i.volume_signal,
    consensus: ind.consensus,             // bull/bear/bias/agreement_pct
    support: ind.levels.support_60,
    resistance: ind.levels.resistance_60,
  };
}

async function generateAnalysis({ symbol, category, lang, daily, tfData }) {
  if (!OPENROUTER_KEY) {
    return fallback(tfData, daily);
  }

  const langName = lang === "kz" ? "Kazakh" : lang === "en" ? "English" : "Russian";

  const system = `You are an elite institutional trader and quantitative analyst.
You receive REAL pre-computed indicators (RSI, MACD, Bollinger, EMA 20/50/200, ATR, Stochastic, ADX) for 3 timeframes (5m scalper, 15m day trader, 4h swing trader).
The numbers are already calculated correctly — NEVER invent prices or indicator values, only INTERPRET them.
Decide direction per timeframe from the indicator consensus. Confidence MUST reflect how many indicators agree (use the consensus.agreement_pct as a strong anchor).
If signals are mixed (agreement near 50%), choose WAIT with low confidence — do not force a direction.
Write all text fields ("reasoning", "technicalAnalysis", "probableScenarios", "explanation") in ${langName}.
Respond with raw JSON only — no markdown, no backticks.`;

  const payload = {
    asset: symbol,
    category,
    daily_summary: tfSnapshot(daily),
    timeframes: {
      scalper_5m: tfSnapshot(tfData.scalper),
      dayTrader_15m: tfSnapshot(tfData.dayTrader),
      swingTrader_4h: tfSnapshot(tfData.swingTrader),
    },
  };

  const content = [];
  content.push({
    type: "text",
    text: `Analyze ${symbol} (${category}). Pre-computed indicators per timeframe:

${JSON.stringify(payload, null, 2)}

Return ONLY this JSON:
{
  "overallSignal": "BUY" | "SELL" | "WAIT",
  "plans": {
    "scalper":     { "action": "BUY_LIMIT|SELL_LIMIT|BUY_STOP|SELL_STOP|WAIT", "confidence": 0-100, "reasoning": "1 sentence" },
    "dayTrader":   { "action": "...", "confidence": 0-100, "reasoning": "1 sentence" },
    "swingTrader": { "action": "...", "confidence": 0-100, "reasoning": "1 sentence" }
  },
  "technicalAnalysis": "2-3 sentences across timeframes",
  "probableScenarios": "Bullish: ... Bearish: ...",
  "explanation": "1-2 sentences on the main driver"
}

Rules:
- Do NOT output entry/stop/take-profit prices — those are computed deterministically elsewhere.
- confidence per plan should track that timeframe's consensus.agreement_pct.`,
  });

  try {
    const raw = await callOpenRouter([{ role: "user", content }], system);
    const cleaned = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("No JSON: " + raw.slice(0, 200));
    return JSON.parse(m[0]);
  } catch (err) {
    console.error("OpenRouter error:", err.message);
    return fallback(tfData, daily);
  }
}

// Фоллбэк без LLM: строим направление и уверенность из согласия индикаторов
function fallback(tfData, daily) {
  const plan = (ind) => {
    if (!ind) return { action: "WAIT", confidence: 0, reasoning: "нет данных" };
    const { bias, agreement_pct } = ind.consensus;
    const action = bias === "BUY" ? "BUY_LIMIT" : bias === "SELL" ? "SELL_LIMIT" : "WAIT";
    return { action, confidence: agreement_pct, reasoning: `${ind.consensus.bull} индикаторов за рост, ${ind.consensus.bear} за падение` };
  };
  const d = daily?.consensus?.bias || "WAIT";
  return {
    overallSignal: d,
    plans: {
      scalper: plan(tfData.scalper),
      dayTrader: plan(tfData.dayTrader),
      swingTrader: plan(tfData.swingTrader),
    },
    technicalAnalysis: daily ? `RSI ${daily.indicators.rsi_14}, тренд: ${daily.indicators.trend_by_ema}, ADX: ${daily.indicators.adx_strength}.` : "",
    probableScenarios: "Bullish: пробой сопротивления. Bearish: уход под поддержку.",
    explanation: "Сигнал на основе согласия индикаторов (без LLM).",
  };
}

module.exports = { generateAnalysis };
