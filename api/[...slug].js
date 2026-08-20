import mongoose from 'mongoose';

import app from '../server/app.js';
import { env, assertProductionEnv } from '../server/config/env.js';

/**
 * Vercel serverless entry point.
 *
 * `server/server.js` is deliberately bypassed: it calls `app.listen()`, which
 * needs a long-lived process that serverless does not have. The Express app is
 * already a plain request handler, so it can be exported directly.
 *
 * A catch-all filename (`[...slug].js`) rather than `index.js` so that Vercel
 * routes every path under /api here with the original URL intact — Express then
 * does its own routing, exactly as it does locally.
 */

/**
 * Connection cache.
 *
 * A warm serverless instance is reused across invocations, so connecting per
 * request would open a new pool every time and exhaust the Atlas connection
 * limit within minutes. Caching on globalThis survives module re-evaluation,
 * which module-level `let` does not guarantee.
 */
const cache = (globalThis.__orbitwiseMongo ??= { conn: null, promise: null });

async function connect() {
  if (cache.conn && mongoose.connection.readyState === 1) return cache.conn;

  if (!cache.promise) {
    if (!env.MONGODB_URI) {
      throw new Error(
        'MONGODB_URI is not set. Serverless cannot run the in-memory database — it spawns a mongod ' +
          'binary and needs a persistent process. Point MONGODB_URI at a MongoDB Atlas cluster.'
      );
    }

    cache.promise = mongoose
      .connect(env.MONGODB_URI, {
        // Small pool: every warm instance holds one, and Atlas caps total
        // connections. A large pool per instance is how a free tier falls over.
        maxPoolSize: 5,
        minPoolSize: 0,
        // Fail fast rather than hanging until the platform timeout, so a bad URI
        // surfaces as a clear 500 instead of a request that never returns.
        serverSelectionTimeoutMS: 8000,
        // Without this, a query issued while disconnected buffers silently
        // instead of erroring — which reads as a hung endpoint.
        bufferCommands: false,
      })
      .then((m) => m.connection);
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

/**
 * Normalizes the request path to what Express expects.
 *
 * Vercel's catch-all routing may deliver the path with the /api prefix intact
 * ("/api/public/home") or stripped ("/public/home"), depending on how the
 * function was matched. Every Express router here is mounted under /api, so a
 * stripped prefix 404s the entire API while the static frontend keeps working —
 * which looks like "the backend is down" rather than a routing mismatch.
 *
 * Handling both shapes removes the ambiguity instead of betting on one.
 */
function normalizeUrl(req) {
  const url = req.url || '/';
  if (url === '/api' || url.startsWith('/api/') || url.startsWith('/api?')) return url;
  return '/api' + (url.startsWith('/') ? url : '/' + url);
}

export default async function handler(req, res) {
  req.url = normalizeUrl(req);

  try {
    assertProductionEnv();
    await connect();
  } catch (error) {
    // Configuration and connection failures are reported in the platform's own
    // envelope shape, so a misconfigured deployment is diagnosable from the
    // response rather than only from the function logs.
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        message: env.isProd ? 'Service temporarily unavailable' : error.message,
      })
    );
    return;
  }

  return app(req, res);
}
