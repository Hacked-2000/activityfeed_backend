import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/db";
import activityRoutes from "./routes/activity.routes";
import { startWorker, stopWorker } from "./services/worker.service";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/v1", activityRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

async function start() {
  await connectDB();
  startWorker();
  app.listen(PORT, () => {
    console.log(`Server is up on port ${PORT}`);
  });
}

async function shutdown() {
  console.log("Shutting down gracefully...");
  await stopWorker();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
