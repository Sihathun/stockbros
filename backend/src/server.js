import express from "express";
import cors from "cors";
import stockRoutes from "./routes/stocks.js";

const app = express();

app.use(cors());
app.use(express.json());

// Request logging middleware — logs method, URL, IP, headers, query and body
app.use((req, res, next) => {
  try {
    const now = new Date().toISOString();
    const ip = req.ip || (req.connection && req.connection.remoteAddress) || "unknown";
    const method = req.method;
    const url = req.originalUrl || req.url;
    const query = JSON.stringify(req.query || {});
    const params = JSON.stringify(req.params || {});
    const headers = JSON.stringify(req.headers || {});
    const body = JSON.stringify(req.body || {});

    console.log(`${now} - ${ip} - ${method} ${url} - query=${query} - params=${params} - headers=${headers} - body=${body}`);
  } catch (err) {
    console.log("Request logging error:", err);
  }
  next();
});

app.use("/api/stocks", stockRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});