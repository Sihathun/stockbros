import express from "express";
import NodeCache from "node-cache";
import { getDailyData, getIntradayData } from "../services/alphaService.js";
import { calculateTrend } from "../utils/trendCalculator.js";

const router = express.Router();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

const STOCKS = ["AAPL", "MSFT", "TSLA", "AMZN", "GOOGL"];

const USE_MOCK = (process.env.USE_MOCK_ALPHA || "false").toLowerCase() === "true";

router.get("/trending", async (req, res) => {
  const { range = "1d" } = req.query;

  const cacheKey = `trending-${range}`;
  if (cache.has(cacheKey)) {
    return res.json(cache.get(cacheKey));
  }

  // Development-friendly mock fallback to avoid hitting Alpha Vantage limits.
  if (USE_MOCK) {
    const mock = STOCKS.map((symbol, i) => {
      const latest = 100 + Math.round(Math.random() * 200);
      const past = latest - Math.round((Math.random() - 0.5) * 10);
      return { symbol, latest, trend: calculateTrend(latest, past) };
    }).sort((a, b) => b.trend - a.trend);

    cache.set(cacheKey, mock);
    return res.json(mock);
  }

  try {
    const results = [];
    const errors = [];

    for (const symbol of STOCKS) {
      // Add a short delay between requests to respect API rate limit (≈1s)
      await new Promise(resolve => setTimeout(resolve, 1100));

      try {
        let latest, past;

        if (range === "1h") {
          const data = await getIntradayData(symbol);
          const times = Object.keys(data);

          if (times.length < 2) {
            throw new Error("Not enough intraday points");
          }

          latest = parseFloat(data[times[0]]["4. close"]);
          past = parseFloat(data[times[1]]["4. close"]);
        } else {
          const data = await getDailyData(symbol);
          const dates = Object.keys(data);

          if (dates.length < 2) {
            throw new Error("Not enough daily points");
          }

          latest = parseFloat(data[dates[0]]["4. close"]);

          if (range === "1d") {
            past = parseFloat(data[dates[1]]["4. close"]);
          } else if (range === "7d") {
            past = parseFloat(data[dates[Math.min(7, dates.length - 1)]]["4. close"]);
          } else if (range === "1m") {
            past = parseFloat(data[dates[Math.min(30, dates.length - 1)]]["4. close"]);
          }
        }

        const trend = calculateTrend(latest, past);

        results.push({
          symbol,
          latest,
          trend,
        });
      } catch (error) {
        errors.push({ symbol, message: error.message });
      }
    }

    if (results.length === 0) {
      // Consolidate messages and detect rate-limit style responses
      const uniqueMessages = Array.from(new Set(errors.map(e => e.message)));
      const rateLimitDetected = uniqueMessages.some(m => /rate limit|detected your api key|Note|daily rate limit/i.test(m));

      if (rateLimitDetected) {
        return res.status(503).json({
          error: "Alpha Vantage rate limit reached",
          message:
            "Alpha Vantage is rejecting requests (daily or per-second limits). Try again later, reduce request frequency, or configure your own API key.",
          details: uniqueMessages,
        });
      }

      return res.status(503).json({
        error: "No stock data available right now",
        details: uniqueMessages,
      });
    }

    // Sort descending
    results.sort((a, b) => b.trend - a.trend);

    cache.set(cacheKey, results);

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Failed to fetch stock data" });
  }
});

export default router;