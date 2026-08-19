import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { ROLES } from '../constants/index.js';
import sendEmail from './email/index.js';
import { verifyEmailTemplate, resetPasswordTemplate, passwordChangedTemplate } from './email/templates.js';
import {
  hashToken,
  randomToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshTokenMaxAge,
} from '../utils/tokens.js';

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TTL_MS = 60 * 60 * 1000; //  1 hour

/**
 * A bcrypt hash of a throwaway value, compared against when no user matches a
 * login attempt. Without it, "unknown email" returns measurably faster than
 * "wrong password", which turns login into an account-enumeration oracle.
 *
 * Generated at boot rather than hardcoded so the digest is always a valid hash
 * for the installed bcrypt version, and always costs the same as a real compare.
 */
const DUMMY_HASH = bcrypt.hashSync('orbitwise-timing-equalizer', env.BCRYPT_ROUNDS);

/** Issues an access/refresh pair and records the refresh session on the user. */
async function issueSession(user, userAgent) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  user.addSession({
    tokenHash: hashToken(refreshToken),
    userAgent,
    expiresAt: new Date(Date.now() + refreshTokenMaxAge()),
  });
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
}

/** Creates a one-time email token: plaintext for the link, hash for storage. */
function createLinkToken() {
  const token = randomToken();
  return { token, tokenHash: hashToken(token) };
}

async function dispatchVerificationEmail(user) {
  const { token, tokenHash } = createLinkToken();

  user.verifyTokenHash = tokenHash;
  user.verifyTokenExpires = new Date(Date.now() + VERIFY_TTL_MS);
  await user.save({ validateBeforeSave: false });

  await sendEmail({
    to: user.email,
    ...verifyEmailTemplate({ name: user.firstName, url: `${env.CLIENT_URL}/verify-email/${token}` }),
  });
}

