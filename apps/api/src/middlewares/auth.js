import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Verifies the access token from the Authorization header (Bearer scheme).
 * Access tokens are short-lived (default 15m) and NEVER stored in a cookie —
 * they live only in the frontend's memory — so this middleware only ever
 * reads the header, never req.cookies.
 *
 * On success, attaches req.user = { id, role } from the verified token AND
 * re-confirms the user still exists and is active, so a deactivated admin's
 * still-valid access token is rejected within at most one token lifetime.
 */
export const requireAuth = asyncHandler(async function requireAuth(req, _res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or malformed Authorization header');
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw ApiError.unauthorized('Missing access token');
  }

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Access token expired');
    }
    throw ApiError.unauthorized('Invalid access token');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Account is no longer active');
  }

  req.user = { id: user._id.toString(), role: user.role };
  next();
});

/**
 * Authorization middleware factory. Must run AFTER requireAuth.
 * Kept generic (accepts ...roles) so adding 'editor'/'agent' later is a
 * one-line change at the route, not a rewrite of this middleware.
 * @param  {...string} allowedRoles
 */
export function requireRole(...allowedRoles) {
  return function requireRoleMiddleware(req, _res, next) {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden());
    }
    next();
  };
}
