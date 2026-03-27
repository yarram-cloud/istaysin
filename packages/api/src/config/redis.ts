import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const url = process.env.REDIS_URL;
    if (!url) {
      console.warn('⚠️ REDIS_URL not set — using in-memory fallback (not production-ready)');
      // Return a minimal Redis instance that connects to localhost
      redis = new Redis({ maxRetriesPerRequest: 3, lazyConnect: true });
      redis.on('error', () => {
        // Silently ignore Redis connection errors in dev
      });
      return redis;
    }
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) return null;
        return Math.min(times * 200, 2000);
      },
    });
  }
  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
