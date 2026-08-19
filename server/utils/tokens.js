import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * One-way hash for anything stored server-side that a client also holds:
 * refresh tokens, email-verification tokens, password-reset tokens.
 *
 * These are already high-entropy random values, so a fast digest is correct —
 * bcrypt would add cost without adding meaningful resistance. Passwords, which
 * are low-entropy and human-chosen, use bcrypt instead (see models/User.js).
 */
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/** Cryptographically random URL-safe token for email links. */
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

/**
 * `tv` carries the user's token generation. `protect` compares it against the
 * stored counter, so a password change invalidates every earlier token exactly.
 */
export const signAccessToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role, tv: user.tokenVersion }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
  });

export const signRefreshToken = (user) =>
  jwt.sign({ sub: user._id.toString(), jti: randomToken(16) }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
  });

export const verifyAccessToken = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET);

export const verifyRefreshToken = (token) => jwt.verify(token, env.JWT_REFRESH_SECRET);

export const REFRESH_COOKIE = 'orbitwise_rt';

/**
 * Readable companion to the refresh cookie. Carries no data — its presence is
 * the entire signal.
 *
 * The refresh token itself is httpOnly, so the client cannot tell whether a
 * session might exist and has to attempt a refresh on every single page load.
 * On the public marketing site that means an authentication round-trip for every
 * anonymous visitor, plus a 401 in their console. This flag lets the client skip
 * the attempt when there is provably nothing to restore.
 *
 * Set and cleared in lockstep with the refresh cookie, with the same lifetime,
 * so the two cannot drift apart.
 */
export const SESSION_HINT_COOKIE = 'orbitwise_session';

const durationToMs = (value) => {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return Number(match[1]) * multipliers[match[2]];
};

export const refreshTokenMaxAge = () => durationToMs(env.JWT_REFRESH_EXPIRES);

/**
 * Cookie options for the refresh token.
 *
 * httpOnly  — unreadable from JavaScript, so XSS cannot exfiltrate it.
 * sameSite  — 'lax' blocks cross-site POST CSRF while surviving normal
 *             navigation. Configurable because a split-domain deployment
 *             requires 'none'; see COOKIE_SAMESITE in config/env.js.
 * secure    — forced on when sameSite is 'none', which browsers require.
 * path      — scoped to the endpoints that use it, so the cookie is not
 *             attached to every unrelated API call.
 */
export const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.isProd || env.COOKIE_SAMESITE === 'none',
  sameSite: env.COOKIE_SAMESITE,
  maxAge: refreshTokenMaxAge(),
  path: '/api/auth',
});

/**
 * Options for the session hint. Mirrors the refresh cookie's lifetime and
 * SameSite policy, but is readable by JavaScript and scoped to the whole site
 * so any page can check it before deciding to attempt a refresh.
 */
export const sessionHintCookieOptions = () => ({
  httpOnly: false,
  secure: env.isProd || env.COOKIE_SAMESITE === 'none',
  sameSite: env.COOKIE_SAMESITE,
  maxAge: refreshTokenMaxAge(),
  path: '/',
});
