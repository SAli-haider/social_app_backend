import express from "express";
import dotenv from "dotenv";
import indexRoute from "./routes/index.js";

dotenv.config();

const app = express();
app.use(express.json());

// All API routes will start with /api
app.use("/api", indexRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
