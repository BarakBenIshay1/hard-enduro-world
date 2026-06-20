import { Redis } from "@upstash/redis";

type CacheOptions = {
  ttlSeconds?: number;
};

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export async function getCachedJson<T>(key: string): Promise<T | null> {
  if (!redis) {
    return null;
  }

  return redis.get<T>(key);
}

export async function setCachedJson<T>(
  key: string,
  value: T,
  options: CacheOptions = {},
) {
  if (!redis) {
    return;
  }

  if (options.ttlSeconds) {
    await redis.set(key, value, { ex: options.ttlSeconds });
    return;
  }

  await redis.set(key, value);
}

export async function invalidateCacheKey(key: string) {
  if (!redis) {
    return;
  }

  await redis.del(key);
}
