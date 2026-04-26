import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = "https://finnhub.io/api/v1";
const API_KEY = process.env.FINNHUB_API_KEY;

function formatDailyResponse(data, symbol) {
  if (!data || data.s !== "ok") {
    const message = data?.s === "no_data" ? `No data for ${symbol}` : `Invalid Finnhub response for ${symbol}`;
    throw new Error(message);
  }

  const { t: times = [], c: closes = [] } = data;
  const out = {};

  // Insert entries newest-first so callers can read times[0] as the latest
  for (let i = times.length - 1; i >= 0; i--) {
    const ts = times[i];
    const date = new Date(ts * 1000).toISOString().split("T")[0];
    out[date] = { "4. close": closes[i] != null ? String(closes[i]) : null };
  }

  return out;
}

async function fetchCandle(symbol, resolution, from, to) {
  if (!API_KEY) throw new Error("No FINNHUB_API_KEY configured in environment");

  try {
    const resp = await axios.get(`${BASE_URL}/stock/candle`, {
      params: { symbol, resolution, from, to, token: API_KEY },
    });

    return resp.data;
  } catch (err) {
    throw new Error(err.response?.data?.error || err.message || "Finnhub request failed");
  }
}

export async function getDailyData(symbol) {
  const to = Math.floor(Date.now() / 1000);
  const from = to - 60 * 60 * 24 * 365; // 1 year back

  const data = await fetchCandle(symbol, "D", from, to);
  return formatDailyResponse(data, symbol);
}

export async function getIntradayData(symbol) {
  const to = Math.floor(Date.now() / 1000);
  const from = to - 60 * 60 * 24 * 7; // 7 days back

  const data = await fetchCandle(symbol, "60", from, to);

  if (!data || data.s !== "ok") {
    const message = data?.s === "no_data" ? `No intraday data for ${symbol}` : `Invalid Finnhub response for ${symbol}`;
    throw new Error(message);
  }

  const { t: times = [], c: closes = [] } = data;
  const out = {};

  for (let i = times.length - 1; i >= 0; i--) {
    const ts = times[i];
    const iso = new Date(ts * 1000).toISOString().replace("T", " ").split(".")[0];
    out[iso] = { "4. close": closes[i] != null ? String(closes[i]) : null };
  }

  return out;
}
