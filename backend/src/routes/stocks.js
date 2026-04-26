import express from "express";
import NodeCache from "node-cache";
import { getDailyData, getIntradayData } from "../services/alphaService.js";
import { calculateTrend } from "../utils/trendCalculator.js";

const router = express.Router();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

const STOCKS = ["AAPL", "MSFT", "TSLA", "AMZN", "GOOGL"];

router.get("/trending", async (req, res) => {
  const { range = "1d" } = req.query;

  const cacheKey = `trending-${range}`;
  if (cache.has(cacheKey)) {
    return res.json(cache.get(cacheKey));
  }

  try {
    const results = [];
    const errors = [];

    for (const symbol of STOCKS) {
      // Add 1.5 second delay between requests to respect API rate limit
      await new Promise(resolve => setTimeout(resolve, 1500));

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
      return res.status(503).json({
        error: "No stock data available right now",
        details: errors,
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