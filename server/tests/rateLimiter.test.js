import { describe, expect, it } from 'vitest';
import { ipBucket } from '../middleware/rateLimiter.js';

/**
 * The auth limiter is only as strong as its key. If two requests from the same
 * subscriber produce different keys, the limit is decorative.
 */
describe('ipBucket', () => {
  it('passes IPv4 through unchanged', () => {
    expect(ipBucket({ ip: '203.0.113.5' })).toBe('203.0.113.5');
  });

  it('unwraps IPv4-mapped IPv6', () => {
    expect(ipBucket({ ip: '::ffff:203.0.113.5' })).toBe('203.0.113.5');
  });

  it('collapses every address in an IPv6 /64 to one bucket', () => {
    // A residential IPv6 allocation is typically a whole /64. Keying on the full
    // address would hand an attacker 2^64 free buckets per subscriber.
    const first = ipBucket({ ip: '2001:db8:85a3:1111:0000:0000:0000:0001' });
    const second = ipBucket({ ip: '2001:db8:85a3:1111:ffff:ffff:ffff:ffff' });

    expect(first).toBe(second);
    expect(first).toBe('2001:db8:85a3:1111::/64');
  });

  it('keeps distinct /64s in distinct buckets', () => {
    expect(ipBucket({ ip: '2001:db8:85a3:1111::1' })).not.toBe(ipBucket({ ip: '2001:db8:85a3:2222::1' }));
  });

  it('does not throw when the address is unavailable', () => {
    expect(ipBucket({})).toBe('');
  });
});
