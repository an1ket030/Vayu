import Redis from 'ioredis';
import { env } from '../config/env';

const redis = new Redis(env.REDIS_URL);

export const cacheService = {
  get: async <T>(key: string): Promise<T | null> => {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  },

  set: async (key: string, value: any, ttlSeconds: number): Promise<void> => {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  },

  del: async (key: string): Promise<void> => {
    await redis.del(key);
  },
};
