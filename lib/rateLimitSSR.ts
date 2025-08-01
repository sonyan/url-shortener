// lib/rateLimitSSR.ts

import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { rateLimitByIp } from './rateLimitSimple';

export async function rateLimitSSR(
  ctx: GetServerSidePropsContext,
  keyPrefix: string,
  limit: number,
  windowSec: number
): Promise<null | GetServerSidePropsResult<any>> {
  const ip = (ctx.req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || '';
  const rateLimitError = await rateLimitByIp(ip, keyPrefix, limit, windowSec);

  if (rateLimitError) {
    return { notFound: true };
  }
  
  return null;
}
