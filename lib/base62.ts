// lib/base62.ts
import Sqids from 'sqids';

const sqids = new Sqids({
  alphabet: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  minLength: 1
});

export function encodeBase62(num: number): string {
  return sqids.encode([num]);
}
