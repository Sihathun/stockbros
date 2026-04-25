import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = "https://www.alphavantage.co/query";

export async function getDailyData(symbol) {
  const response = await axios.get(BASE_URL, {
    params: {
      function: "TIME_SERIES_DAILY",
      symbol,
      apikey: process.env.ALPHA_API_KEY,
    },
  });

  return response.data["Time Series (Daily)"];
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

  return response.data["Time Series (60min)"];
}