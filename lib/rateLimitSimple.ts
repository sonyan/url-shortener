// lib/rateLimitSimple.ts
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error('REDIS_URL is not set');
const redis = new Redis(redisUrl);

export async function rateLimitByIp(ip: string, keyPrefix: string, limit: number, windowSec: number): Promise<null | string> {
  const rlKey = `${keyPrefix}:${ip}`;
  const current = await redis.incr(rlKey);
  if (current === 1) {
    await redis.expire(rlKey, windowSec);
  }

  if (current > limit) {
    return 'Rate limit exceeded. Please try again later.';
  }

  return null;
}