export const authService = {
  /**
   * Registers a student.
   *
   * The role is hardcoded rather than taken from the request: accepting a role
   * from a public endpoint would let anyone POST `role: "admin"` and own the
   * platform. Counsellors and admins are created only from the admin portal.
   */
  async register({ name, email, password, phone }, userAgent) {
    const existing = await User.findOne({ email });
    if (existing) {
      throw ApiError.conflict('An account with this email already exists', {
        errors: { email: 'Already registered — try signing in instead' },
      });
    }

    const user = await User.create({ name, email, password, phone, role: ROLES.STUDENT });
    await dispatchVerificationEmail(user);

    const tokens = await issueSession(user, userAgent);
    return { user: user.toJSON(), ...tokens };
  },

  async login({ email, password }, userAgent) {
    const user = await User.findOne({ email }).select('+password +sessions');

    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      throw ApiError.unauthorized('Incorrect email or password');
    }

    const passwordMatches = await user.comparePassword(password);
    if (!passwordMatches) throw ApiError.unauthorized('Incorrect email or password');

    if (!user.isActive) {
      throw ApiError.forbidden('This account has been deactivated. Please contact support.');
    }

    user.lastLogin = new Date();
    const tokens = await issueSession(user, userAgent);

    return { user: user.toJSON(), ...tokens };
  },

  /**
   * Rotates a refresh token.
   *
   * The presented token's hash must match a stored session; on success that
   * session is replaced with a new one. Rotation means a stolen token is usable
   * at most once, and only until the legitimate client next refreshes.
   */
  async refresh(presentedToken, userAgent) {
    if (!presentedToken) throw ApiError.unauthorized('No session found');

    const payload = verifyRefreshToken(presentedToken); // throws → 401 via errorHandler
    const user = await User.findById(payload.sub).select('+sessions');
    if (!user || !user.isActive) throw ApiError.unauthorized('Session is no longer valid');

    const presentedHash = hashToken(presentedToken);
    const matched = user.sessions.find((session) => session.tokenHash === presentedHash);

    if (!matched) {
      // Valid signature but unknown session: already rotated, or revoked by a
      // logout or password change. Either way it is not a usable session.
      throw ApiError.unauthorized('Session expired, please sign in again');
    }

    user.sessions.pull(matched._id);
    const tokens = await issueSession(user, userAgent);

    return { user: user.toJSON(), ...tokens };
  },

  /** Revokes just the presented session, leaving other devices signed in. */
  async logout(presentedToken) {
    if (!presentedToken) return;

    let payload;
    try {
      payload = verifyRefreshToken(presentedToken);
    } catch {
      return; // An unparseable token has nothing to revoke.
    }

    const user = await User.findById(payload.sub).select('+sessions');
    if (!user) return;

    const presentedHash = hashToken(presentedToken);
    user.sessions = user.sessions.filter((session) => session.tokenHash !== presentedHash);
    await user.save({ validateBeforeSave: false });
  },

  async verifyEmail(token) {
    const user = await User.findOne({
      verifyTokenHash: hashToken(token),
      verifyTokenExpires: { $gt: new Date() },
    }).select('+verifyTokenHash +verifyTokenExpires');

    if (!user) throw ApiError.badRequest('This verification link is invalid or has expired');

    user.isVerified = true;
    user.verifyTokenHash = null;
    user.verifyTokenExpires = null;
    await user.save({ validateBeforeSave: false });

    return user.toJSON();
  },

  async resendVerification(email) {
    const user = await User.findOne({ email }).select('+verifyTokenHash +verifyTokenExpires');
    // Silent on unknown or already-verified addresses — the response must not
    // reveal which emails have accounts.
    if (user && !user.isVerified) await dispatchVerificationEmail(user);
  },

  async forgotPassword(email) {
    const user = await User.findOne({ email }).select('+resetTokenHash +resetTokenExpires');
    if (!user || !user.isActive) return; // Same reason: no enumeration.

    const { token, tokenHash } = createLinkToken();
    user.resetTokenHash = tokenHash;
    user.resetTokenExpires = new Date(Date.now() + RESET_TTL_MS);
    await user.save({ validateBeforeSave: false });

    await sendEmail({
      to: user.email,
      ...resetPasswordTemplate({ name: user.firstName, url: `${env.CLIENT_URL}/reset-password/${token}` }),
    });
  },

  /**
   * Completes a password reset and signs out every device.
   *
   * A reset is the remedy for a suspected compromise, so it must revoke all
   * existing sessions — otherwise an attacker who already has a refresh token
   * keeps their access after the victim "fixes" the account.
   */
  async resetPassword({ token, password }, userAgent) {
    const user = await User.findOne({
      resetTokenHash: hashToken(token),
      resetTokenExpires: { $gt: new Date() },
    }).select('+resetTokenHash +resetTokenExpires +sessions +password');

    if (!user) throw ApiError.badRequest('This reset link is invalid or has expired');

    user.password = password; // pre-save hook hashes it and stamps passwordChangedAt
    user.resetTokenHash = null;
    user.resetTokenExpires = null;
    user.sessions = [];
    await user.save();

    await sendEmail({ to: user.email, ...passwordChangedTemplate({ name: user.firstName }) });

    const tokens = await issueSession(user, userAgent);
    return { user: user.toJSON(), ...tokens };
  },

  async changePassword({ userId, currentPassword, newPassword }, userAgent) {
    const user = await User.findById(userId).select('+password +sessions');
    if (!user) throw ApiError.notFound('User not found');

    const matches = await user.comparePassword(currentPassword);
    if (!matches) {
      throw ApiError.badRequest('Your current password is incorrect', {
        errors: { currentPassword: 'Incorrect password' },
      });
    }

    user.password = newPassword;
    user.sessions = [];
    await user.save();

    await sendEmail({ to: user.email, ...passwordChangedTemplate({ name: user.firstName }) });

    const tokens = await issueSession(user, userAgent);
    return { user: user.toJSON(), ...tokens };
  },
};

export default authService;
