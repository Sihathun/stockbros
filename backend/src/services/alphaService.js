import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = "https://www.alphavantage.co/query";

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

export async function getDailyData(symbol) {
  const response = await axios.get(BASE_URL, {
    params: {
      function: "TIME_SERIES_DAILY",
      symbol,
      apikey: process.env.ALPHA_API_KEY,
    },
  });

  return parseTimeSeriesOrThrow(response.data, "Time Series (Daily)", "daily data");
}

export async function getIntradayData(symbol) {
  const response = await axios.get(BASE_URL, {
    params: {
      function: "TIME_SERIES_INTRADAY",
      interval: "60min",
      symbol,
      apikey: process.env.ALPHA_API_KEY,
    },
  });

  return parseTimeSeriesOrThrow(response.data, "Time Series (60min)", "intraday data");
}