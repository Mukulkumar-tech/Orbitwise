import { Router } from 'express';
import mongoose from 'mongoose';

import { ok } from '../utils/apiResponse.js';
import { isEphemeral } from '../config/db.js';
import { env } from '../config/env.js';

const router = Router();

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

/**
 * Liveness + dependency check.
 *
 * Mounted ahead of the global rate limiter: a load balancer polling this every
 * second would otherwise consume the shared quota and eventually be told 429,
 * which reads as "service unhealthy" and can trigger a needless restart loop.
 *
 * Unauthenticated by design, and deliberately free of anything sensitive.
 */
router.get('/health', (_req, res) =>
  ok(res, {
    status: 'ok',
    service: 'orbitwise-api',
    environment: env.NODE_ENV,
    uptimeSeconds: Math.round(process.uptime()),
    database: {
      state: DB_STATES[mongoose.connection.readyState] ?? 'unknown',
      ephemeral: isEphemeral(),
    },
    /**
     * Only adapters that actually exist as code are listed. Reporting a
     * configured-but-unbuilt provider would claim a capability the server does
     * not have, which is exactly the wrong thing for a diagnostic endpoint to do.
     * Storage lands in Phase 10, the AI provider after it.
     */
    adapters: {
      email: env.EMAIL_PROVIDER,
    },
    timestamp: new Date().toISOString(),
  })
);

export default router;
