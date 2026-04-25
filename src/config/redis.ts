import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

// shared config used by both the main client and any new connections
const redisConfig = redisUrl
  ? {
      maxRetriesPerRequest: null, // required by bullmq
      enableReadyCheck: false,
      tls: redisUrl.startsWith("rediss://") ? {} : undefined,
    }
  : {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null, // required by bullmq
      enableReadyCheck: false,
    };

const redisClient = redisUrl
  ? new Redis(redisUrl, redisConfig)
  : new Redis(redisConfig);

redisClient.on("connect", () => console.log("Redis connected"));
redisClient.on("error", (err) => console.error("Redis error:", err.message));

// bullmq requires a dedicated connection per queue/worker, can't reuse the same client
export function createRedisConnection() {
  return redisUrl ? new Redis(redisUrl, redisConfig) : new Redis(redisConfig);
}

export default redisClient;
