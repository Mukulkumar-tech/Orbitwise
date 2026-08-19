import authService from '../services/authService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created } from '../utils/apiResponse.js';
import {
  REFRESH_COOKIE,
  SESSION_HINT_COOKIE,
  refreshCookieOptions,
  sessionHintCookieOptions,
} from '../utils/tokens.js';

/**
 * Splits an issued session between transports: the refresh token goes into an
 * httpOnly cookie the client cannot read, and only the short-lived access token
 * is returned in the body for the client to hold in memory.
 *
 * The session hint rides alongside so the client can tell, without a network
 * call, that attempting a refresh is worthwhile.
 */
const sendSession = (res, { user, accessToken, refreshToken }, send = ok) => {
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  res.cookie(SESSION_HINT_COOKIE, '1', sessionHintCookieOptions());
  return send(res, { user, accessToken });
};

const clientMeta = (req) => req.get('user-agent') ?? '';

export const register = asyncHandler(async (req, res) => {
  const session = await authService.register(req.body, clientMeta(req));
  return sendSession(res, session, created);
});

export const login = asyncHandler(async (req, res) => {
  const session = await authService.login(req.body, clientMeta(req));
  return sendSession(res, session);
});

export const refresh = asyncHandler(async (req, res) => {
  const session = await authService.refresh(req.cookies?.[REFRESH_COOKIE], clientMeta(req));
  return sendSession(res, session);
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies?.[REFRESH_COOKIE]);

  // Clearing must reuse the same path/flags the cookies were set with, or the
  // browser keeps the originals and the "logged out" client stays refreshable.
  // maxAge is dropped so express's expiry-in-the-past takes effect.
  const { maxAge: _rtMaxAge, ...refreshOptions } = refreshCookieOptions();
  const { maxAge: _hintMaxAge, ...hintOptions } = sessionHintCookieOptions();

  res.clearCookie(REFRESH_COOKIE, refreshOptions);
  res.clearCookie(SESSION_HINT_COOKIE, hintOptions);

  return ok(res, { message: 'Signed out' });
});

export const me = asyncHandler(async (req, res) => ok(res, { user: req.user.toJSON() }));

export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await authService.verifyEmail(req.params.token);
  return ok(res, { user, message: 'Email verified. Welcome to Orbitwise.' });
});

export const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerification(req.body.email);
  return ok(res, { message: 'If that address needs verifying, a new link is on its way.' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  // Deliberately identical whether or not the account exists.
  return ok(res, { message: 'If an account exists for that email, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const session = await authService.resetPassword(req.body, clientMeta(req));
  return sendSession(res, session);
});

export const changePassword = asyncHandler(async (req, res) => {
  const session = await authService.changePassword(
    { userId: req.user._id, ...req.body },
    clientMeta(req)
  );
  return sendSession(res, session);
});
