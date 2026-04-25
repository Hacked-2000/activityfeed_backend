import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

function makeConfig(forBullMQ = false) {
  const base = {
    maxRetriesPerRequest: forBullMQ ? null : 3,
    enableReadyCheck: false,
    lazyConnect: false,
    keepAlive: 30000,
    connectTimeout: 10000,
    retryStrategy: (times: number) => Math.min(times * 500, 5000),
  };

  if (redisUrl) {
    return {
      ...base,
      tls: { rejectUnauthorized: false }, // required for Upstash rediss://
    };
  }

  return {
    ...base,
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  };
}

const redisClient = redisUrl
  ? new Redis(redisUrl, makeConfig())
  : new Redis(makeConfig());

redisClient.on("connect", () => console.log("Redis connected"));
redisClient.on("error", (err) => console.error("Redis error:", err.message));

// bullmq needs its own connection per queue/worker (maxRetriesPerRequest: null)
export function createRedisConnection() {
  return redisUrl
    ? new Redis(redisUrl, makeConfig(true))
    : new Redis(makeConfig(true));
}

export default redisClient;
