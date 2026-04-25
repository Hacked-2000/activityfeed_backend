import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

const baseConfig = {
  maxRetriesPerRequest: null, // required by bullmq
  enableReadyCheck: false,
  keepAlive: 10000, // prevent Upstash from dropping idle connections
  retryStrategy: (times: number) => Math.min(times * 200, 2000),
};

const redisConfig = redisUrl
  ? {
      ...baseConfig,
      tls: redisUrl.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined,
    }
  : {
      ...baseConfig,
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    };

const redisClient = redisUrl
  ? new Redis(redisUrl, redisConfig)
  : new Redis(redisConfig);

redisClient.on("connect", () => console.log("Redis connected"));
redisClient.on("error", (err) => console.error("Redis error:", err.message));

// bullmq requires a dedicated connection per queue/worker
export function createRedisConnection() {
  return redisUrl ? new Redis(redisUrl, redisConfig) : new Redis(redisConfig);
}

export default redisClient;
