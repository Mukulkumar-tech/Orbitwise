import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const serverRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

dotenv.config({ path: path.join(serverRoot, '.env') });

const str = (key, fallback = '') => process.env[key]?.trim() || fallback;
const num = (key, fallback) => {
  const parsed = Number(process.env[key]);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const NODE_ENV = str('NODE_ENV', 'development');
const isProd = NODE_ENV === 'production';

export const env = {
  NODE_ENV,
  isProd,
  isDev: NODE_ENV === 'development',
  isTest: NODE_ENV === 'test',

  PORT: num('PORT', 5000),
  CLIENT_URL: str('CLIENT_URL', 'http://localhost:5173'),
  SERVER_ROOT: serverRoot,

  MONGODB_URI: str('MONGODB_URI'),

  JWT_ACCESS_SECRET: str('JWT_ACCESS_SECRET', 'dev-only-access-secret-change-me'),
  JWT_REFRESH_SECRET: str('JWT_REFRESH_SECRET', 'dev-only-refresh-secret-change-me'),
  JWT_ACCESS_EXPIRES: str('JWT_ACCESS_EXPIRES', '15m'),
  JWT_REFRESH_EXPIRES: str('JWT_REFRESH_EXPIRES', '7d'),

  /**
   * SameSite policy for the refresh cookie.
   *
   * 'lax' is correct when the client and API share a domain (including dev,
   * where the Vite proxy makes them same-origin). If they are deployed to
   * different domains — client on Vercel, API on Render — the browser will not
   * attach a Lax cookie to the cross-site refresh call, and every session dies
   * on reload with no visible error. That deployment needs 'none' + HTTPS.
   */
  COOKIE_SAMESITE: str('COOKIE_SAMESITE', 'lax').toLowerCase(),

  /**
   * bcrypt work factor.
   *
   * 12 is the production target. Tests drop to 4 because bcryptjs is pure
   * JavaScript and roughly 3–5× slower than the native binding: at cost 12 each
   * hash costs ~600ms, and a suite that creates dozens of users spends minutes
   * doing nothing but key stretching. The work factor protects stored passwords,
   * not test fixtures. assertProductionEnv() enforces the floor where it counts.
   */
  BCRYPT_ROUNDS: num('BCRYPT_ROUNDS', NODE_ENV === 'test' ? 4 : 12),

  STORAGE_PROVIDER: str('STORAGE_PROVIDER', 'local'),
  UPLOAD_DIR: path.resolve(serverRoot, str('UPLOAD_DIR', 'uploads')),
  MAX_UPLOAD_MB: num('MAX_UPLOAD_MB', 10),

  EMAIL_PROVIDER: str('EMAIL_PROVIDER', 'console'),
  EMAIL_FROM: str('EMAIL_FROM', 'Orbitwise <no-reply@orbitwise.dev>'),
  SMTP_HOST: str('SMTP_HOST'),
  SMTP_PORT: num('SMTP_PORT', 587),
  SMTP_USER: str('SMTP_USER'),
  SMTP_PASS: str('SMTP_PASS'),

  AI_PROVIDER: str('AI_PROVIDER', 'rules'),
  ANTHROPIC_API_KEY: str('ANTHROPIC_API_KEY'),
  AI_MODEL: str('AI_MODEL', 'claude-sonnet-5'),

  RATE_LIMIT_WINDOW_MINUTES: num('RATE_LIMIT_WINDOW_MINUTES', 15),
  RATE_LIMIT_MAX: num('RATE_LIMIT_MAX', 600),
  AUTH_RATE_LIMIT_MAX: num('AUTH_RATE_LIMIT_MAX', 20),
};

/**
 * Fails fast in production on config that is safe to default in development but
 * dangerous to default in production. A server that boots with a placeholder JWT
 * secret is worse than a server that refuses to boot.
 */
export function assertProductionEnv() {
  if (!isProd) return;

  const problems = [];
  if (!env.MONGODB_URI) problems.push('MONGODB_URI is required in production (the in-memory fallback is dev-only).');
  if (env.JWT_ACCESS_SECRET.startsWith('dev-only')) problems.push('JWT_ACCESS_SECRET is still the development placeholder.');
  if (env.JWT_REFRESH_SECRET.startsWith('dev-only')) problems.push('JWT_REFRESH_SECRET is still the development placeholder.');
  if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) problems.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ.');

  if (env.BCRYPT_ROUNDS < 12) {
    problems.push(`BCRYPT_ROUNDS must be at least 12 in production (got ${env.BCRYPT_ROUNDS}).`);
  }

  if (!['lax', 'strict', 'none'].includes(env.COOKIE_SAMESITE)) {
    problems.push(`COOKIE_SAMESITE must be one of lax | strict | none (got "${env.COOKIE_SAMESITE}").`);
  }
  // Browsers reject SameSite=None without Secure, which would silently break
  // every session rather than fail loudly here.
  if (env.COOKIE_SAMESITE === 'none' && !isProd) {
    problems.push('COOKIE_SAMESITE=none requires HTTPS, which this configuration does not guarantee.');
  }

  if (problems.length) {
    throw new Error(`Invalid production configuration:\n  - ${problems.join('\n  - ')}`);
  }
}

export default env;
