import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import User from '../models/User.js';
import { ROLES } from '../constants/index.js';
import { agent, registerStudent, rawRefreshCookie, refreshCookieFrom, VALID_PASSWORD } from './helpers.js';

describe('POST /api/auth/register', () => {
  it('creates a student and issues a session', async () => {
    const { response, user, accessToken, refreshCookie } = await registerStudent();

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(user.role).toBe(ROLES.STUDENT);
    expect(accessToken).toBeTypeOf('string');
    expect(refreshCookie).toBeTruthy();
  });

  it('never leaks secrets in the response body', async () => {
    const { response } = await registerStudent();
    const serialized = JSON.stringify(response.body);

    for (const secret of ['password', 'sessions', 'verifyTokenHash', 'resetTokenHash', 'passwordChangedAt']) {
      expect(serialized).not.toContain(secret);
    }
  });

  it('sets the refresh cookie HttpOnly, SameSite=Lax and scoped to /api/auth', async () => {
    const { response } = await registerStudent();
    const cookie = rawRefreshCookie(response);

    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\/api\/auth/i);
  });

  it('ignores a role supplied by the client', async () => {
    // The single most damaging thing a public registration endpoint can get
    // wrong: trusting a role from the request body.
    const { user } = await registerStudent({ role: ROLES.ADMIN });
    expect(user.role).toBe(ROLES.STUDENT);

    const stored = await User.findOne({ email: user.email });
    expect(stored.role).toBe(ROLES.STUDENT);
  });

  it('stores the password as a bcrypt hash, never plaintext', async () => {
    const { user } = await registerStudent();
    const stored = await User.findOne({ email: user.email }).select('+password');

    expect(stored.password).not.toBe(VALID_PASSWORD);
    expect(stored.password).toMatch(/^\$2[aby]\$\d{2}\$/);
  });

  it('rejects a duplicate email with a field-keyed error', async () => {
    const { payload } = await registerStudent();
    const response = await agent().post('/api/auth/register').send(payload);

    expect(response.status).toBe(409);
    expect(response.body.errors.email).toBeTruthy();
  });

  it('returns per-field validation errors', async () => {
    const response = await agent()
      .post('/api/auth/register')
      .send({ name: 'X', email: 'nope', password: 'short' });

    expect(response.status).toBe(400);
    expect(Object.keys(response.body.errors)).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });
});

