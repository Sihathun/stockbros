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

    for (const symbol of STOCKS) {
      let latest, past;

      if (range === "1h") {
        const data = await getIntradayData(symbol);
        const times = Object.keys(data);

        latest = parseFloat(data[times[0]]["4. close"]);
        past = parseFloat(data[times[1]]["4. close"]);
      } else {
        const data = await getDailyData(symbol);
        const dates = Object.keys(data);

        latest = parseFloat(data[dates[0]]["4. close"]);

        if (range === "1d") {
          past = parseFloat(data[dates[1]]["4. close"]);
        } else if (range === "7d") {
          past = parseFloat(data[dates[7]]["4. close"]);
        } else if (range === "1m") {
          past = parseFloat(data[dates[30]]["4. close"]);
        }
      }

      const trend = calculateTrend(latest, past);

      results.push({
        symbol,
        latest,
        trend,
      });
    }

    // Sort descending
    results.sort((a, b) => b.trend - a.trend);

    cache.set(cacheKey, results);

    res.json(results);
  } catch (error) {
    console.log(res.status(500).json({ error: "Failed to fetch stock data" }));
  }
});

export default router;