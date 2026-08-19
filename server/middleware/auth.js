import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/tokens.js';

const bearerToken = (req) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
};

/**
 * Requires a valid access token and attaches the live user to `req.user`.
 *
 * The user is re-read from the database on every request rather than trusted
 * from the token payload, so a deactivated account or a role change takes
 * effect immediately instead of lingering for the token's remaining lifetime.
 */
export const protect = asyncHandler(async (req, _res, next) => {
  const token = bearerToken(req);
  if (!token) throw ApiError.unauthorized('Please sign in to continue');

  const payload = verifyAccessToken(token); // throws → 401 via errorHandler

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('This account no longer exists');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');
  if (user.isTokenStale(payload.tv)) {
    throw ApiError.unauthorized('Your password was changed. Please sign in again.');
  }

  req.user = user;
  next();
});

/**
 * Restricts a route to specific roles. Always used after `protect`.
 *
 *   router.post('/', protect, authorize(ROLES.ADMIN), createCourse)
 */
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized('Please sign in to continue'));
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Your account does not have access to this resource'));
    }
    next();
  };

/**
 * Attaches `req.user` when a valid token is present, but never rejects.
 *
 * For endpoints that serve everyone yet personalize for signed-in students —
 * the public course catalogue showing match scores, for instance.
 */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = bearerToken(req);
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (user?.isActive && !user.isTokenStale(payload.tv)) req.user = user;
  } catch {
    // A bad token on an optional route is simply an anonymous request.
  }
  next();
});
