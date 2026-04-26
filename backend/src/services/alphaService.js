import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = "https://www.alphavantage.co/query";

const API_KEYS = [
  process.env.ALPHA_API_KEY,
  process.env.key1,
  process.env.key2,
].filter(Boolean);

function parseTimeSeriesOrThrow(responseData, seriesKey, contextLabel) {
  const series = responseData?.[seriesKey];
  if (series) return series;

  const message =
    responseData?.Note ||
    responseData?.Information ||
    responseData?.["Error Message"] ||
    `Invalid API response for ${contextLabel}`;

  throw new Error(message);
}

async function alphaRequest(params) {
  if (API_KEYS.length === 0) {
    throw new Error("No Alpha Vantage API keys configured in environment");
  }

  for (let i = 0; i < API_KEYS.length; i++) {
    const key = API_KEYS[i];
    try {
      const response = await axios.get(BASE_URL, {
        params: {
          ...params,
          apikey: key,
        },
      });

      const data = response.data;

      if (data?.Note || data?.Information || data?.["Error Message"]) {
        const message = data?.Note || data?.Information || data?.["Error Message"];
        if (i === API_KEYS.length - 1) {
          throw new Error(message || "Alpha Vantage API error");
        }
        // wait a bit then try next key
        await new Promise((r) => setTimeout(r, 600));
        continue;
      }

      return data;
    } catch (err) {
      if (i === API_KEYS.length - 1) throw err;
      await new Promise((r) => setTimeout(r, 600));
      continue;
    }
  }
}

export async function getDailyData(symbol) {
  const data = await alphaRequest({
    function: "TIME_SERIES_DAILY",
    symbol,
  });

  return parseTimeSeriesOrThrow(data, "Time Series (Daily)", "daily data");
}

export async function getIntradayData(symbol) {
  const data = await alphaRequest({
    function: "TIME_SERIES_INTRADAY",
    interval: "60min",
    symbol,
  });

  return parseTimeSeriesOrThrow(data, "Time Series (60min)", "intraday data");
}