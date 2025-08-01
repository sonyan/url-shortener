// pages/[slug].tsx

import { prisma } from '../lib/prisma';
import Redis from 'ioredis';
import { rateLimitSSR } from '../lib/rateLimitSSR';

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error('REDIS_URL is not set');
const redis = new Redis(redisUrl);

export async function getServerSideProps(ctx) {
  const { slug } = ctx.params;

  // Rate limit: 60 requests per minute per IP
  const rlResult = await rateLimitSSR(ctx, 'ratelimit:slug-redirect', 60, 60);
  if (rlResult) return rlResult;

  // Try Redis cache first
  let originalUrl = await redis.get(`slug:${slug}`);

  if (!originalUrl) {
    // Fallback to DB
    const url = await prisma.url.findUnique({ where: { slug } });
    if (!url) {
      console.log('URL not found for slug:', slug);
      return { notFound: true };
    }
    originalUrl = url.original;
    // Cache for future requests (Redis should be configured to use LRU policy)
    await redis.set(`slug:${slug}`, originalUrl);
  }

  // Increment visits count
  try {
    await prisma.url.update({
      where: { slug },
      data: { visits: { increment: 1 } },
    });
  } catch (error) {
    // If update fails (e.g., slug no longer exists), return notFound
    return { notFound: true };
  }

  return {
    redirect: {
      destination: originalUrl,
      permanent: false,
    },
  };
}

export default function SlugRedirect() {
  return null;
}