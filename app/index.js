import express from "express";
import dotenv from "dotenv";
import indexRoute from "./routes/index.js";
import http from "http";
import { initSocket } from "./utils/socket/chat_socket.js";

dotenv.config();

const app = express();
app.use(express.json());

const server = http.createServer(app);
initSocket(server);

// All API routes will start with /api
app.use("/api", indexRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
