// lib/rateLimit.ts

import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import { rateLimitByIp } from './rateLimitSimple';

export interface RateLimitOptions {
  keyPrefix: string;
  limit: number;
  windowSec: number;
}

export function withRateLimit(handler: NextApiHandler, options: RateLimitOptions): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // TODO: remove console logs
    console.log('headers:', req.headers['x-forwarded-for'])
    console.log('socket:', req.socket)
    const identifier = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
    const rateLimitError = await rateLimitByIp(identifier.toString(), options.keyPrefix, options.limit, options.windowSec);
    if (rateLimitError) {
      return res.status(429).json({ error: rateLimitError });
    }
    return handler(req, res);
  };
}
