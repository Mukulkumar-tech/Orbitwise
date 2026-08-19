import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import { REFRESH_COOKIE } from '../utils/tokens.js';

export const agent = () => request(app);

export const VALID_PASSWORD = 'orbitwise2027';

/** Extracts the refresh cookie from a Set-Cookie header array. */
export const refreshCookieFrom = (response) => {
  const raw = response.headers['set-cookie'] ?? [];
  const found = raw.find((cookie) => cookie.startsWith(`${REFRESH_COOKIE}=`));
  return found ? found.split(';')[0] : null;
};

export const rawRefreshCookie = (response) =>
  (response.headers['set-cookie'] ?? []).find((cookie) => cookie.startsWith(`${REFRESH_COOKIE}=`)) ?? '';

/** Registers a student through the real endpoint and returns its session. */
export async function registerStudent(overrides = {}) {
  const payload = {
    name: 'Aarav Sharma',
    email: `aarav.${Math.random().toString(36).slice(2, 10)}@orbitwise.dev`,
    password: VALID_PASSWORD,
    ...overrides,
  };

  const response = await agent().post('/api/auth/register').send(payload);

  return {
    payload,
    response,
    accessToken: response.body.data?.accessToken,
    refreshCookie: refreshCookieFrom(response),
    user: response.body.data?.user,
  };
}

/**
 * Creates a user with an elevated role directly in the database.
 *
 * Registration deliberately refuses to assign roles, so seeding a counsellor or
 * admin for an authorization test has to bypass the public endpoint — exactly as
 * the admin portal will.
 */
export async function createUserWithRole(role, overrides = {}) {
  const user = await User.create({
    name: `${role} user`,
    email: `${role}.${Math.random().toString(36).slice(2, 10)}@orbitwise.dev`,
    password: VALID_PASSWORD,
    role,
    isVerified: true,
    ...overrides,
  });

  const login = await agent()
    .post('/api/auth/login')
    .send({ email: user.email, password: VALID_PASSWORD });

  return { user, accessToken: login.body.data.accessToken, refreshCookie: refreshCookieFrom(login) };
}
