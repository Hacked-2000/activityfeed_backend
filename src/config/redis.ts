import Redis from "ioredis";

// shared config used by both the main client and any new connections
const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // required by bullmq
  enableReadyCheck: false,
};

const redisClient = new Redis(redisConfig);

redisClient.on("connect", () => console.log("Redis connected"));
redisClient.on("error", (err) => console.error("Redis error:", err.message));

// bullmq requires a dedicated connection per queue/worker, can't reuse the same client
export function createRedisConnection() {
  return new Redis(redisConfig);
}

export default redisClient;
