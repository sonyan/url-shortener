// pages/api/shorten.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import Redis from 'ioredis';
import { encodeBase62 } from '../../lib/base62';
import { getToken } from 'next-auth/jwt';
import { withRateLimit } from '../../lib/rateLimit';

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error('REDIS_URL is not set');
const redis = new Redis(redisUrl);
const urlRegex = /^(https?:\/\/)[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!$&'()*+,;=.]+$/i;

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = await getToken({ req });
  const userId = token?.sub || null;
  const { original, customSlug } = req.body;

  if (!original || typeof original !== 'string' || !urlRegex.test(original)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  let slug: string = '';
  if (customSlug) {
    const existing = await prisma.url.findUnique({ where: { slug: customSlug } });
    if (existing) {
      return res.status(409).json({ error: 'Slug already exists' });
    }
    slug = customSlug;
  } else {
    // Generate a unique slug
    // to support billion URLs, we need at least 10^9 unique slugs.
    // base62 encoding gives us 62^6 = 56B unique slugs with 6 characters.
    // this is more than enough for most applications.
    // base62 encoding uses characters 0-9, a-z, A-Z.

    // There are three approaches to ensure uniqueness:
    // 1. Random number generation
    //    this is the simplest and fastest approach, but it can lead to collisions.
    //    we just need to check for collisions first.
    // 2. Hashing the original URL
    //    this can be done using a cryptographic hash function like SHA-256.
    //    the hash can be truncated to a fixed length, e.g. 6, to create the slug.
    //    it could still lead to collisions.
    // 3. Counter-based slug generation
    //    this requires maintaining a global counter in Redis cluster.
    //    each time a new URL is created, the counter is incremented and used to generate a slug.
    //    this is the most reliable approach, but it requires additional infrastructure.

    // Use Redis global counter and base62 encoding without collision check
    const counter = await redis.incr('url_counter');
    slug = encodeBase62(counter);
  }

  const url = await prisma.url.create({
    data: {
      original,
      slug,
      userId,
    },
  });

  return res.status(201).json({ slug: url.slug, shortUrl: `${req.headers.host}/${url.slug}` });
}

export default withRateLimit(handler, {
  keyPrefix: 'ratelimit:shorten',
  limit: 30,
  windowSec: 60,
});
