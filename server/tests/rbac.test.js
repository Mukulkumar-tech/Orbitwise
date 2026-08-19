import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { protect, authorize } from '../middleware/auth.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { ok } from '../utils/apiResponse.js';
import { ROLES } from '../constants/index.js';
import User from '../models/User.js';
import { seedUsers, DEMO_PASSWORD, DEMO_USERS } from '../seed/seedUsers.js';
import { agent, createUserWithRole } from './helpers.js';

/**
 * Minimal app exposing one route behind protect + authorize.
 *
 * The real routers have no role-restricted endpoints yet — those arrive with the
 * admin portal — so the middleware contract is exercised directly rather than
 * left unverified until then. `authorize` is the whole basis of the permission
 * model, and it should not ship on the strength of having been read.
 */
const guardedApp = (...roles) => {
  const app = express();
  app.use(express.json());
  app.get('/guarded', protect, authorize(...roles), (req, res) => ok(res, { role: req.user.role }));
  app.use(errorHandler);
  return app;
};

const ALL_ROLES = [ROLES.STUDENT, ROLES.COUNSELLOR, ROLES.ADMIN];

describe('authorize() role matrix', () => {
  it('lets exactly the right roles through every guard combination', async () => {
    // One token per role, reused across all four guards. Creating fresh users per
    // case would mean twelve bcrypt hashes to test pure middleware logic.
    const tokens = {};
    for (const role of ALL_ROLES) {
      tokens[role] = (await createUserWithRole(role)).accessToken;
    }

    const guards = [
      { allowed: [ROLES.ADMIN], label: 'admin-only' },
      { allowed: [ROLES.COUNSELLOR], label: 'counsellor-only' },
      { allowed: [ROLES.COUNSELLOR, ROLES.ADMIN], label: 'staff-only' },
      { allowed: ALL_ROLES, label: 'any-signed-in' },
    ];

    for (const { allowed, label } of guards) {
      const app = guardedApp(...allowed);

      for (const role of ALL_ROLES) {
        const response = await request(app).get('/guarded').set('Authorization', `Bearer ${tokens[role]}`);
        const shouldPass = allowed.includes(role);

        expect(response.status, `${role} against ${label}`).toBe(shouldPass ? 200 : 403);
        if (shouldPass) expect(response.body.data.role).toBe(role);
      }
    }
  });

  it('returns 401 rather than 403 when no token is supplied', async () => {
    // The distinction matters to the client: 401 is fixable by signing in,
    // 403 is not, and RoleRoute routes them to different screens.
    const response = await request(guardedApp(ROLES.ADMIN)).get('/guarded');
    expect(response.status).toBe(401);
  });

  it('denies a deactivated account even with a valid token and correct role', async () => {
    const { user, accessToken } = await createUserWithRole(ROLES.ADMIN);
    await User.findByIdAndUpdate(user._id, { isActive: false });

    const response = await request(guardedApp(ROLES.ADMIN))
      .get('/guarded')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(403);
  });

  it('reflects a role change immediately, without waiting for token expiry', async () => {
    // protect re-reads the user on every request, so demoting someone takes
    // effect at once instead of lingering for the token's remaining 15 minutes.
    const { user, accessToken } = await createUserWithRole(ROLES.ADMIN);
    const app = guardedApp(ROLES.ADMIN);

    await request(app).get('/guarded').set('Authorization', `Bearer ${accessToken}`).expect(200);

    await User.findByIdAndUpdate(user._id, { role: ROLES.STUDENT });

    const afterDemotion = await request(app).get('/guarded').set('Authorization', `Bearer ${accessToken}`);
    expect(afterDemotion.status).toBe(403);
  });
});

describe('demo account seeding', () => {
  it('creates one working login per role', async () => {
    await seedUsers();

    for (const spec of DEMO_USERS) {
      const login = await agent()
        .post('/api/auth/login')
        .send({ email: spec.email, password: DEMO_PASSWORD });

      expect(login.status, `${spec.email} should sign in`).toBe(200);
      expect(login.body.data.user.role).toBe(spec.role);
      // Pre-verified, or the credentials would be unusable without an inbox.
      expect(login.body.data.user.isVerified).toBe(true);
    }
  });

  it('hashes seeded passwords through the model hook', async () => {
    await seedUsers();
    const stored = await User.findOne({ email: 'admin@orbitwise.dev' }).select('+password');

    // Seeding via insertMany/updateOne would bypass the pre-save hook and store
    // this in plaintext, which no login would then match.
    expect(stored.password).not.toBe(DEMO_PASSWORD);
    expect(stored.password).toMatch(/^\$2[aby]\$\d{2}\$/);
  });

  it('is idempotent and does not duplicate accounts', async () => {
    await seedUsers();
    const second = await seedUsers();

    expect(second.every((user) => user.status === 'kept')).toBe(true);
    expect(await User.countDocuments({ email: { $in: DEMO_USERS.map((u) => u.email) } })).toBe(
      DEMO_USERS.length
    );
  });

  it('recreates accounts on --force with a working password', async () => {
    await seedUsers();
    await User.findOneAndUpdate({ email: 'student@orbitwise.dev' }, { name: 'Edited Locally' });

    const forced = await seedUsers({ force: true });
    expect(forced.every((user) => user.status === 'replaced')).toBe(true);

    const restored = await User.findOne({ email: 'student@orbitwise.dev' });
    expect(restored.name).toBe('Aarav Sharma');

    const login = await agent()
      .post('/api/auth/login')
      .send({ email: 'student@orbitwise.dev', password: DEMO_PASSWORD });
    expect(login.status).toBe(200);
  });
});
