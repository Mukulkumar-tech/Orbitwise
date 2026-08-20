import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import { env } from './config/env.js';
import logger from './config/logger.js';
import routes from './routes/index.js';
import healthRoutes from './routes/healthRoutes.js';
import sanitize from './middleware/sanitize.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import ApiError from './utils/ApiError.js';

const app = express();

// Behind a proxy (Render/Railway/nginx) req.ip must reflect the real client,
// otherwise every rate limit buckets the whole internet into one key.
if (env.isProd) app.set('trust proxy', 1);

app.disable('x-powered-by');

// ─── Security ───────────────────────────────────────────────────────────────
app.use(
  helmet({
    // The API serves JSON and streamed private files; it never renders HTML,
    // so CSP belongs on the client host, not here.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
  })
);

const allowedOrigins = new Set(
  [...env.CLIENT_ORIGINS, ...(env.isProd ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173'])].filter(Boolean)
);

app.use(
  cors({
    origin(origin, callback) {
      // Same-origin requests and server-to-server tools send no Origin header.
      // Normalized both sides: a configured trailing slash would otherwise never
      // match an Origin header, which never has one.
      if (!origin || allowedOrigins.has(origin.replace(/[/]+$/, ''))) return callback(null, true);

      // Logged, not just rejected. Without this the only evidence is a 403 in
      // someone's browser, and the allowed set is invisible from outside.
      logger.warn(`CORS rejected origin "${origin}". Allowed: ${[...allowedOrigins].join(', ') || '(none configured)'}`);
      // An ApiError (not a bare Error) so the rejection surfaces as a clean 403
      // through the central handler rather than an opaque 500.
      return callback(ApiError.forbidden(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true, // required — the refresh token rides in an httpOnly cookie
  })
);

// ─── Parsing ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(compression());
app.use(sanitize);

// ─── Observability ──────────────────────────────────────────────────────────
if (!env.isTest) {
  app.use(morgan(env.isProd ? 'combined' : 'dev', { skip: (req) => req.originalUrl === '/api/health' }));
}

// ─── Routes ─────────────────────────────────────────────────────────────────
// Health sits ahead of the limiter so infrastructure probes are never throttled.
app.use('/api', healthRoutes);
app.use('/api', globalLimiter, routes);

// NOTE: there is deliberately no `express.static` for uploads. Student
// documents are private and are streamed only through an authenticated,
// ownership-checked endpoint (GET /api/documents/:id/file).

// ─── Errors ─────────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
