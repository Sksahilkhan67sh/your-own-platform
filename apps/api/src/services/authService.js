import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { ApiError } from '../utils/ApiError.js';
import { generateOpaqueToken, hashToken, generateTokenFamily } from '../utils/tokenCrypto.js';
import { logger } from '../config/logger.js';

const REFRESH_EXPIRES_MS = env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000;

function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

async function issueRefreshToken({ userId, family, userAgent, ip }) {
  const rawToken = generateOpaqueToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_MS);

  await RefreshToken.create({
    user: userId,
    tokenHash,
    family,
    userAgent,
    ip,
    expiresAt,
  });

  return { rawToken, expiresAt };
}

/**
 * Validates credentials, enforces account lockout, and issues a fresh
 * access + refresh token pair on success. Failed attempts increment a
 * per-account counter; exceeding the threshold locks the account
 * temporarily — this is the account-level brute-force defense that
 * complements the IP-based rate limiter at the route layer.
 */
export async function login({ email, password, userAgent, ip }) {
  const user = await User.findOne({ email }).select('+passwordHash');

  // Deliberately identical error for "no such user" and "wrong password" —
  // distinguishing them lets an attacker enumerate valid admin emails.
  const genericError = () => ApiError.unauthorized('Invalid email or password');

  if (!user) throw genericError();

  if (user.isLocked()) {
    throw new ApiError(
      423,
      'ACCOUNT_LOCKED',
      'This account is temporarily locked due to repeated failed login attempts. Please try again later.'
    );
  }

  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated.');

  const isValid = await user.comparePassword(password);

  if (!isValid) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= env.ACCOUNT_LOCK_THRESHOLD) {
      user.lockUntil = new Date(Date.now() + env.ACCOUNT_LOCK_DURATION_MIN * 60 * 1000);
      logger.warn({ userId: user._id.toString() }, 'Account locked after repeated failed logins');
    }
    await user.save();
    throw genericError();
  }

  // Success — reset lockout state.
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = signAccessToken(user);
  const family = generateTokenFamily();
  const { rawToken: refreshToken, expiresAt } = await issueRefreshToken({
    userId: user._id,
    family,
    userAgent,
    ip,
  });

  return {
    accessToken,
    refreshToken,
    refreshExpiresAt: expiresAt,
    user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
  };
}

/**
 * Rotates a refresh token: validates the presented token, issues a new
 * access + refresh pair, and revokes the old one.
 *
 * Theft detection: if the presented token's hash matches a record that is
 * ALREADY revoked, that means this exact token was already used once
 * before (or stolen and used by an attacker after the legitimate rotation
 * already happened). In that case the entire token family is revoked,
 * forcing a fresh login — this is what makes rotation actually catch token
 * theft instead of just rotating in a vacuum.
 */
export async function refreshSession({ refreshToken, userAgent, ip }) {
  if (!refreshToken) throw ApiError.unauthorized('Missing refresh token');

  const presentedHash = hashToken(refreshToken);
  const record = await RefreshToken.findOne({ tokenHash: presentedHash });

  if (!record) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  if (record.revokedAt) {
    // Reuse of an already-rotated-away token — possible theft. Revoke the
    // whole family so every descendant session is killed.
    await RefreshToken.updateMany(
      { family: record.family, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    logger.warn(
      { userId: record.user.toString(), family: record.family },
      'Refresh token reuse detected — token family revoked'
    );
    throw ApiError.unauthorized('Session invalid. Please log in again.');
  }

  if (record.expiresAt.getTime() < Date.now()) {
    throw ApiError.unauthorized('Refresh token expired. Please log in again.');
  }

  const user = await User.findById(record.user);
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Account is no longer active');
  }

  const { rawToken: newRefreshToken, expiresAt } = await issueRefreshToken({
    userId: user._id,
    family: record.family,
    userAgent,
    ip,
  });

  record.revokedAt = new Date();
  record.replacedByHash = hashToken(newRefreshToken);
  await record.save();

  const accessToken = signAccessToken(user);

  return {
    accessToken,
    refreshToken: newRefreshToken,
    refreshExpiresAt: expiresAt,
    user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
  };
}

/**
 * Revokes the entire token family tied to the presented refresh token —
 * a real logout, not just a client-side token discard.
 */
export async function logout({ refreshToken }) {
  if (!refreshToken) return;

  const presentedHash = hashToken(refreshToken);
  const record = await RefreshToken.findOne({ tokenHash: presentedHash });
  if (!record) return;

  await RefreshToken.updateMany(
    { family: record.family, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return user;
}