describe('POST /api/auth/login', () => {
  it('signs in with correct credentials', async () => {
    const { payload } = await registerStudent();
    const response = await agent().post('/api/auth/login').send(payload);

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBeTypeOf('string');
  });

  it('gives an identical message for a wrong password and an unknown email', async () => {
    const { payload } = await registerStudent();

    const wrongPassword = await agent()
      .post('/api/auth/login')
      .send({ email: payload.email, password: 'wrongpassword1' });
    const unknownEmail = await agent()
      .post('/api/auth/login')
      .send({ email: 'ghost@orbitwise.dev', password: VALID_PASSWORD });

    // Distinguishable responses would turn login into an account-enumeration
    // oracle: "this email exists, keep guessing".
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  it('refuses a deactivated account', async () => {
    const { payload, user } = await registerStudent();
    await User.findByIdAndUpdate(user.id ?? user._id, { isActive: false });

    const response = await agent().post('/api/auth/login').send(payload);
    expect(response.status).toBe(403);
  });
});

describe('GET /api/auth/me', () => {
  it('requires a token', async () => {
    const response = await agent().get('/api/auth/me');
    expect(response.status).toBe(401);
  });

  it('rejects a malformed token', async () => {
    const response = await agent().get('/api/auth/me').set('Authorization', 'Bearer not.a.jwt');
    expect(response.status).toBe(401);
  });

  it('rejects a token signed with the wrong secret', async () => {
    const { user } = await registerStudent();
    const forged = jwt.sign({ sub: user._id, role: ROLES.ADMIN }, 'attacker-secret', { expiresIn: '15m' });

    const response = await agent().get('/api/auth/me').set('Authorization', `Bearer ${forged}`);
    expect(response.status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const { user } = await registerStudent();
    const expired = jwt.sign({ sub: user._id, role: ROLES.STUDENT }, env.JWT_ACCESS_SECRET, { expiresIn: '-1s' });

    const response = await agent().get('/api/auth/me').set('Authorization', `Bearer ${expired}`);
    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/expired/i);
  });

  it('reads the role from the database, not the token payload', async () => {
    // A token minted while the user was a student must not grant admin access
    // just because its payload claims otherwise. `tv: 0` matches the account's
    // current token generation so the request fails on role, not on staleness.
    const { user, accessToken } = await registerStudent();
    const tampered = jwt.sign({ sub: user._id, role: ROLES.ADMIN, tv: 0 }, env.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });

    const response = await agent().get('/api/auth/me').set('Authorization', `Bearer ${tampered}`);
    expect(response.status).toBe(200);
    expect(response.body.data.user.role).toBe(ROLES.STUDENT);
    expect(accessToken).toBeTruthy();
  });

  it('returns the signed-in user', async () => {
    const { accessToken, payload } = await registerStudent();
    const response = await agent().get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(payload.email);
  });
});

describe('POST /api/auth/refresh', () => {
  it('requires a refresh cookie', async () => {
    const response = await agent().post('/api/auth/refresh');
    expect(response.status).toBe(401);
  });

  it('rotates the token and rejects the old one', async () => {
    const { refreshCookie } = await registerStudent();

    const rotated = await agent().post('/api/auth/refresh').set('Cookie', refreshCookie);
    expect(rotated.status).toBe(200);

    const newCookie = refreshCookieFrom(rotated);
    expect(newCookie).not.toBe(refreshCookie);

    // Rotation is what limits the damage of a stolen refresh token: it works
    // once, and only until the real client refreshes.
    const replay = await agent().post('/api/auth/refresh').set('Cookie', refreshCookie);
    expect(replay.status).toBe(401);
  });

  it('keeps other devices signed in', async () => {
    const { payload, refreshCookie: deviceA } = await registerStudent();
    await agent().post('/api/auth/login').send(payload); // device B

    const stillAlive = await agent().post('/api/auth/refresh').set('Cookie', deviceA);
    expect(stillAlive.status).toBe(200);
  });
});

describe('session hint cookie', () => {
  it('is set alongside the refresh token and carries no data', async () => {
    const { response } = await registerStudent();
    const cookies = response.headers['set-cookie'] ?? [];
    const hint = cookies.find((cookie) => cookie.startsWith('orbitwise_session='));

    expect(hint).toBeTruthy();
    // Readable by JavaScript on purpose — its presence is the whole signal, so
    // it must never carry anything worth stealing.
    expect(hint).not.toMatch(/HttpOnly/i);
    expect(hint).toMatch(/^orbitwise_session=1;/);
    expect(hint).toMatch(/Path=\//i);
  });

  it('is cleared on logout so the client stops attempting refreshes', async () => {
    const { refreshCookie } = await registerStudent();
    const response = await agent().post('/api/auth/logout').set('Cookie', refreshCookie).expect(200);

    const cookies = response.headers['set-cookie'] ?? [];
    for (const name of ['orbitwise_rt', 'orbitwise_session']) {
      const cleared = cookies.find((cookie) => cookie.startsWith(`${name}=`));
      expect(cleared, `${name} should be cleared`).toBeTruthy();
      // An expiry in the past is how a cookie is deleted.
      expect(cleared).toMatch(/Expires=Thu, 01 Jan 1970/i);
    }
  });
});

describe('GET /api/health', () => {
  it('is reachable without authentication and reports dependencies', async () => {
    const response = await agent().get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.database.state).toBe('connected');
  });

  it('exposes nothing sensitive', async () => {
    const serialized = JSON.stringify((await agent().get('/api/health')).body);

    // A probe endpoint is unauthenticated, so it must not become a config leak.
    for (const secret of ['SECRET', 'mongodb://', 'password', 'ANTHROPIC']) {
      expect(serialized).not.toContain(secret);
    }
  });
});

describe('POST /api/auth/logout', () => {
  it('revokes only the presented session', async () => {
    const { payload, refreshCookie: deviceA } = await registerStudent();
    const deviceBLogin = await agent().post('/api/auth/login').send(payload);
    const deviceB = refreshCookieFrom(deviceBLogin);

    await agent().post('/api/auth/logout').set('Cookie', deviceB).expect(200);

    const revoked = await agent().post('/api/auth/refresh').set('Cookie', deviceB);
    expect(revoked.status).toBe(401);

    const untouched = await agent().post('/api/auth/refresh').set('Cookie', deviceA);
    expect(untouched.status).toBe(200);
  });
});

describe('email verification', () => {
  it('verifies with a valid token and rejects reuse', async () => {
    const { user } = await registerStudent();
    const stored = await User.findOne({ email: user.email }).select('+verifyTokenHash');
    expect(stored.isVerified).toBe(false);
    expect(stored.verifyTokenHash).toBeTruthy();

    // The plaintext token only ever exists in the email, so re-derive one the
    // same way the service does rather than reading it back out of the database.
    const { hashToken, randomToken } = await import('../utils/tokens.js');
    const plaintext = randomToken();
    stored.verifyTokenHash = hashToken(plaintext);
    stored.verifyTokenExpires = new Date(Date.now() + 60_000);
    await stored.save({ validateBeforeSave: false });

    const first = await agent().get(`/api/auth/verify-email/${plaintext}`);
    expect(first.status).toBe(200);
    expect((await User.findById(stored._id)).isVerified).toBe(true);

    const reuse = await agent().get(`/api/auth/verify-email/${plaintext}`);
    expect(reuse.status).toBe(400);
  });

  it('rejects an expired token', async () => {
    const { user } = await registerStudent();
    const { hashToken, randomToken } = await import('../utils/tokens.js');
    const plaintext = randomToken();

    await User.findOneAndUpdate(
      { email: user.email },
      { verifyTokenHash: hashToken(plaintext), verifyTokenExpires: new Date(Date.now() - 1000) }
    );

    const response = await agent().get(`/api/auth/verify-email/${plaintext}`);
    expect(response.status).toBe(400);
  });
});

describe('password reset', () => {
  it('responds identically for known and unknown emails', async () => {
    const { payload } = await registerStudent();

    const known = await agent().post('/api/auth/forgot-password').send({ email: payload.email });
    const unknown = await agent().post('/api/auth/forgot-password').send({ email: 'ghost@orbitwise.dev' });

    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(known.body.message).toBe(unknown.body.message);
  });

  it('resets the password and revokes every existing session', async () => {
    const { payload, refreshCookie } = await registerStudent();
    const { hashToken, randomToken } = await import('../utils/tokens.js');
    const plaintext = randomToken();

    await User.findOneAndUpdate(
      { email: payload.email },
      { resetTokenHash: hashToken(plaintext), resetTokenExpires: new Date(Date.now() + 60_000) }
    );

    const reset = await agent()
      .post('/api/auth/reset-password')
      .send({ token: plaintext, password: 'brandnewpass99' });
    expect(reset.status).toBe(200);

    // A reset is the remedy for a compromise, so pre-existing sessions must die.
    const oldSession = await agent().post('/api/auth/refresh').set('Cookie', refreshCookie);
    expect(oldSession.status).toBe(401);

    const oldPassword = await agent().post('/api/auth/login').send(payload);
    expect(oldPassword.status).toBe(401);

    const newPassword = await agent()
      .post('/api/auth/login')
      .send({ email: payload.email, password: 'brandnewpass99' });
    expect(newPassword.status).toBe(200);
  });

  it('rejects an invalid reset token', async () => {
    const response = await agent()
      .post('/api/auth/reset-password')
      .send({ token: 'a'.repeat(64), password: 'brandnewpass99' });

    expect(response.status).toBe(400);
  });
});

describe('POST /api/auth/change-password', () => {
  it('invalidates access tokens issued before the change', async () => {
    const { payload, accessToken } = await registerStudent();

    const changed = await agent()
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: payload.password, newPassword: 'anotherpass2027' });
    expect(changed.status).toBe(200);

    // Access tokens are stateless, so the tokenVersion counter is what closes
    // the window between a password change and natural token expiry. Asserted
    // immediately after the change, which is exactly the sub-second case a
    // timestamp comparison at JWT second-precision would let through.
    const stale = await agent().get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(stale.status).toBe(401);

    const fresh = await agent()
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${changed.body.data.accessToken}`);
    expect(fresh.status).toBe(200);
  });

  it('invalidates tokens even when the change lands in the same second', async () => {
    // Regression guard. The token and the password change happen back to back
    // here, so both share a JWT `iat` second. Only an exact generation counter
    // gets this right.
    const { payload, accessToken } = await registerStudent();

    await agent()
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: payload.password, newPassword: 'sameSecond2027x' })
      .expect(200);

    const stale = await agent().get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(stale.status).toBe(401);
  });

  it('bumps the token generation on a password reset too', async () => {
    const { payload, accessToken } = await registerStudent();
    const { hashToken, randomToken } = await import('../utils/tokens.js');
    const plaintext = randomToken();

    await User.findOneAndUpdate(
      { email: payload.email },
      { resetTokenHash: hashToken(plaintext), resetTokenExpires: new Date(Date.now() + 60_000) }
    );

    const reset = await agent()
      .post('/api/auth/reset-password')
      .send({ token: plaintext, password: 'resetbumped2027' });
    expect(reset.status).toBe(200);

    const stale = await agent().get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(stale.status).toBe(401);

    // The session handed back by the reset must itself be usable.
    const fresh = await agent()
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${reset.body.data.accessToken}`);
    expect(fresh.status).toBe(200);
  });

  it('rejects a wrong current password', async () => {
    const { accessToken } = await registerStudent();

    const response = await agent()
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'notmypassword1', newPassword: 'anotherpass2027' });

    expect(response.status).toBe(400);
    expect(response.body.errors.currentPassword).toBeTruthy();
  });
});

describe('error envelope', () => {
  it('returns the failure shape for unknown routes', async () => {
    const response = await agent().get('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBeTypeOf('string');
  });
});
