import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

function rateLimitHandler(_req, _res, next) {
  next(ApiError.tooManyRequests());
}

/**
 * Applied to all /api/v1/* routes. Generous, mainly a backstop against
 * unrestricted resource consumption (OWASP API4:2023) rather than a UX gate.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Strict limiter for /auth/login specifically — this is the primary
 * brute-force defense at the network layer, complementing the per-account
 * lockout implemented in the auth service.
 */
export const loginLimiter = rateLimit({
  windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MIN * 60 * 1000,
  max: env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: rateLimitHandler,
});

/**
 * Moderate limiter for the public, unauthenticated /inquiries endpoint —
 * prevents it being used to spam-log fake leads.
 */
export const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
