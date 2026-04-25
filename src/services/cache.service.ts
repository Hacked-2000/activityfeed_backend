import redisClient from "../config/redis";

const TTL = Number(process.env.CACHE_TTL) || 60;

function buildKey(tenantId: string, cursor: string, limit: number, type: string) {
  return `feed:${tenantId}:${type}:${cursor || "fresh"}:${limit}`;
}

export async function getCachedFeed<T>(
  tenantId: string,
  cursor: string,
  limit: number,
  type: string
): Promise<T | null> {
  try {
    const raw = await redisClient.get(buildKey(tenantId, cursor, limit, type));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function setCachedFeed<T>(
  tenantId: string,
  cursor: string,
  limit: number,
  data: T,
  type: string
): Promise<void> {
  try {
    const key = buildKey(tenantId, cursor, limit, type);
    await redisClient.setex(key, TTL, JSON.stringify(data));
  } catch (err) {
    console.warn("[Cache] failed to set cache:", (err as Error).message);
  }
}

export async function invalidateFeedCache(tenantId: string): Promise<void> {
  try {
    const keys = await redisClient.keys(`feed:${tenantId}:*`);
    if (keys.length > 0) await redisClient.del(...keys);
  } catch (err) {
    console.warn("[Cache] failed to invalidate cache:", (err as Error).message);
  }
}
