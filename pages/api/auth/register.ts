// pages/api/auth/register.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { hash } from 'bcryptjs';
import { withRateLimit } from '../../../lib/rateLimit';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const hashed = await hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashed },
  });

  return res.status(201).json({ id: user.id, email: user.email });
}

export default withRateLimit(handler, {
  keyPrefix: 'ratelimit:register',
  limit: 5,
  windowSec: 60,
});
