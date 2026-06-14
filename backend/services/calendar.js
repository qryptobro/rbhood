const https = require("https");

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "rbhood-ai/1.0" } }, (res) => {
      let data = "";
      res.on("data", chunk => (data += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve([]); }
      });
    }).on("error", () => resolve([]));
  });
}

// Currencies связанные с символом
function getRelatedCurrencies(symbol) {
  const map = {
    XAUUSD: ["USD", "XAU"], XAGUSD: ["USD", "XAG"],
    EURUSD: ["EUR", "USD"], GBPUSD: ["GBP", "USD"],
    USDJPY: ["USD", "JPY"], AUDUSD: ["AUD", "USD"],
    USDCHF: ["USD", "CHF"], NZDUSD: ["NZD", "USD"],
    USDCAD: ["USD", "CAD"], AUDJPY: ["AUD", "JPY"],
    BTCUSDT: ["USD"], ETHUSDT: ["USD"],
    AAPL: ["USD"], TSLA: ["USD"], NVDA: ["USD"], MSFT: ["USD"],
  };
  return map[symbol] || ["USD"];
}

async function getEconomicCalendar(symbol) {
  try {
    const currencies = getRelatedCurrencies(symbol);
    // Используем открытый API экономического календаря
    const url = `https://economic-calendar.tradingview.com/events?from=${getDateStr(0)}&to=${getDateStr(7)}&countries=US,EU,GB,JP,AU,CA,CH,NZ`;
    const data = await fetchJson(url);

    if (!Array.isArray(data)) return getMockCalendar(symbol);

    return data
      .filter(e => currencies.some(c => e.currency === c))
      .slice(0, 6)
      .map(e => ({
        id:       e.id,
        date:     e.date,
        title:    e.title,
        impact:   e.importance === 3 ? "High" : e.importance === 2 ? "Medium" : "Low",
        currency: e.currency,
        source:   e.source || "Economic Calendar",
      }));
  } catch {
    return getMockCalendar(symbol);
  }
}

function getDateStr(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

function getMockCalendar(symbol) {
  return [];
}

module.exports = { getEconomicCalendar };
