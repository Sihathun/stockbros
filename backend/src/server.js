import express from "express";
import cors from "cors";
import stockRoutes from "./routes/stocks.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/stocks", stockRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});