import Redis from 'ioredis';
import { env } from '../config/env';

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    if (times > 3) {
      console.warn('Redis connection failed. Caching will be disabled.');
      return null; // Stop retrying
    }
    return Math.min(times * 50, 2000);
  },
  enableOfflineQueue: false,
});

redis.on('error', (err) => {
  console.warn('Redis error:', err.message);
});

export const cacheService = {
  get: async <T>(key: string): Promise<T | null> => {
    try {
      if (redis.status !== 'ready') return null;
      const data = await redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      return null;
    }
  },

  set: async (key: string, value: any, ttlSeconds: number): Promise<void> => {
    try {
      if (redis.status !== 'ready') return;
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      // Ignore set errors
    }
  },

  del: async (key: string): Promise<void> => {
    try {
      if (redis.status !== 'ready') return;
      await redis.del(key);
    } catch (error) {
      // Ignore del errors
    }
  },
};
