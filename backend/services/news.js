const https = require("https");

const AV_KEY = process.env.ALPHA_VANTAGE_KEY;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", chunk => (data += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({}); }
      });
    }).on("error", () => resolve({}));
  });
}

// Маппинг символов в тикеры для Alpha Vantage News
function getNewsTicker(symbol, category) {
  if (category === "crypto") {
    const map = { BTCUSDT: "CRYPTO:BTC", ETHUSDT: "CRYPTO:ETH", BNBUSDT: "CRYPTO:BNB",
                  SOLUSDT: "CRYPTO:SOL", XRPUSDT: "CRYPTO:XRP", ADAUSDT: "CRYPTO:ADA",
                  DOGEUSDT: "CRYPTO:DOGE", AVAXUSDT: "CRYPTO:AVAX" };
    return map[symbol] || "CRYPTO:BTC";
  }
  if (category === "forex") {
    return "FOREX:" + symbol.replace("USDT", "");
  }
  return symbol; // акции — прямо тикер
}

async function getNews(symbol, category) {
  try {
    const ticker = getNewsTicker(symbol, category);
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${ticker}&limit=6&apikey=${AV_KEY}`;
    const data = await fetchJson(url);

    const feed = data.feed;
    if (!Array.isArray(feed)) return [];

    return feed.slice(0, 6).map(item => ({
      title:     item.title,
      summary:   item.summary?.slice(0, 150) + "...",
      url:       item.url,
      source:    item.source,
      image:     item.banner_image || null,
      sentiment: item.overall_sentiment_label || "Neutral",
      publishedAt: item.time_published,
    }));
  } catch {
    return [];
  }
}

module.exports = { getNews };
