import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const windowMs = env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;

/**
 * Collapses a client address to a single rate-limit bucket.
 *
 * IPv4 is used as-is. IPv6 is truncated to its /64 prefix, because a residential
 * IPv6 allocation is typically a whole /64 — so keying on the full address would
 * let an attacker rotate through billions of "distinct clients" and never hit a
 * limit. The /64 is the smallest unit that reliably identifies one subscriber.
 *
 * express-rate-limit ships an `ipKeyGenerator` helper that does this, but only
 * from v8; this project is on 7.5.x, so it is implemented here.
 */
export const ipBucket = (req) => {
  const ip = req.ip ?? '';
  if (!ip.includes(':')) return ip; // IPv4, or empty

  // IPv4-mapped IPv6 (::ffff:203.0.113.5) identifies a single host already.
  const mapped = /::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip);
  if (mapped) return mapped[1];

  const hextets = ip.split(':');
  return `${hextets.slice(0, 4).join(':')}::/64`;
};

const shared = {
  windowMs,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: ipBucket,
  // Rate limiting is a load-shedding tool, not a test obstacle.
  skip: () => env.isTest,
  handler: (_req, res) =>
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please slow down and try again shortly.',
    }),
};

/** Baseline ceiling for the whole API. */
export const globalLimiter = rateLimit({ ...shared, max: env.RATE_LIMIT_MAX });

/**
 * Credential endpoints (login, register, forgot/reset password). Tight, because
 * these are the ones worth brute-forcing. Keyed by subnet *and* submitted email
 * so one noisy NAT cannot lock out every user behind it.
 */
export const authLimiter = rateLimit({
  ...shared,
  max: env.AUTH_RATE_LIMIT_MAX,
  keyGenerator: (req) => `${ipBucket(req)}|${String(req.body?.email ?? '').toLowerCase()}`,
  handler: (_req, res) =>
    res.status(429).json({
      success: false,
      message: 'Too many attempts. Please wait a few minutes before trying again.',
    }),
});

/** Uploads are expensive in bandwidth and disk. */
export const uploadLimiter = rateLimit({ ...shared, max: 60 });

/** AI chat turns are the most expensive request the platform can serve. */
export const aiLimiter = rateLimit({ ...shared, windowMs: 60 * 1000, max: 20 });
