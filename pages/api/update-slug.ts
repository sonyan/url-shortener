// pages/api/update-slug.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { getToken } from 'next-auth/jwt';
import Redis from 'ioredis';
import { withRateLimit } from '../../lib/rateLimit';

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error('REDIS_URL is not set');
const redis = new Redis(redisUrl);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = await getToken({ req });
  const userId = token?.sub;
  const { urlId, newSlug } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!urlId || !newSlug) {
    return res.status(400).json({ error: 'Missing urlId or newSlug' });
  }

  // Check if slug is already taken
  const existingCount = await prisma.url.count({ where: { slug: newSlug } });
  if (existingCount > 0) {
    return res.status(409).json({ error: 'Slug already exists' });
  }

  // Find the old slug for cache removal
  const oldUrl = await prisma.url.findFirst({ where: { id: urlId, userId } });
  if (!oldUrl) {
    return res.status(404).json({ error: 'URL not found or not owned by user' });
  }

  // Remove old slug from Redis cache
  await redis.del(`slug:${oldUrl.slug}`);

  // Update slug
  // TODO: do we need to reset visits count?
  const url = await prisma.url.updateMany({
    where: { id: urlId, userId },
    data: { slug: newSlug },
  });

  return res.status(200).json({ success: true, newSlug });

}

export default withRateLimit(handler, {
  keyPrefix: 'ratelimit:update-slug',
  limit: 5,
  windowSec: 60,
});
